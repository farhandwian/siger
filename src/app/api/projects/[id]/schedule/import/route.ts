import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Validation schemas
const ScheduleDataSchema = z.object({
  period: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  week: z.number().min(1).max(4),
  planPercentage: z.number().default(0),
  actualPercentage: z.number().default(0),
})

const ActivityImportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['activity', 'subActivity']),
  parentActivity: z.string().optional(),
  satuan: z.string().optional(),
  volumeKontrak: z.number().optional(),
  bobotMC0: z.number().optional(),
  volumeMC0: z.number().optional(),
  scheduleData: z.array(ScheduleDataSchema),
})

const ImportRequestSchema = z.object({
  projectId: z.string(),
  activities: z.array(ActivityImportSchema),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, activities } = ImportRequestSchema.parse(body)

    console.log(`Starting CSV import for project ${projectId} with ${activities.length} items`)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Use transaction to ensure data consistency with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      let activityCount = 0
      let subActivityCount = 0
      let scheduleCount = 0
      let updatedActivities = 0
      let updatedSubActivities = 0
      let updatedSchedules = 0

      // Track created activities to link sub-activities
      const activityMap = new Map<string, string>()

      // Get all existing activities for this project upfront
      const existingActivities = await tx.activity.findMany({
        where: { projectId },
        select: { id: true, name: true }
      })
      const existingActivityMap = new Map(
        existingActivities.map(a => [a.name, a.id])
      )

      // First pass: Create main activities
      const newActivities = activities.filter(a => a.type === 'activity' && !existingActivityMap.has(a.name))
      
      for (const activityData of newActivities) {
        const activity = await tx.activity.create({
          data: {
            projectId,
            name: activityData.name,
            order: activityCount,
          }
        })
        
        existingActivityMap.set(activityData.name, activity.id)
        activityCount++
      }

      // Set up activity map for all activities (existing + new)
      for (const activityData of activities) {
        if (activityData.type === 'activity') {
          const activityId = existingActivityMap.get(activityData.name)
          if (activityId) {
            activityMap.set(activityData.name, activityId)
          }
        }
      }

      // Count updated activities (those that already existed)
      const importedActivityNames = activities.filter(a => a.type === 'activity').map(a => a.name)
      updatedActivities = importedActivityNames.filter(name => 
        existingActivities.some(existing => existing.name === name)
      ).length

      // Second pass: Create sub-activities and schedules
      const subActivitiesData = activities.filter(a => a.type === 'subActivity')
      
      for (const activityData of subActivitiesData) {
        const parentActivityId = activityData.parentActivity 
          ? activityMap.get(activityData.parentActivity)
          : null

        if (!parentActivityId) {
          throw new Error(`Parent activity not found: ${activityData.parentActivity}`)
        }

        // Check if sub-activity already exists
        let subActivity = await tx.subActivity.findFirst({
          where: {
            activityId: parentActivityId,
            name: activityData.name,
          }
        })

        if (!subActivity) {
          subActivity = await tx.subActivity.create({
            data: {
              activityId: parentActivityId,
              name: activityData.name,
              satuan: activityData.satuan,
              volumeKontrak: activityData.volumeKontrak,
              volumeMC0: activityData.volumeMC0,
              bobotMC0: activityData.bobotMC0,
              weight: activityData.bobotMC0 || 0, // Use bobotMC0 as weight
              order: subActivityCount,
            }
          })
          subActivityCount++
        } else {
          // Update existing sub-activity with new data
          subActivity = await tx.subActivity.update({
            where: { id: subActivity.id },
            data: {
              satuan: activityData.satuan,
              volumeKontrak: activityData.volumeKontrak,
              volumeMC0: activityData.volumeMC0,
              bobotMC0: activityData.bobotMC0,
              weight: activityData.bobotMC0 || 0,
            }
          })
          updatedSubActivities++
        }

        // Get existing schedules for this sub-activity to minimize queries
        const existingSchedules = await tx.activitySchedule.findMany({
          where: { subActivityId: subActivity.id },
          select: { id: true, month: true, year: true, week: true }
        })
        
        const existingScheduleMap = new Map(
          existingSchedules.map(s => [`${s.month}-${s.year}-${s.week}`, s.id])
        )

        // Process schedules in batches
        const scheduleUpdates = []
        const scheduleCreates = []
        
        for (const scheduleData of activityData.scheduleData) {
          // Skip if both plan and actual are 0
          if (scheduleData.planPercentage === 0 && scheduleData.actualPercentage === 0) {
            continue
          }

          const scheduleKey = `${scheduleData.month}-${scheduleData.year}-${scheduleData.week}`
          const existingId = existingScheduleMap.get(scheduleKey)

          if (existingId) {
            // Prepare update operation
            scheduleUpdates.push({
              where: { id: existingId },
              data: {
                planPercentage: scheduleData.planPercentage,
                actualPercentage: scheduleData.actualPercentage,
              }
            })
          } else {
            // Prepare create operation and mark as processed to avoid duplicates
            scheduleCreates.push({
              subActivityId: subActivity.id,
              month: scheduleData.month,
              year: scheduleData.year,
              week: scheduleData.week,
              planPercentage: scheduleData.planPercentage,
              actualPercentage: scheduleData.actualPercentage,
            })
            // Add to map to prevent duplicates within same import
            existingScheduleMap.set(scheduleKey, 'pending')
          }
        }

        // Execute updates first (these won't have conflicts)
        for (const updateData of scheduleUpdates) {
          await tx.activitySchedule.update(updateData)
          updatedSchedules++
        }

        // Execute creates one by one to handle any remaining conflicts gracefully
        for (const createData of scheduleCreates) {
          try {
            await tx.activitySchedule.create({ data: createData })
            scheduleCount++
          } catch (error: any) {
            // If still a unique constraint error, try to update instead
            if (error.code === 'P2002') {
              const existing = await tx.activitySchedule.findFirst({
                where: {
                  subActivityId: createData.subActivityId,
                  month: createData.month,
                  year: createData.year,
                  week: createData.week,
                }
              })
              
              if (existing) {
                await tx.activitySchedule.update({
                  where: { id: existing.id },
                  data: {
                    planPercentage: createData.planPercentage,
                    actualPercentage: createData.actualPercentage,
                  }
                })
                updatedSchedules++
              }
            } else {
              throw error // Re-throw if it's a different error
            }
          }
        }
      }

      return {
        activityCount,
        subActivityCount,
        scheduleCount,
        updatedActivities,
        updatedSubActivities,
        updatedSchedules,
      }
    }, {
      maxWait: 20000, // 20 seconds
      timeout: 30000, // 30 seconds
    })

    console.log(`CSV import completed successfully:`, {
      projectId,
      created: { activities: result.activityCount, subActivities: result.subActivityCount, schedules: result.scheduleCount },
      updated: { activities: result.updatedActivities, subActivities: result.updatedSubActivities, schedules: result.updatedSchedules }
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule data imported successfully',
      data: {
        projectId,
        imported: {
          activities: result.activityCount,
          subActivities: result.subActivityCount,
          schedules: result.scheduleCount,
        },
        updated: {
          activities: result.updatedActivities,
          subActivities: result.updatedSubActivities,
          schedules: result.updatedSchedules,
        }
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check existing data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        subActivities: {
          include: {
            schedules: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        activities,
        counts: {
          activities: activities.length,
          subActivities: activities.reduce((sum, a) => sum + a.subActivities.length, 0),
          schedules: activities.reduce((sum, a) => 
            sum + a.subActivities.reduce((subSum, sa) => subSum + sa.schedules.length, 0), 0
          )
        }
      }
    })

  } catch (error) {
    console.error('Get activities error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Validation schemas
const ScheduleDataSchema = z.object({
  period: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  week: z.number().min(1), // Allow up to week 5 for spanning weeks like MEI 26-01
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
  importMode: z.enum(['upsert', 'replace']).default('upsert'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Enhanced validation with detailed error logging
    let validationResult
    try {
      validationResult = ImportRequestSchema.parse(body)
    } catch (validationError: any) {
      console.error('❌ Validation failed:', validationError.message)
      if (validationError.errors) {
        console.error('❌ Validation errors:', JSON.stringify(validationError.errors, null, 2))
      }
      console.error('❌ Received data structure:', {
        hasProjectId: !!body.projectId,
        hasActivities: !!body.activities,
        activitiesLength: body.activities?.length || 0,
        hasImportMode: !!body.importMode,
        importMode: body.importMode,
        firstActivitySample: body.activities?.[0]
          ? {
              name: body.activities[0].name,
              type: body.activities[0].type,
              hasScheduleData: !!body.activities[0].scheduleData,
              scheduleDataLength: body.activities[0].scheduleData?.length || 0,
              firstScheduleSample: body.activities[0].scheduleData?.[0],
            }
          : null,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error: ' + validationError.message,
          details: validationError.errors,
        },
        { status: 400 }
      )
    }

    const { projectId, activities, importMode } = validationResult

    console.log(
      `Starting CSV import for project ${projectId} with ${activities.length} items using ${importMode} mode`
    )

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Use transaction with increased timeout and optimized batch processing
    const result = await prisma.$transaction(
      async tx => {
        let activityCount = 0
        let subActivityCount = 0
        let scheduleCount = 0
        let updatedActivities = 0
        let updatedSubActivities = 0
        let updatedSchedules = 0
        let deletedItems = 0

        // Handle replace mode: delete all existing data first
        if (importMode === 'replace') {
          console.log('🗑️ Replace mode: Deleting all existing project data...')

          // Delete in correct order (foreign key constraints)
          const deletedSchedules = await tx.schedulePlan.deleteMany({
            where: {
              subActivity: {
                activity: {
                  projectId: projectId,
                },
              },
            },
          })

          const deletedSubActivities = await tx.subActivity.deleteMany({
            where: {
              activity: {
                projectId: projectId,
              },
            },
          })

          const deletedActivities = await tx.activity.deleteMany({
            where: { projectId: projectId },
          })

          deletedItems =
            deletedSchedules.count + deletedSubActivities.count + deletedActivities.count
          console.log(
            `🗑️ Deleted: ${deletedSchedules.count} schedules, ${deletedSubActivities.count} sub-activities, ${deletedActivities.count} activities`
          )
        }

        // Track created activities to link sub-activities
        const activityMap = new Map<string, string>()

        // Get existing activities only for upsert mode
        let existingActivityMap = new Map<string, string>()
        if (importMode === 'upsert') {
          const existingActivities = await tx.activity.findMany({
            where: { projectId },
            select: { id: true, name: true },
          })
          existingActivityMap = new Map(existingActivities.map(a => [a.name, a.id]))
        }

        // First pass: Create/update main activities
        const activitiesData = activities.filter(a => a.type === 'activity')
        const newActivities = activitiesData.filter(a => !existingActivityMap.has(a.name))

        for (const activityData of newActivities) {
          const activity = await tx.activity.create({
            data: {
              projectId,
              name: activityData.name,
              order: activityCount,
            },
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

        // Count updated activities (those that already existed in upsert mode)
        const importedActivityNames = activitiesData.map(a => a.name)
        if (importMode === 'upsert') {
          updatedActivities = importedActivityNames.filter(name =>
            existingActivityMap.has(name)
          ).length
        }

        // Second pass: Create sub-activities and schedules in batches
        const subActivitiesData = activities.filter(a => a.type === 'subActivity')

        // Prepare batch data for sub-activities
        const subActivitiesToCreate: Array<{
          activityId: string
          name: string
          satuan?: string
          volume?: number
          weight: number
          order: number
        }> = []
        
        const subActivitiesToUpdate: Array<{
          id: string
          satuan?: string
          volume?: number
          weight: number
        }> = []

        const schedulePlansToUpsert: Array<{
          subActivityId: string
          month: number
          year: number
          week: number
          percentage: number
        }> = []

        const realizationsToUpsert: Array<{
          subActivityId: string
          month: number
          year: number
          week: number
          percentage: number
        }> = []

        // First, get existing sub-activities for updates
        const existingSubActivities = await tx.subActivity.findMany({
          where: {
            activity: {
              projectId: projectId
            }
          },
          select: {
            id: true,
            name: true,
            activityId: true,
            activity: {
              select: {
                name: true
              }
            }
          }
        })

        const existingSubActivityMap = new Map<string, string>()
        existingSubActivities.forEach(sub => {
          const key = `${sub.activity.name}:${sub.name}`
          existingSubActivityMap.set(key, sub.id)
        })

        // Process each sub-activity and prepare batch data
        for (const activityData of subActivitiesData) {
          const parentActivityId = activityData.parentActivity
            ? activityMap.get(activityData.parentActivity)
            : null

          if (!parentActivityId) {
            throw new Error(`Parent activity not found: ${activityData.parentActivity}`)
          }

          const subActivityKey = `${activityData.parentActivity}:${activityData.name}`
          const existingSubActivityId = existingSubActivityMap.get(subActivityKey)

          if (!existingSubActivityId) {
            // Prepare for creation
            subActivitiesToCreate.push({
              activityId: parentActivityId,
              name: activityData.name,
              satuan: activityData.satuan,
              volume: activityData.volumeKontrak,
              weight: activityData.bobotMC0 || 0,
              order: subActivityCount++,
            })
          } else {
            // Prepare for update
            subActivitiesToUpdate.push({
              id: existingSubActivityId,
              satuan: activityData.satuan,
              volume: activityData.volumeKontrak,
              weight: activityData.bobotMC0 || 0,
            })
            updatedSubActivities++
          }
        }

        // Batch create new sub-activities
        const createdSubActivities: { id: string; name: string; activityId: string }[] = []
        if (subActivitiesToCreate.length > 0) {
          // Process in chunks to avoid query size limits
          const chunkSize = 100
          for (let i = 0; i < subActivitiesToCreate.length; i += chunkSize) {
            const chunk = subActivitiesToCreate.slice(i, i + chunkSize)
            const created = await tx.subActivity.createManyAndReturn({
              data: chunk
            })
            createdSubActivities.push(...created)
          }
          subActivityCount += createdSubActivities.length
        }

        // Batch update existing sub-activities
        if (subActivitiesToUpdate.length > 0) {
          for (const updateData of subActivitiesToUpdate) {
            await tx.subActivity.update({
              where: { id: updateData.id },
              data: {
                satuan: updateData.satuan,
                volume: updateData.volume,
                weight: updateData.weight,
              },
            })
          }
        }

        // Update sub-activity mapping with newly created ones
        createdSubActivities.forEach((sub, index) => {
          const originalData = subActivitiesToCreate[index]
          const parentActivityName = Object.keys(activityMap).find(
            key => activityMap.get(key) === originalData.activityId
          )
          if (parentActivityName) {
            const key = `${parentActivityName}:${originalData.name}`
            existingSubActivityMap.set(key, sub.id)
          }
        })

        // Now prepare schedule and realization data using the complete sub-activity mapping
        for (const activityData of subActivitiesData) {
          const subActivityKey = `${activityData.parentActivity}:${activityData.name}`
          const subActivityId = existingSubActivityMap.get(subActivityKey)

          if (!subActivityId) {
            // Skip missing sub-activity and continue
            continue
          }

          // Process schedules and prepare batch data
          for (const scheduleData of activityData.scheduleData) {
            // Skip if both plan and actual are 0
            if (scheduleData.planPercentage === 0 && scheduleData.actualPercentage === 0) {
              continue
            }

            // Prepare schedule plan data
            if (scheduleData.planPercentage > 0) {
              schedulePlansToUpsert.push({
                subActivityId,
                month: scheduleData.month,
                year: scheduleData.year,
                week: scheduleData.week,
                percentage: scheduleData.planPercentage,
              })
            }

            // Prepare realization data
            if (scheduleData.actualPercentage > 0) {
              realizationsToUpsert.push({
                subActivityId,
                month: scheduleData.month,
                year: scheduleData.year,
                week: scheduleData.week,
                percentage: scheduleData.actualPercentage,
              })
            }
          }
        }

        // Batch upsert schedule plans
        if (schedulePlansToUpsert.length > 0) {
          const chunkSize = 50 // Smaller chunks for upsert operations
          for (let i = 0; i < schedulePlansToUpsert.length; i += chunkSize) {
            const chunk = schedulePlansToUpsert.slice(i, i + chunkSize)
            
            // Delete existing records first, then create new ones
            for (const schedule of chunk) {
              await tx.schedulePlan.upsert({
                where: {
                  subActivityId_month_year_week: {
                    subActivityId: schedule.subActivityId,
                    month: schedule.month,
                    year: schedule.year,
                    week: schedule.week,
                  },
                },
                update: {
                  percentage: schedule.percentage,
                },
                create: schedule,
              })
            }
          }
          scheduleCount += schedulePlansToUpsert.length
        }

        // Batch upsert realizations
        if (realizationsToUpsert.length > 0) {
          const chunkSize = 50 // Smaller chunks for upsert operations
          for (let i = 0; i < realizationsToUpsert.length; i += chunkSize) {
            const chunk = realizationsToUpsert.slice(i, i + chunkSize)
            
            for (const realization of chunk) {
              await tx.realization.upsert({
                where: {
                  subActivityId_month_year_week: {
                    subActivityId: realization.subActivityId,
                    month: realization.month,
                    year: realization.year,
                    week: realization.week,
                  },
                },
                update: {
                  percentage: realization.percentage,
                },
                create: realization,
              })
            }
          }
        }

        return {
          activityCount,
          subActivityCount,
          scheduleCount,
          realizationCount: realizationsToUpsert.length,
          updatedActivities,
          updatedSubActivities,
          updatedSchedules,
          deletedItems,
          importMode,
        }
      },
      {
        maxWait: 300000, // 5 minutes - increased for large imports
        timeout: 600000, // 10 minutes timeout for very large CSV files
      }
    )

    console.log(`CSV import completed successfully:`, {
      projectId,
      importMode: result.importMode,
      created: {
        activities: result.activityCount,
        subActivities: result.subActivityCount,
        schedules: result.scheduleCount,
      },
      updated: {
        activities: result.updatedActivities,
        subActivities: result.updatedSubActivities,
        schedules: result.updatedSchedules,
      },
      deleted: result.deletedItems,
    })

    return NextResponse.json({
      success: true,
      message: `Schedule data ${result.importMode === 'replace' ? 'replaced' : 'imported'} successfully`,
      data: {
        projectId,
        importMode: result.importMode,
        imported: {
          activities: result.activityCount,
          subActivities: result.subActivityCount,
          schedules: result.scheduleCount,
          realizations: result.realizationCount,
        },
        updated: {
          activities: result.updatedActivities,
          subActivities: result.updatedSubActivities,
          schedules: result.updatedSchedules,
        },
        ...(result.importMode === 'replace' && { deleted: result.deletedItems }),
      },
    })
  } catch (error) {
    console.error('Import error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
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
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        subActivities: {
          include: {
            schedulePlans: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        activities,
        counts: {
          activities: activities.length,
          subActivities: activities.reduce((sum, a) => sum + a.subActivities.length, 0),
          schedules: activities.reduce(
            (sum, a) =>
              sum + a.subActivities.reduce((subSum: number, sa) => subSum + sa.schedulePlans.length, 0),
            0
          ),
        },
      },
    })
  } catch (error) {
    console.error('Get activities error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

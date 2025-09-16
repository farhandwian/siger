import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Validation schemas for action plan schedule import
const ActionPlanDataSchema = z.object({
  period: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  week: z.number().min(1), // Allow up to week 5 for spanning weeks
  planPercentage: z.number().default(0),
  actualPercentage: z.number().default(0),
})

const ActionPlanActivityImportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['activity', 'subActivity']),
  parentActivity: z.string().optional(),
  satuan: z.string().optional(),
  volumeKontrak: z.number().optional(),
  bobotMC0: z.number().optional(),
  volumeMC0: z.number().optional(),
  scheduleData: z.array(ActionPlanDataSchema),
})

const ActionPlanImportRequestSchema = z.object({
  projectId: z.string(),
  activities: z.array(ActionPlanActivityImportSchema),
  importMode: z.enum(['upsert', 'replace']).default('upsert'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Enhanced validation with detailed error logging
    let validationResult
    try {
      validationResult = ActionPlanImportRequestSchema.parse(body)
    } catch (validationError: any) {
      console.error('❌ Action Plan Validation failed:', validationError.message)
      if (validationError.errors) {
        console.error(
          '❌ Action Plan Validation errors:',
          JSON.stringify(validationError.errors, null, 2)
        )
      }
      console.error('❌ Received data structure:', {
        hasProjectId: !!body.projectId,
        hasActivities: !!body.activities,
        activitiesLength: body.activities?.length || 0,
        hasImportMode: !!body.importMode,
        importMode: body.importMode,
      })
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationError.errors || validationError.message,
        },
        { status: 400 }
      )
    }

    const { projectId, activities, importMode } = validationResult

    console.log('🚀 Action Plan Import starting:', {
      projectId,
      activitiesCount: activities.length,
      importMode,
    })

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let stats = {
      activitiesCreated: 0,
      subActivitiesCreated: 0,
      schedulesCreated: 0,
      schedulesUpdated: 0,
      errors: [] as string[],
    }

    // If replace mode, delete existing action plan schedules first
    if (importMode === 'replace') {
      console.log('🗑️ Replace mode: deleting existing action plan schedules...')

      // Get all activities for this project to delete their action plan schedules
      const projectActivities = await prisma.activity.findMany({
        where: { projectId },
        include: { subActivities: true },
      })

      const activityIds = projectActivities.map(a => a.id)
      const subActivityIds = projectActivities.flatMap(a => a.subActivities?.map(sa => sa.id) || [])

      // Delete existing action plan schedules
      await prisma.actionPlan.deleteMany({
        where: {
          subActivityId: { in: subActivityIds },
        },
      })

      console.log('✅ Existing action plan schedules deleted')
    }

    // Create a transaction for all database operations
    await prisma.$transaction(async tx => {
      // First pass: create/update activities and sub-activities
      const activityMap = new Map<string, string>() // name -> id
      const subActivityMap = new Map<string, string>() // name -> id

      for (const activityData of activities) {
        if (activityData.type === 'activity') {
          // Check if activity already exists
          let activity = await tx.activity.findFirst({
            where: {
              projectId,
              name: activityData.name,
            },
          })

          if (!activity) {
            // Create new activity
            activity = await tx.activity.create({
              data: {
                projectId,
                name: activityData.name,
                order: stats.activitiesCreated,
              },
            })
            stats.activitiesCreated++
            console.log(`✅ Created activity: ${activityData.name}`)
          }

          activityMap.set(activityData.name, activity.id)
        }
      }

      // Second pass: create sub-activities
      for (const activityData of activities) {
        if (activityData.type === 'subActivity' && activityData.parentActivity) {
          const parentActivityId = activityMap.get(activityData.parentActivity)
          if (!parentActivityId) {
            stats.errors.push(`Parent activity not found: ${activityData.parentActivity}`)
            continue
          }

          // Check if sub-activity already exists
          let subActivity = await tx.subActivity.findFirst({
            where: {
              activityId: parentActivityId,
              name: activityData.name,
            },
          })

          if (!subActivity) {
            // Create new sub-activity
            subActivity = await tx.subActivity.create({
              data: {
                activityId: parentActivityId,
                name: activityData.name,
                weight: activityData.bobotMC0 || 0,
                order: stats.subActivitiesCreated,
                satuan: activityData.satuan,
                volume: activityData.volumeKontrak,
              },
            })
            stats.subActivitiesCreated++
            console.log(`✅ Created sub-activity: ${activityData.name}`)
          } else {
            // Update existing sub-activity with additional fields
            await tx.subActivity.update({
              where: { id: subActivity.id },
              data: {
                satuan: activityData.satuan || subActivity.satuan,
                volume: activityData.volumeKontrak ?? subActivity.volume,
                weight: activityData.bobotMC0 ?? subActivity.weight,
              },
            })
            console.log(`✅ Updated sub-activity: ${activityData.name}`)
          }

          subActivityMap.set(activityData.name, subActivity.id)
        }
      }

      // Third pass: create/update action plan schedules
      for (const activityData of activities) {
        if (activityData.scheduleData.length === 0) continue

        let targetActivityId: string | null = null
        let targetSubActivityId: string | null = null

        if (activityData.type === 'activity') {
          targetActivityId = activityMap.get(activityData.name) || null
        } else if (activityData.type === 'subActivity') {
          targetSubActivityId = subActivityMap.get(activityData.name) || null
        }

        if (!targetActivityId && !targetSubActivityId) {
          stats.errors.push(`Could not find activity/sub-activity: ${activityData.name}`)
          continue
        }

        // Process schedule data
        for (const scheduleData of activityData.scheduleData) {
          try {
            // Use upsert logic for action plan schedules
            const whereClause = targetSubActivityId
              ? {
                  subActivityId: targetSubActivityId,
                  month: scheduleData.month,
                  year: scheduleData.year,
                  week: scheduleData.week,
                }
              : {
                  activityId: targetActivityId,
                  month: scheduleData.month,
                  year: scheduleData.year,
                  week: scheduleData.week,
                }

            const existingSchedule = await tx.actionPlan.findFirst({
              where: whereClause,
            })

            if (existingSchedule) {
              // Update existing action plan schedule
              await tx.actionPlan.update({
                where: { id: existingSchedule.id },
                data: {
                  percentage: scheduleData.planPercentage,
                },
              })
              stats.schedulesUpdated++
            } else {
              // Create new action plan schedule
              if (targetSubActivityId) {
                await tx.actionPlan.create({
                  data: {
                    subActivityId: targetSubActivityId,
                    month: scheduleData.month,
                    year: scheduleData.year,
                    week: scheduleData.week,
                    percentage: scheduleData.planPercentage,
                  },
                })
                stats.schedulesCreated++
              }
            }
          } catch (error: any) {
            const errorMsg = `Failed to process schedule for ${activityData.name} - ${scheduleData.period}: ${error.message}`
            stats.errors.push(errorMsg)
            console.error('❌', errorMsg)
          }
        }
      }
    })

    console.log('✅ Action Plan Import completed:', stats)

    return NextResponse.json({
      success: true,
      message: 'Action plan import completed successfully',
      stats,
    })
  } catch (error: any) {
    console.error('❌ Action Plan Import error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error during action plan import',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

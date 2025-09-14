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
            },
          })

          if (!subActivity) {
            subActivity = await tx.subActivity.create({
              data: {
                activityId: parentActivityId,
                name: activityData.name,
                satuan: activityData.satuan,
                volume: activityData.volumeKontrak,
                weight: activityData.bobotMC0 || 0, // Use bobotMC0 as weight
                order: subActivityCount,
              },
            })
            subActivityCount++
          } else {
            // Update existing sub-activity with new data
            subActivity = await tx.subActivity.update({
              where: { id: subActivity.id },
              data: {
                satuan: activityData.satuan,
                volume: activityData.volumeKontrak,
                weight: activityData.bobotMC0 || 0,
              },
            })
            updatedSubActivities++
          }

          // Process schedules using simpler upsert approach to avoid conflicts
          for (const scheduleData of activityData.scheduleData) {
            // Skip if both plan and actual are 0
            if (scheduleData.planPercentage === 0 && scheduleData.actualPercentage === 0) {
              continue
            }

            try {
              await tx.schedulePlan.upsert({
                where: {
                  subActivityId_month_year_week: {
                    subActivityId: subActivity.id,
                    month: scheduleData.month,
                    year: scheduleData.year,
                    week: scheduleData.week,
                  },
                },
                update: {
                  percentage: scheduleData.planPercentage,
                },
                create: {
                  subActivityId: subActivity.id,
                  month: scheduleData.month,
                  year: scheduleData.year,
                  week: scheduleData.week,
                  percentage: scheduleData.planPercentage,
                },
              })
              scheduleCount++
            } catch (error: unknown) {
              console.error('Failed to upsert schedule:', error)
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
          deletedItems,
          importMode,
        }
      },
      {
        maxWait: 120000, // 120 seconds - much longer for large imports
        timeout: 180000, // 180 seconds - 3 minutes timeout
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

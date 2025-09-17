import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Validation schemas for the new CSV format
const ScheduleDataSchema = z.object({
  weekNumber: z.number().min(1).max(72), // 18 months * 4 weeks
  plan: z.number().nullable().default(null),
  realization: z.number().nullable().default(null),
})

const ActivityImportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['activity', 'subActivity']),
  parentActivity: z.string().optional(),
  satuan: z.string().optional(), // Unit field in schema
  volume: z.number().optional(),
  bobot: z.number().optional(), // Weight field (Indonesian: bobot)
  scheduleData: z.array(ScheduleDataSchema).default([]),
})

// Inferred types
type ScheduleData = z.infer<typeof ScheduleDataSchema>
type ActivityImport = z.infer<typeof ActivityImportSchema>

const ImportRequestSchema = z.object({
  projectId: z.string(),
  activities: z.array(ActivityImportSchema),
  importMode: z.enum(['upsert', 'replace']).default('upsert'),
})

// Helper function to parse CSV data into activities
function parseCsvData(csvData: string[][]): ActivityImport[] {
  const activities: ActivityImport[] = []

  if (csvData.length < 2) {
    throw new Error('CSV must have at least header and one data row')
  }

  const headers = csvData[0]

  // Extract week columns (week1, week2, etc.)
  const weekColumns: number[] = []
  headers.forEach((header, index) => {
    if (header.toLowerCase().startsWith('week')) {
      const weekNum = parseInt(header.replace(/week/i, ''))
      if (!isNaN(weekNum)) {
        weekColumns.push(index)
      }
    }
  })

  // Process data rows in pairs (plan row followed by realization row)
  for (let i = 1; i < csvData.length; i += 2) {
    const planRow = csvData[i]
    const realizationRow = csvData[i + 1] || [] // May not exist for last row

    // Skip if this is an empty row or realization-only row
    if (!planRow[1] || planRow[1].trim() === '') continue

    const scheduleData: ScheduleData[] = []

    // Process each week column
    weekColumns.forEach((colIndex, weekIndex) => {
      const weekNumber = weekIndex + 1
      const planValue = planRow[colIndex] ? parseFloat(planRow[colIndex]) : null
      const realizationValue = realizationRow[colIndex]
        ? parseFloat(realizationRow[colIndex])
        : null

      // Only add schedule data if there's actual data
      if (planValue !== null || realizationValue !== null) {
        scheduleData.push({
          weekNumber,
          plan: isNaN(planValue!) ? null : planValue,
          realization: isNaN(realizationValue!) ? null : realizationValue,
        })
      }
    })

    // Create activity object
    const activity: ActivityImport = {
      name: planRow[1]?.trim() || '',
      type: planRow[1]?.includes('•') || planRow[1]?.startsWith('  ') ? 'subActivity' : 'activity',
      satuan: planRow[2]?.trim() || undefined,
      volume: planRow[3] ? parseFloat(planRow[3]) : undefined,
      bobot: planRow[4] ? parseFloat(planRow[4]) : undefined,
      scheduleData,
    }

    // Determine parent activity for sub-activities
    if (activity.type === 'subActivity') {
      // Find the last main activity
      for (let j = activities.length - 1; j >= 0; j--) {
        if (activities[j].type === 'activity') {
          activity.parentActivity = activities[j].name
          break
        }
      }
    }

    // Clean up activity name (remove bullet points, etc.)
    activity.name = activity.name.replace(/^[•\s]+/, '').trim()

    if (activity.name) {
      activities.push(activity)
    }
  }

  return activities
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle CSV data parsing
    let activitiesData: ActivityImport[]

    if (body.csvData) {
      // Parse CSV data into activities
      activitiesData = parseCsvData(body.csvData)
    } else {
      // Direct activities data
      activitiesData = body.activities || []
    }

    // Validate the request
    const validatedData = ImportRequestSchema.parse({
      projectId: body.projectId,
      activities: activitiesData,
      importMode: body.importMode || 'upsert',
    })

    if (!validatedData.activities || validatedData.activities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No activities to import' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Track progress
    const totalSteps = 6 // Steps: parse, validate, delete, activities, sub-activities, schedules
    let currentStep = 2 // Already completed parse and validate

    const updateProgress = (step: number, message: string) => {
      currentStep = step
      const progress = Math.round((step / totalSteps) * 100)
      // Note: In a real implementation, you might want to use Server-Sent Events
      // or WebSockets for real-time progress updates
      void progress
      void message // Acknowledge unused vars for now
    }

    updateProgress(currentStep, 'Starting import process...')

    // Process data in smaller batches to avoid transaction timeouts
    let createdActivities = 0
    let createdSubActivities = 0
    let createdSchedules = 0
    let updatedSchedules = 0

    // If replace mode, delete existing schedules for this project
    if (validatedData.importMode === 'replace') {
      updateProgress(3, 'Clearing existing data...')
      const existingActivities = await prisma.activity.findMany({
        where: { projectId: validatedData.projectId },
        include: { subActivities: true },
      })

      const allSubActivityIds = existingActivities.flatMap(act =>
        act.subActivities.map(sub => sub.id)
      )

      if (allSubActivityIds.length > 0) {
        await prisma.schedule.deleteMany({
          where: {
            subActivityId: { in: allSubActivityIds },
          },
        })
      }
    } else {
      updateProgress(3, 'Skipping data clear...')
    }

    updateProgress(4, 'Processing activities...')
    // Get existing activities and sub-activities to minimize queries
    const existingActivities = await prisma.activity.findMany({
      where: { projectId: validatedData.projectId },
      include: { subActivities: true },
    })

    const activityMap = new Map(existingActivities.map(act => [act.name, act]))
    const subActivityMap = new Map()
    existingActivities.forEach(act => {
      act.subActivities.forEach(sub => {
        subActivityMap.set(`${act.id}-${sub.name}`, sub)
      })
    })

    // Process activities first
    const activitiesToCreate = validatedData.activities
      .filter(act => act.type === 'activity' && !activityMap.has(act.name))
      .map(act => ({
        projectId: validatedData.projectId,
        name: act.name,
      }))

    if (activitiesToCreate.length > 0) {
      await prisma.activity.createMany({
        data: activitiesToCreate,
        skipDuplicates: true,
      })
      createdActivities = activitiesToCreate.length

      // Refresh activity map with new activities
      const newActivities = await prisma.activity.findMany({
        where: {
          projectId: validatedData.projectId,
          name: { in: activitiesToCreate.map(a => a.name) },
        },
        include: { subActivities: true },
      })
      newActivities.forEach(act => activityMap.set(act.name, act))
    }

    // Process sub-activities in batches
    const subActivitiesToProcess = validatedData.activities.filter(
      act => act.type === 'subActivity'
    )

    // Prepare batch data for sub-activities
    const subActivitiesToCreate = []
    const subActivitiesToUpdate = []
    const schedulesToCreate = []
    const schedulesToUpdate = []

    for (const activityData of subActivitiesToProcess) {
      const parentActivity = activityMap.get(activityData.parentActivity || '')
      if (!parentActivity) continue

      const subActivityKey = `${parentActivity.id}-${activityData.name}`
      const existingSubActivity = subActivityMap.get(subActivityKey)

      if (existingSubActivity) {
        // Prepare for batch update
        subActivitiesToUpdate.push({
          where: { id: existingSubActivity.id },
          data: {
            satuan: activityData.satuan,
            volume: activityData.volume,
            weight: activityData.bobot || 0,
          },
        })

        // Prepare schedules for this existing sub-activity
        for (const scheduleData of activityData.scheduleData) {
          if (scheduleData.plan !== null || scheduleData.realization !== null) {
            const existingSchedule = await prisma.schedule.findUnique({
              where: {
                subActivityId_weekNumber: {
                  subActivityId: existingSubActivity.id,
                  weekNumber: scheduleData.weekNumber,
                },
              },
            })

            if (existingSchedule) {
              schedulesToUpdate.push({
                where: { id: existingSchedule.id },
                data: {
                  plan: scheduleData.plan || 0,
                  realization: scheduleData.realization || 0,
                },
              })
            } else {
              schedulesToCreate.push({
                subActivityId: existingSubActivity.id,
                weekNumber: scheduleData.weekNumber,
                plan: scheduleData.plan || 0,
                realization: scheduleData.realization || 0,
              })
            }
          }
        }
      } else {
        // Prepare for batch create
        subActivitiesToCreate.push({
          activityId: parentActivity.id,
          name: activityData.name,
          satuan: activityData.satuan,
          volume: activityData.volume,
          weight: activityData.bobot || 0,
          scheduleData: activityData.scheduleData, // Store temporarily
        })
      }
    }

    // Execute batch operations
    updateProgress(5, 'Processing sub-activities...')

    // 1. Batch update existing sub-activities
    for (const update of subActivitiesToUpdate) {
      await prisma.subActivity.update(update)
    }

    // 2. Batch create new sub-activities
    const newSubActivities = await prisma.subActivity.createMany({
      data: subActivitiesToCreate.map(item => ({
        activityId: item.activityId,
        name: item.name,
        satuan: item.satuan,
        volume: item.volume,
        weight: item.weight,
      })),
      skipDuplicates: true,
    })
    createdSubActivities = newSubActivities.count

    // 3. Get the newly created sub-activities to create their schedules
    if (subActivitiesToCreate.length > 0) {
      const createdSubActivitiesData = await prisma.subActivity.findMany({
        where: {
          activityId: { in: subActivitiesToCreate.map(s => s.activityId) },
          name: { in: subActivitiesToCreate.map(s => s.name) },
        },
      })

      // Prepare schedules for newly created sub-activities
      for (let i = 0; i < subActivitiesToCreate.length; i++) {
        const subActivityData = subActivitiesToCreate[i]
        const createdSubActivity = createdSubActivitiesData.find(
          s => s.activityId === subActivityData.activityId && s.name === subActivityData.name
        )

        if (createdSubActivity && subActivityData.scheduleData) {
          for (const scheduleData of subActivityData.scheduleData) {
            if (scheduleData.plan !== null || scheduleData.realization !== null) {
              schedulesToCreate.push({
                subActivityId: createdSubActivity.id,
                weekNumber: scheduleData.weekNumber,
                plan: scheduleData.plan || 0,
                realization: scheduleData.realization || 0,
              })
            }
          }
        }
      }
    }

    // 4. Batch update existing schedules
    for (const update of schedulesToUpdate) {
      await prisma.schedule.update(update)
    }
    updatedSchedules = schedulesToUpdate.length

    // 5. Batch create new schedules
    updateProgress(6, 'Creating schedules...')
    if (schedulesToCreate.length > 0) {
      const newSchedules = await prisma.schedule.createMany({
        data: schedulesToCreate,
        skipDuplicates: true,
      })
      createdSchedules = newSchedules.count
    }

    const result = {
      createdActivities,
      createdSubActivities,
      createdSchedules,
      updatedSchedules,
      totalActivities: validatedData.activities.length,
      progress: 100, // Add final progress indicator
    }

    return NextResponse.json({
      success: true,
      message: 'Activities and schedules imported successfully',
      data: result,
    })
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    // Get all activities and sub-activities with their schedules for this project
    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        subActivities: {
          include: {
            schedules: {
              orderBy: { weekNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: activities,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

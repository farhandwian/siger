import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Activities API for a specific project with optional schedule data
 * 
 * GET /api/projects/[id]/activities?includeSchedules={boolean}
 * Returns activities with optional embedded schedule data (all weeks when enabled)
 */

const GetActivitiesQuerySchema = z.object({
  includeSchedules: z.coerce.boolean().default(false),
})

const ScheduleSchema = z.object({
  id: z.string(),
  weekNumber: z.number(),
  plan: z.number().nullable(),
  actionPlan: z.number().nullable(),
  realization: z.number().nullable(),
})

const SubActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number(),
  order: z.number(),
  satuan: z.string().nullable(),
  volume: z.number().nullable(),
  schedules: z.array(ScheduleSchema).optional(),
})

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  subActivities: z.array(SubActivitySchema),
})

const ActivitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActivitySchema),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    // Validate project ID format
    const projectIdSchema = z.string().min(1, 'Project ID is required')
    const projectId = projectIdSchema.parse(id)
    
    // Parse query parameters
    const queryParams = GetActivitiesQuerySchema.parse(Object.fromEntries(searchParams))

    // Get activities for project with new unified Schedule model
    const activities = await prisma.activity.findMany({
      where: {
        projectId,
      },
      include: {
        subActivities: {
          include: {
            // Only include schedules if requested (all weeks)
            schedules: queryParams.includeSchedules ? {
              select: {
                id: true,
                weekNumber: true,
                plan: true,
                actionPlan: true,
                realization: true,
              },
              orderBy: {
                weekNumber: 'asc'
              }
            } : false
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' },
    })

    // Validate response data with new schema
    const validatedData = ActivitiesResponseSchema.parse({
      success: true,
      data: activities,
    })

    return NextResponse.json(validatedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activities',
      },
      { status: 500 }
    )
  }
}

const CreateActivitySchema = z.object({
  name: z.string().min(1, 'Activity name is required'),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate project ID format
    const projectIdSchema = z.string().min(1, 'Project ID is required')
    const projectId = projectIdSchema.parse(id)

    // Validate request body
    const validatedData = CreateActivitySchema.parse(body)

    // Get current max order
    const maxOrderActivity = await prisma.activity.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    // Create activity with new unified schema
    const activity = await prisma.activity.create({
      data: {
        name: validatedData.name,
        projectId: projectId,
        order: (maxOrderActivity?.order || 0) + 1,
      },
      include: {
        subActivities: {
          include: {
            schedules: {
              select: {
                id: true,
                weekNumber: true,
                plan: true,
                actionPlan: true,
                realization: true,
              },
              orderBy: {
                weekNumber: 'asc'
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
    })

    // Validate response data
    const validatedActivity = ActivitySchema.parse(activity)

    return NextResponse.json(
      {
        success: true,
        data: validatedActivity,
        message: 'Kegiatan berhasil ditambahkan',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create activity',
      },
      { status: 500 }
    )
  }
}

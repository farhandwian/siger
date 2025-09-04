import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateActivitySchema, ActivitySchema } from '@/lib/schemas'
import { z } from 'zod'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate project ID format
    const projectIdSchema = z.string().min(1, 'Project ID is required')
    const projectId = projectIdSchema.parse(id)

    // Get activities for project
    const activities = await prisma.activity.findMany({
      where: {
        projectId,
      },
      include: {
        subActivities: {
          orderBy: { order: 'asc' },
          include: {
            schedules: true,
          },
        },
        schedules: true,
      },
      orderBy: { order: 'asc' },
    })

    // Validate response data
    const validatedActivities = z.array(ActivitySchema).parse(activities)

    return Response.json({
      success: true,
      data: validatedActivities,
    })
  } catch (error) {
    console.error('Error fetching activities:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch activities',
      },
      { status: 500 }
    )
  }
}

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

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        name: validatedData.name,
        projectId: projectId,
        order: (maxOrderActivity?.order || 0) + 1,
      },
      include: {
        subActivities: {
          orderBy: { order: 'asc' },
          include: {
            schedules: true,
          },
        },
        schedules: true,
      },
    })

    // Validate response data
    const validatedActivity = ActivitySchema.parse(activity)

    return Response.json(
      {
        success: true,
        data: validatedActivity,
        message: 'Kegiatan berhasil ditambahkan',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating activity:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to create activity',
      },
      { status: 500 }
    )
  }
}

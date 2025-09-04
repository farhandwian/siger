import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateActivitySchema, ActivitySchema } from '@/lib/schemas'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { activityId } = await params

    // Validate activity ID format
    const activityIdSchema = z.string().min(1, 'Activity ID is required')
    const validatedActivityId = activityIdSchema.parse(activityId)

    // Get activity
    const activity = await prisma.activity.findUnique({
      where: {
        id: validatedActivityId,
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

    if (!activity) {
      return Response.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      )
    }

    // Validate response data
    const validatedActivity = ActivitySchema.parse(activity)

    return Response.json({
      success: true,
      data: validatedActivity,
    })
  } catch (error) {
    console.error('Error fetching activity:', error)

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
        error: 'Failed to fetch activity',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { activityId } = await params
    const body = await request.json()

    // Validate activity ID format
    const activityIdSchema = z.string().min(1, 'Activity ID is required')
    const validatedActivityId = activityIdSchema.parse(activityId)

    // Validate request body
    const validatedData = UpdateActivitySchema.parse(body)

    // Update activity
    const activity = await prisma.activity.update({
      where: {
        id: validatedActivityId,
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.weight !== undefined && { weight: validatedData.weight }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
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

    return Response.json({
      success: true,
      data: validatedActivity,
      message: 'Kegiatan berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating activity:', error)

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
        error: 'Failed to update activity',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { activityId } = await params

    // Validate activity ID format
    const activityIdSchema = z.string().min(1, 'Activity ID is required')
    const validatedActivityId = activityIdSchema.parse(activityId)

    // Delete activity
    await prisma.activity.delete({
      where: {
        id: validatedActivityId,
      },
    })

    return Response.json({
      success: true,
      message: 'Kegiatan berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting activity:', error)

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
        error: 'Failed to delete activity',
      },
      { status: 500 }
    )
  }
}

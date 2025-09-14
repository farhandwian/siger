import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateSubActivitySchema, SubActivitySchema } from '@/lib/schemas'
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

    // Get sub-activities for activity
    const subActivities = await prisma.subActivity.findMany({
      where: {
        activityId: validatedActivityId,
      },
      include: {
        schedules: true,
      },
      orderBy: { order: 'asc' },
    })

    // Validate response data
    const validatedSubActivities = z.array(SubActivitySchema).parse(subActivities)

    return Response.json({
      success: true,
      data: validatedSubActivities,
    })
  } catch (error) {
    console.error('Error fetching sub-activities:', error)

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
        error: 'Failed to fetch sub-activities',
      },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const validatedData = CreateSubActivitySchema.parse(body)

    // Get current max order
    const maxOrderSubActivity = await prisma.subActivity.findFirst({
      where: { activityId: validatedActivityId },
      orderBy: { order: 'desc' },
    })

    // Create sub-activity
    const subActivity = await prisma.subActivity.create({
      data: {
        name: validatedData.name,
        satuan: validatedData.satuan,
        volumeKontrak: validatedData.volumeKontrak,
        volumeMC0: validatedData.volumeMC0,
        bobotMC0: validatedData.bobotMC0,
        weight: validatedData.weight,
        activityId: validatedActivityId,
        order: (maxOrderSubActivity?.order || 0) + 1,
      },
      include: {
        schedules: true,
      },
    })

    // Validate response data
    const validatedSubActivity = SubActivitySchema.parse(subActivity)

    return Response.json(
      {
        success: true,
        data: validatedSubActivity,
        message: 'Sub kegiatan berhasil ditambahkan',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sub-activity:', error)

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
        error: 'Failed to create sub-activity',
      },
      { status: 500 }
    )
  }
}

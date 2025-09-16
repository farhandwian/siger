import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateScheduleSchema } from '@/lib/schemas/schedule'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/schedules/[id] - Get a specific schedule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        plan: true,
        actionPlan: true,
        realization: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PATCH /api/schedules/[id] - Update a specific schedule
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateScheduleSchema.parse(body)

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if weekNumber or subActivityId is being updated
    if (validatedData.weekNumber || validatedData.subActivityId) {
      const conflictCheck = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          subActivityId: validatedData.subActivityId || existingSchedule.subActivityId,
          weekNumber: validatedData.weekNumber || existingSchedule.weekNumber
        }
      })

      if (conflictCheck) {
        return NextResponse.json(
          { success: false, error: 'Schedule already exists for this week and sub-activity' },
          { status: 409 }
        )
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        plan: true,
        actionPlan: true,
        realization: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - Delete a specific schedule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    await prisma.schedule.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Schedule deleted successfully' }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}

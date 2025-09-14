// API route for individual Action Plan Schedule operations - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UpdateActionPlanScheduleSchema } from '@/lib/schemas/action-plan-schedule'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)

    const actionPlanSchedule = await prisma.actionPlanSchedule.findUnique({
      where: { id },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
          },
        },
      },
    })

    if (!actionPlanSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: actionPlanSchedule,
    })
  } catch (error) {
    console.error('Error fetching action plan schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)
    const body = await req.json()
    const data = UpdateActionPlanScheduleSchema.parse(body)

    // Check if the action plan schedule exists
    const existingSchedule = await prisma.actionPlanSchedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    // If updating time-related fields, check for conflicts
    if (data.month || data.year || data.week) {
      const conflictWhere: any = {
        id: { not: id }, // Exclude current record
        month: data.month || existingSchedule.month,
        year: data.year || existingSchedule.year,
        week: data.week || existingSchedule.week,
      }

      // Check for conflicts based on existing activity/subactivity
      if (existingSchedule.activityId) {
        conflictWhere.activityId = existingSchedule.activityId
      } else if (existingSchedule.subActivityId) {
        conflictWhere.subActivityId = existingSchedule.subActivityId
      }

      const conflictingSchedule = await prisma.actionPlanSchedule.findFirst({
        where: conflictWhere,
      })

      if (conflictingSchedule) {
        return NextResponse.json(
          {
            success: false,
            error: 'Another action plan schedule already exists for this time period',
          },
          { status: 409 }
        )
      }
    }

    const updatedSchedule = await prisma.actionPlanSchedule.update({
      where: { id },
      data,
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
    })
  } catch (error) {
    console.error('Error updating action plan schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)

    // Check if the action plan schedule exists
    const existingSchedule = await prisma.actionPlanSchedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    await prisma.actionPlanSchedule.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Action plan schedule deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting action plan schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

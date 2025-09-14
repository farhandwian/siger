// API route for individual Action Plan Schedule operations - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UpdateActionPlanScheduleSchema } from '@/lib/schemas/action-plan-schedule'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = ParamsSchema.parse(params)

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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = ParamsSchema.parse(params)
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

    // Use upsert with composite unique keys to handle conflicts gracefully
    // This will update existing records with the same activity/subactivity + time combination
    const updatedSchedule = await prisma.actionPlanSchedule.upsert({
      where: {
        ...(existingSchedule.activityId
          ? {
              activityId_month_year_week: {
                activityId: existingSchedule.activityId,
                month: data.month || existingSchedule.month,
                year: data.year || existingSchedule.year,
                week: data.week || existingSchedule.week,
              },
            }
          : {
              subActivityId_month_year_week: {
                subActivityId: existingSchedule.subActivityId!,
                month: data.month || existingSchedule.month,
                year: data.year || existingSchedule.year,
                week: data.week || existingSchedule.week,
              },
            }),
      },
      update: {
        planPercentage: data.planPercentage,
        actualPercentage: data.actualPercentage,
        // Only update time fields if they're provided
        ...(data.month !== undefined && { month: data.month }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.week !== undefined && { week: data.week }),
      },
      create: {
        month: data.month || existingSchedule.month,
        year: data.year || existingSchedule.year,
        week: data.week || existingSchedule.week,
        planPercentage: data.planPercentage || 0,
        actualPercentage: data.actualPercentage || 0,
        ...(existingSchedule.activityId
          ? { activityId: existingSchedule.activityId }
          : { subActivityId: existingSchedule.subActivityId }),
      },
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = ParamsSchema.parse(params)

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

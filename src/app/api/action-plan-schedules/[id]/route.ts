// API route for individual Action Plan SchedulePlan operations - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UpdateActionPlanSchema } from '@/lib/schemas/action-plan-scheduleplan'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = ParamsSchema.parse(params)

    const actionPlan = await prisma.actionPlan.findUnique({
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

    if (!actionPlan) {
      return NextResponse.json(
        { success: false, error: 'Action plan scheduleplan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: actionPlan,
    })
  } catch (error) {
    console.error('Error fetching action plan scheduleplan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduleplan ID', details: error.errors },
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
    const data = UpdateActionPlanSchema.parse(body)

    // Check if the action plan scheduleplan exists
    const existingSchedulePlan = await prisma.actionPlan.findUnique({
      where: { id },
    })

    if (!existingSchedulePlan) {
      return NextResponse.json(
        { success: false, error: 'Action plan scheduleplan not found' },
        { status: 404 }
      )
    }

    // Use upsert with composite unique keys to handle conflicts gracefully
    // This will update existing records with the same activity/subactivity + time combination
    const updatedSchedulePlan = await prisma.actionPlan.upsert({
      where: {
        ...(existingSchedulePlan.activityId
          ? {
              activityId_month_year_week: {
                activityId: existingSchedulePlan.activityId,
                month: data.month || existingSchedulePlan.month,
                year: data.year || existingSchedulePlan.year,
                week: data.week || existingSchedulePlan.week,
              },
            }
          : {
              subActivityId_month_year_week: {
                subActivityId: existingSchedulePlan.subActivityId!,
                month: data.month || existingSchedulePlan.month,
                year: data.year || existingSchedulePlan.year,
                week: data.week || existingSchedulePlan.week,
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
        month: data.month || existingSchedulePlan.month,
        year: data.year || existingSchedulePlan.year,
        week: data.week || existingSchedulePlan.week,
        planPercentage: data.planPercentage || 0,
        actualPercentage: data.actualPercentage || 0,
        ...(existingSchedulePlan.activityId
          ? { activityId: existingSchedulePlan.activityId }
          : { subActivityId: existingSchedulePlan.subActivityId }),
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
      data: updatedSchedulePlan,
    })
  } catch (error) {
    console.error('Error updating action plan scheduleplan:', error)

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

    // Check if the action plan scheduleplan exists
    const existingSchedulePlan = await prisma.actionPlan.findUnique({
      where: { id },
    })

    if (!existingSchedulePlan) {
      return NextResponse.json(
        { success: false, error: 'Action plan scheduleplan not found' },
        { status: 404 }
      )
    }

    await prisma.actionPlan.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Action plan scheduleplan deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting action plan scheduleplan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduleplan ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

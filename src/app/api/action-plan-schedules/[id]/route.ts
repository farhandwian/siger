// API route for individual Action Plan Schedule operations - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UpdateScheduleSchema } from '@/lib/schemas/schedule'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = ParamsSchema.parse(params)

    const actionPlan = await prisma.schedule.findUnique({
      where: { id },
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        actionPlan: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!actionPlan) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: actionPlan,
    })
  } catch (error) {
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
    const data = UpdateScheduleSchema.parse(body)

    // Check if the action plan schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if time fields are being updated
    if (data.weekNumber || data.subActivityId) {
      const conflictCheck = await prisma.schedule.findFirst({
        where: {
          subActivityId: data.subActivityId || existingSchedule.subActivityId,
          weekNumber: data.weekNumber || existingSchedule.weekNumber,
          NOT: { id }, // Exclude current record
        },
      })

      if (conflictCheck) {
        return NextResponse.json(
          { success: false, error: 'Action plan schedule already exists for this time period' },
          { status: 409 }
        )
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        subActivityId: data.subActivityId || existingSchedule.subActivityId,
        weekNumber: data.weekNumber || existingSchedule.weekNumber,
        actionPlan: data.actionPlan !== undefined ? data.actionPlan : existingSchedule.actionPlan,
      },
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        actionPlan: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
    })
  } catch (error) {
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
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule not found' },
        { status: 404 }
      )
    }

    await prisma.schedule.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Action plan schedule deleted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateSchedulePlanSchema } from '@/lib/schemas'
import { z } from 'zod'

// GET /api/schedule-plans/[id] - Fetch a single schedule plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const schedulePlan = await prisma.schedulePlan.findUnique({
      where: { id },
      select: {
        id: true,
        subActivityId: true,
        month: true,
        year: true,
        week: true,
        percentage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!schedulePlan) {
      return NextResponse.json(
        { success: false, error: 'Schedule plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schedulePlan
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule plan' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule-plans/[id] - Update a schedule plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateSchedulePlanSchema.parse(body)

    // Check if schedule plan exists
    const existing = await prisma.schedulePlan.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule plan not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if key fields are being updated
    if (validatedData.subActivityId || validatedData.year || validatedData.month || validatedData.week) {
      const conflictWhere = {
        id: { not: id },
        subActivityId: validatedData.subActivityId || existing.subActivityId,
        year: validatedData.year || existing.year,
        month: validatedData.month || existing.month,
        week: validatedData.week || existing.week
      }

      const conflict = await prisma.schedulePlan.findFirst({
        where: conflictWhere
      })

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Schedule plan already exists for this period' },
          { status: 409 }
        )
      }
    }

    const schedulePlan = await prisma.schedulePlan.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        subActivityId: true,
        month: true,
        year: true,
        week: true,
        percentage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: schedulePlan
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update schedule plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule-plans/[id] - Delete a schedule plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const existing = await prisma.schedulePlan.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule plan not found' },
        { status: 404 }
      )
    }

    await prisma.schedulePlan.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      data: { id }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule plan' },
      { status: 500 }
    )
  }
}

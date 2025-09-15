import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating realizations
const UpdateRealizationSchema = z.object({
  percentage: z.number().min(0).max(100).optional(),
  subActivityId: z.string().cuid().optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
  week: z.number().int().min(1).max(4).optional(),
})

// GET /api/realizations/[id] - Fetch a single realization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const realization = await prisma.realization.findUnique({
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

    if (!realization) {
      return NextResponse.json(
        { success: false, error: 'Realization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: realization })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/realizations/[id] - Update a realization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateRealizationSchema.parse(body)

    // Check if realization exists
    const existing = await prisma.realization.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Realization not found' },
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

      const conflict = await prisma.realization.findFirst({
        where: conflictWhere
      })

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Realization already exists for this period' },
          { status: 409 }
        )
      }
    }

    const realization = await prisma.realization.update({
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

    return NextResponse.json({ success: true, data: realization })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/realizations/[id] - Delete a realization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const existing = await prisma.realization.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Realization not found' },
        { status: 404 }
      )
    }

    await prisma.realization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

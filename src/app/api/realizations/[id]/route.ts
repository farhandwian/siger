import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateRealizationSchema } from '@/lib/schemas'
import { z } from 'zod'

// GET /api/realizations/[id] - Fetch a single realization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const realization = await prisma.realization.findUnique({
      where: { id: params.id },
      include: {
        subActivity: {
          include: {
            activity: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })

    if (!realization) {
      return NextResponse.json(
        { success: false, error: 'Realization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: realization
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch realization' },
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
    const body = await request.json()
    const validatedData = UpdateRealizationSchema.parse(body)

    // Check if realization exists
    const existing = await prisma.realization.findUnique({
      where: { id: params.id }
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
        id: { not: params.id },
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
      where: { id: params.id },
      data: validatedData,
      include: {
        subActivity: {
          include: {
            activity: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: realization
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update realization' },
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
    const existing = await prisma.realization.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Realization not found' },
        { status: 404 }
      )
    }

    await prisma.realization.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete realization' },
      { status: 500 }
    )
  }
}

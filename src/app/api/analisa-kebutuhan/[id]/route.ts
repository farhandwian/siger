import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  UpdateAnalisaKebutuhanSchema,
  AnalisaKebutuhanDetailResponseSchema,
  ErrorResponseSchema,
} from '@/lib/schemas/analisa-kebutuhan'

/**
 * GET /api/analisa-kebutuhan/[id]
 * Fetch single analisa kebutuhan entry by ID
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const analisaKebutuhan = await prisma.analisaKebutuhan.findUnique({
      where: { id },
      include: {
        kebutuhan: {
          include: {
            kategoriKebutuhan: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!analisaKebutuhan) {
      return NextResponse.json(
        { success: false, error: 'Analisa kebutuhan not found' },
        { status: 404 }
      )
    }

    const response = {
      success: true as const,
      data: {
        ...analisaKebutuhan,
        kebutuhan: {
          ...analisaKebutuhan.kebutuhan,
          kategoriKebutuhan: analisaKebutuhan.kebutuhan.kategoriKebutuhan,
        },
        subActivity: analisaKebutuhan.subActivity,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching analisa kebutuhan:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/analisa-kebutuhan/[id]
 * Update existing analisa kebutuhan entry
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const validatedData = UpdateAnalisaKebutuhanSchema.parse({ ...body, id })

    // Check if the entry exists
    const existingEntry = await prisma.analisaKebutuhan.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Analisa kebutuhan not found' },
        { status: 404 }
      )
    }

    // If sub activity or kebutuhan is being changed, validate they exist
    if (validatedData.subActivityId) {
      const subActivity = await prisma.subActivity.findUnique({
        where: { id: validatedData.subActivityId },
      })

      if (!subActivity) {
        return NextResponse.json(
          { success: false, error: 'Sub activity not found' },
          { status: 404 }
        )
      }
    }

    if (validatedData.kebutuhanId) {
      const kebutuhan = await prisma.kebutuhan.findUnique({
        where: { id: validatedData.kebutuhanId },
      })

      if (!kebutuhan) {
        return NextResponse.json({ success: false, error: 'Kebutuhan not found' }, { status: 404 })
      }
    }

    // Check for duplicate if key fields are being changed
    if (validatedData.subActivityId || validatedData.kebutuhanId || validatedData.tanggal) {
      const checkData = {
        subActivityId: validatedData.subActivityId || existingEntry.subActivityId,
        kebutuhanId: validatedData.kebutuhanId || existingEntry.kebutuhanId,
        tanggal: validatedData.tanggal || existingEntry.tanggal,
      }

      const duplicateEntry = await prisma.analisaKebutuhan.findUnique({
        where: {
          subActivityId_kebutuhanId_tanggal: checkData,
        },
      })

      if (duplicateEntry && duplicateEntry.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Entry already exists for this sub activity, kebutuhan, and date',
          },
          { status: 409 }
        )
      }
    }

    // Update the entry
    const { id: _, ...updateData } = validatedData
    const updatedAnalisaKebutuhan = await prisma.analisaKebutuhan.update({
      where: { id },
      data: updateData,
      include: {
        kebutuhan: {
          include: {
            kategoriKebutuhan: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const response = {
      success: true as const,
      data: {
        ...updatedAnalisaKebutuhan,
        kebutuhan: {
          ...updatedAnalisaKebutuhan.kebutuhan,
          kategoriKebutuhan: updatedAnalisaKebutuhan.kebutuhan.kategoriKebutuhan,
        },
        subActivity: updatedAnalisaKebutuhan.subActivity,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating analisa kebutuhan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/analisa-kebutuhan/[id]
 * Delete analisa kebutuhan entry
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if the entry exists
    const existingEntry = await prisma.analisaKebutuhan.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Analisa kebutuhan not found' },
        { status: 404 }
      )
    }

    // Delete the entry
    await prisma.analisaKebutuhan.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Analisa kebutuhan deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting analisa kebutuhan:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

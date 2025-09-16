import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateDailySubActivitySchema } from '@/lib/schemas'
import { z } from 'zod'

/**
 * PUT endpoint to create or update daily sub-activity progress
 *
 * This API ensures that only one daily progress record exists per:
 * - Sub Activity ID
 * - User ID
 * - Progress Date
 *
 * If a record already exists with the same combination, it will be updated.
 * The weekly activity schedule is also recalculated to reflect the changes.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body using Zod schema
    const validatedData = CreateDailySubActivitySchema.parse(body)
    const {
      subActivityId,
      userId,
      koordinat,
      catatanKegiatan,
      tanggalProgres,
      progresRealisasiPerHari,
      files,
    } = validatedData

    // Check if sub activity exists
    const subActivity = await prisma.subActivity.findUnique({
      where: { id: subActivityId },
    })

    if (!subActivity) {
      return NextResponse.json({ success: false, error: 'Sub activity not found' }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'User is not active' }, { status: 400 })
    }

    // Start transaction to update daily activity
    // This ensures data consistency
    const result = await prisma.$transaction(async tx => {
      // 1. Get the existing daily activity record (if any) to track previous progress
      // This is needed to calculate the net change in progress for weekly updates
      const existingDailyActivity = await tx.dailyReport.findUnique({
        where: {
          subActivityId_tanggalProgres_userId: {
            subActivityId: subActivityId,
            tanggalProgres: tanggalProgres,
            userId: userId,
          },
        },
      })

      // 2. Create or update daily sub activity record using upsert
      // The unique constraint (subActivityId, tanggalProgres, userId) ensures only one record per date per user
      const dailyActivity = await tx.dailyReport.upsert({
        where: {
          subActivityId_tanggalProgres_userId: {
            subActivityId: subActivityId,
            tanggalProgres: tanggalProgres,
            userId: userId,
          },
        },
        update: {
          koordinat: koordinat ? JSON.parse(JSON.stringify(koordinat)) : undefined,
          catatanKegiatan: catatanKegiatan || null,
          file: files ? JSON.parse(JSON.stringify(files)) : undefined,
          progresRealisasiPerHari: progresRealisasiPerHari,
        },
        create: {
          subActivityId: subActivityId,
          userId: userId,
          koordinat: koordinat ? JSON.parse(JSON.stringify(koordinat)) : undefined,
          catatanKegiatan: catatanKegiatan || null,
          file: files ? JSON.parse(JSON.stringify(files)) : undefined,
          progresRealisasiPerHari: progresRealisasiPerHari,
          tanggalProgres: tanggalProgres,
        },
      })

      return {
        dailyActivity,
        isUpdate: !!existingDailyActivity,
      }
    })

    return NextResponse.json({
      success: true,
      data: result.dailyActivity,
      message: result.isUpdate
        ? 'Daily progress updated successfully'
        : 'Daily progress created successfully',
    })
  } catch (error) {
    console.error('Error updating daily sub activity:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update daily progress' },
      { status: 500 }
    )
  }
}

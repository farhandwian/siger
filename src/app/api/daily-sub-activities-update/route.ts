import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateDailySubActivitySchema } from '@/lib/schemas'
import { z } from 'zod'

// Helper function to get week number from date
function getWeekInfo(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  // Get the first Monday of the month
  const firstDay = new Date(year, month - 1, 1)
  const firstMonday = new Date(firstDay)

  // Find the first Monday
  const daysToMonday = (8 - firstDay.getDay()) % 7
  firstMonday.setDate(1 + daysToMonday)

  // Calculate week number
  const diffTime = date.getTime() - firstMonday.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1

  return {
    year,
    month,
    week: Math.max(1, Math.min(5, week)), // Ensure week is between 1-5
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CreateDailySubActivitySchema.parse(body)
    const {
      sub_activities_id,
      user_id,
      koordinat,
      catatan_kegiatan,
      tanggal_progres,
      progres_realisasi_per_hari,
      files,
    } = validatedData

    // Check if sub activity exists
    const subActivity = await prisma.subActivity.findUnique({
      where: { id: sub_activities_id },
    })

    if (!subActivity) {
      return NextResponse.json({ success: false, error: 'Sub activity not found' }, { status: 404 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'User is not active' }, { status: 400 })
    }

    // Get week information from the date
    const weekInfo = getWeekInfo(tanggal_progres)

    // Start transaction to update both daily activity and weekly schedule
    const result = await prisma.$transaction(async tx => {
      // 1. Create or update daily sub activity record
      const dailyActivity = await tx.dailySubActivity.upsert({
        where: {
          subActivityId_tanggalProgres_userId: {
            subActivityId: sub_activities_id,
            tanggalProgres: tanggal_progres,
            userId: user_id,
          },
        },
        update: {
          koordinat: koordinat ? JSON.parse(JSON.stringify(koordinat)) : undefined,
          catatanKegiatan: catatan_kegiatan || null,
          file: files ? JSON.parse(JSON.stringify(files)) : undefined,
          progresRealisasiPerHari: progres_realisasi_per_hari,
        },
        create: {
          subActivityId: sub_activities_id,
          userId: user_id,
          koordinat: koordinat ? JSON.parse(JSON.stringify(koordinat)) : undefined,
          catatanKegiatan: catatan_kegiatan || null,
          file: files ? JSON.parse(JSON.stringify(files)) : undefined,
          progresRealisasiPerHari: progres_realisasi_per_hari,
          tanggalProgres: tanggal_progres,
        },
      })

      // 2. Get existing weekly schedule to add to current value
      const existingSchedule = await tx.activitySchedule.findUnique({
        where: {
          subActivityId_month_year_week: {
            subActivityId: sub_activities_id,
            month: weekInfo.month,
            year: weekInfo.year,
            week: weekInfo.week,
          },
        },
      })

      // 3. Calculate new progress by adding current daily progress to existing weekly progress
      const currentActualPercentage = existingSchedule?.actualPercentage || 0
      const newActualPercentage = Math.min(
        currentActualPercentage + progres_realisasi_per_hari,
        100
      )

      // 4. Update or create the weekly schedule record
      await tx.activitySchedule.upsert({
        where: {
          subActivityId_month_year_week: {
            subActivityId: sub_activities_id,
            month: weekInfo.month,
            year: weekInfo.year,
            week: weekInfo.week,
          },
        },
        update: {
          actualPercentage: newActualPercentage,
        },
        create: {
          subActivityId: sub_activities_id,
          month: weekInfo.month,
          year: weekInfo.year,
          week: weekInfo.week,
          planPercentage: 0, // Default plan percentage
          actualPercentage: Math.min(progres_realisasi_per_hari, 100),
        },
      })

      return dailyActivity
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Daily progress updated successfully',
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

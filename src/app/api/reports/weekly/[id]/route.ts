import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WeeklyReportDetailsResponseSchema } from '@/lib/schemas/reports'

const prisma = new PrismaClient()

/**
 * GET /api/reports/weekly/[id]
 *
 * Fetch detailed weekly report data for preview modal
 * Returns hierarchical activity structure with calculated fields based on Schedule data
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params

    // Fetch weekly report basic info
    const weeklyReport = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            pekerjaan: true,
            satker: { select: { name: true } },
          },
        },
      },
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { success: false, error: 'Weekly report not found' },
        { status: 404 }
      )
    }

    // Fetch project activities with sub-activities and schedules
    const activities = await prisma.activity.findMany({
      where: { projectId: weeklyReport.projectId },
      include: {
        subActivities: {
          include: {
            schedules: {
              select: {
                weekNumber: true,
                plan: true,
                actionPlan: true,
                realization: true,
              },
              orderBy: { weekNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    // Type definitions for schedule calculations
    type ScheduleData = {
      weekNumber: number
      plan: number | null
      actionPlan: number | null
      realization: number | null
    }

    // Helper function to calculate cumulative values from week 1 to target week
    const calculateCumulative = (schedules: ScheduleData[], targetWeek: number, field: 'plan' | 'actionPlan' | 'realization') => {
      return schedules
        .filter(schedule => schedule.weekNumber >= 1 && schedule.weekNumber <= targetWeek)
        .reduce((sum, schedule) => sum + (schedule[field] || 0), 0)
    }

    // Helper function to get schedule data for specific week
    const getWeekSchedule = (schedules: ScheduleData[], weekNumber: number) => {
      return schedules.find(schedule => schedule.weekNumber === weekNumber) || {
        plan: 0,
        actionPlan: 0,
        realization: 0
      }
    }

    // Process activities with calculations
    const processedActivities = activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      activityType: 'MAIN_ACTIVITY' as const,
      parentActivityId: null,
      romanNumber: '', // You may want to add this to Activity model
      subNumber: null,
      sat: '',
      volume: 0,
      bobot: 0,
      // Main activities don't have direct calculations
      realisasiMinggulalu_volume: 0,
      targetMingguIni: 0,
      realisasiMingguIni: 0,
      status: 'TERCAPAI' as const,
      kumulatifMingguIni_volume: 0,
      realisasiMinggulalu_bobot: 0,
      persentaseItemPekerjaan: 0,
      persentaseGrafikProgress: 0,
      persentaseRencanaKumulatif: 0,
      statusKumulatif: 'TERCAPAI',
      persentaseSeluruhPekerjaan: 0,
      subActivities: activity.subActivities.map((subActivity, index) => {
        const currentWeek = weeklyReport.weekNumber
        const previousWeek = currentWeek - 1
        
        // Get schedule data
        const currentWeekSchedule = getWeekSchedule(subActivity.schedules, currentWeek)
        const totalVolume = subActivity.volume || 0
        const weight = subActivity.weight || 0
        
        // A. Kemajuan Pekerjaan calculations
        // A1. Realisasi s/d minggu lalu (B1 / (weight * volume))
        const realisasiSdMingguLalu = previousWeek > 0 
          ? calculateCumulative(subActivity.schedules, previousWeek, 'realization')
          : 0
        const realisasiMinggulalu_volume = totalVolume > 0 && weight > 0 
          ? realisasiSdMingguLalu / (weight * totalVolume) 
          : 0

        // A2. Target minggu ini (action plan * volume)
        const targetMingguIni = (currentWeekSchedule.actionPlan || 0) * totalVolume

        // A5. Kumulatif s/d minggu ini (B6 / (weight * volume))
        const kumulatifRealization = calculateCumulative(subActivity.schedules, currentWeek, 'realization')
        const kumulatifMingguIni_volume = totalVolume > 0 && weight > 0 
          ? kumulatifRealization / (weight * totalVolume) 
          : 0

        // A3. Realisasi minggu ini (A5 - A1)
        const realisasiMingguIni = kumulatifMingguIni_volume - realisasiMinggulalu_volume

        // A4. Status (A3 - A2 comparison)
        const targetPerUnit = totalVolume > 0 ? targetMingguIni / totalVolume : 0
        const statusValue = realisasiMingguIni - targetPerUnit
        const status = statusValue < 0 ? 'TIDAK_TERCAPAI' : 'TERCAPAI'

        // B. % Terhadap calculations
        // B1. Realisasi S/D Minggu Lalu (already calculated above)
        const realisasiMinggulalu_bobot = realisasiSdMingguLalu

        // B2. Item Pekerjaan (B6 / weight * 100)
        const persentaseItemPekerjaan = weight > 0 
          ? (kumulatifRealization / weight) * 100 
          : 0

        // B3. Grafik Pemenuhan Progress (to be implemented based on requirements)
        const persentaseGrafikProgress = 0 // Placeholder

        // B4. Rencana Kumulatif Pekerjaan (cumulative action plan)
        const rencanaKumulatif = calculateCumulative(subActivity.schedules, currentWeek, 'actionPlan')
        const persentaseRencanaKumulatif = rencanaKumulatif

        // B5. Status Kumulatif (B4 - B6 comparison)
        const statusKumulatifValue = rencanaKumulatif - kumulatifRealization
        const statusKumulatif = statusKumulatifValue > 0 ? 'TIDAK_TERCAPAI' : 'TERCAPAI'

        // B6. Seluruh Pekerjaan (same as B1)
        const persentaseSeluruhPekerjaan = realisasiMinggulalu_bobot

        return {
          id: subActivity.id,
          name: subActivity.name,
          activityType: 'SUB_ACTIVITY' as const,
          parentActivityId: activity.id,
          romanNumber: '',
          subNumber: index + 1,
          sat: subActivity.satuan || '',
          volume: totalVolume,
          bobot: weight,
          realisasiMinggulalu_volume,
          targetMingguIni: targetPerUnit, // Already normalized to unit value
          realisasiMingguIni,
          status,
          kumulatifMingguIni_volume,
          realisasiMinggulalu_bobot,
          persentaseItemPekerjaan,
          persentaseGrafikProgress,
          persentaseRencanaKumulatif,
          statusKumulatif,
          persentaseSeluruhPekerjaan,
        }
      })
    }))

    // Format the response data
    const responseData = {
      id: weeklyReport.id,
      projectId: weeklyReport.projectId,
      projectName: weeklyReport.project.pekerjaan || 'Unknown Project',
      weekNumber: weeklyReport.weekNumber,
      startDate: weeklyReport.startDate.toISOString().split('T')[0],
      endDate: weeklyReport.endDate.toISOString().split('T')[0],
      reportPeriod: `${weeklyReport.startDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} - ${weeklyReport.endDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      satker: weeklyReport.satker || weeklyReport.project.satker?.name || null,
      kegiatan: weeklyReport.kegiatan || null,
      proyekPekerjaan: weeklyReport.proyekPekerjaan || weeklyReport.project.pekerjaan || null,
      activities: processedActivities.flatMap(activity => [
        // Main activity
        {
          id: activity.id,
          name: activity.name,
          activityType: activity.activityType,
          parentActivityId: activity.parentActivityId,
          romanNumber: activity.romanNumber,
          subNumber: activity.subNumber,
          sat: activity.sat,
          volume: activity.volume,
          bobot: activity.bobot,
          realisasiMinggulalu_volume: activity.realisasiMinggulalu_volume,
          targetMingguIni: activity.targetMingguIni,
          realisasiMingguIni: activity.realisasiMingguIni,
          status: activity.status,
          kumulatifMingguIni_volume: activity.kumulatifMingguIni_volume,
          realisasiMinggulalu_bobot: activity.realisasiMinggulalu_bobot,
          persentaseItemPekerjaan: activity.persentaseItemPekerjaan,
          persentaseGrafikProgress: activity.persentaseGrafikProgress,
          persentaseRencanaKumulatif: activity.persentaseRencanaKumulatif,
          statusKumulatif: activity.statusKumulatif,
          persentaseSeluruhPekerjaan: activity.persentaseSeluruhPekerjaan,
        },
        // Sub activities
        ...activity.subActivities
      ]),
    }

    // Validate response with Zod
    const validatedResponse = WeeklyReportDetailsResponseSchema.parse({
      success: true,
      data: responseData,
    })

    return NextResponse.json(validatedResponse)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

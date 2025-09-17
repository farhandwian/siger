import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request schema for creating weekly reports
const createWeeklyReportSchema = z.object({
  projectId: z.string(),
  weekNumber: z.number().min(1),
  // startDate and endDate will be calculated based on project timeline and weekNumber
})

/**
 * POST /api/reports/weekly
 *
 * Flow Points 2 & 4: Create weekly report from project data
 * - Pull data from chosen project and specified week
 * - Generate hierarchical activity structure
 * - Calculate cumulative values and percentages
 * - Create WeeklyReport and WeeklyReportActivity records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, weekNumber } = createWeeklyReportSchema.parse(body)

    // Get project information
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        satker: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Calculate start and end dates for the selected week
    // Use tanggalSpmk as project start date instead of tanggalKontrak
    const projectStartDate = project.tanggalSpmk ? new Date(project.tanggalSpmk) : new Date()
    const weekStartDate = new Date(projectStartDate)
    weekStartDate.setDate(projectStartDate.getDate() + (weekNumber - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)

    // Get all activities and sub-activities for this project with their schedules
    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        subActivities: {
          include: {
            schedules: {
              where: {
                weekNumber: {
                  lte: weekNumber, // Get all weeks up to current week for cumulative calculation
                },
              },
              orderBy: {
                weekNumber: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    // Check if a report already exists for this project and week
    const existingReport = await prisma.weeklyReport.findFirst({
      where: {
        projectId,
        weekNumber,
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'Weekly report already exists for this week' },
        { status: 409 }
      )
    }

    // Create the weekly report
    const weeklyReport = await prisma.weeklyReport.create({
      data: {
        projectId,
        weekNumber,
        startDate: weekStartDate,
        endDate: weekEndDate,
        satker: project.satker?.name || 'Unknown Satker',
        kegiatan: 'Irigasi dan Rawa II', // Default value as per sample
        proyekPekerjaan: project.pekerjaan || 'Unknown Project',
        status: 'DRAFT',
      },
    })

    // Generate weekly report activities
    let activityIndex = 1

    for (const activity of activities) {
      // Create main activity record (header row)
      const mainActivity = await prisma.weeklyReportActivity.create({
        data: {
          weeklyReportId: weeklyReport.id,
          name: activity.name,
          displayOrder: activityIndex * 1000, // Leave space for sub-activities
          romanNumber: convertToRoman(activityIndex),
          // Main activities don't have data, just act as headers
        },
      })

      let subActivityIndex = 1

      // Create sub-activity records with actual data according to the specific calculation formulas
      for (const subActivity of activity.subActivities) {
        // Get schedule data for calculations
        const currentWeekSchedule = subActivity.schedules.find(s => s.weekNumber === weekNumber)
        const allWeeksUpToCurrent = subActivity.schedules.filter(s => s.weekNumber <= weekNumber)

        // Get volume and weight from subactivity
        const volume = subActivity.volume || 1 // Avoid division by zero
        const weight = subActivity.weight || 0

        // B. % Terhadap section calculations (calculated first as they're used in A section)

        // B1: Realisasi s/d minggu = cumulative realization week1 to chosen week
        const realisasiSdMinggu = allWeeksUpToCurrent.reduce(
          (sum, schedule) => sum + (schedule.realization || 0),
          0
        )

        // B4: Rencana kumulatif = cumulative action_plan week1 to chosen week
        const rencanaKumulatif = allWeeksUpToCurrent.reduce(
          (sum, schedule) => sum + (schedule.actionPlan || 0),
          0
        )

        // B6: Kumulatif s/d minggu ini (this will be calculated after A5)
        // For now, we'll use the same as realisasiSdMinggu as it represents cumulative realization
        const kumulatifSdMingguIni = realisasiSdMinggu

        // A. Kemajuan Pekerjaan section calculations

        // A1: Realisasi s/d minggu lalu = B1 / (weight * volume)
        const realisasiMinggulalu_volume = realisasiSdMinggu / (weight * volume)

        // A2: Target minggu ini = action_plan * volume
        const targetMingguIni = (currentWeekSchedule?.actionPlan || 0) * volume

        // A5: Kumulatif s/d minggu ini = B6 / (weight * volume)
        const kumulatifMingguIni_volume = kumulatifSdMingguIni / (weight * volume)

        // A3: Realisasi minggu ini = A5 - A1
        const realisasiMingguIni = kumulatifMingguIni_volume - realisasiMinggulalu_volume

        // A4: Status = A3 - A2 comparison (if < 0 then "TIDAK_TERCAPAI" else "TERCAPAI")
        const statusComparison = realisasiMingguIni - targetMingguIni
        const status = statusComparison < 0 ? 'TIDAK_TERCAPAI' : 'TERCAPAI'

        // B. % Terhadap section - continued calculations

        // B2: Item pekerjaan = B6 / (weight * 100)
        const persentaseItemPekerjaan =
          weight > 0 ? (kumulatifSdMingguIni / (weight * 100)) * 100 : 0

        // B3: Grafik pemenuhan progress (using current week realization vs action plan)
        const persentaseGrafikProgress =
          targetMingguIni > 0 ? (realisasiMingguIni / targetMingguIni) * 100 : 0

        // B5: Status = B4 - B6 comparison (if > 0 then "TIDAK_TERCAPAI" else "TERCAPAI")
        const statusKumulatifComparison = rencanaKumulatif - kumulatifSdMingguIni
        const statusKumulatif = statusKumulatifComparison > 0 ? 'TIDAK_TERCAPAI' : 'TERCAPAI'

        // B6: Seluruh pekerjaan = B1 (realisasiSdMinggu)
        const persentaseSeluruhPekerjaan = realisasiSdMinggu

        await prisma.weeklyReportActivity.create({
          data: {
            weeklyReportId: weeklyReport.id,
            parentActivityId: mainActivity.id,
            sourceSubActivityId: subActivity.id,
            sourceScheduleWeekNumber: weekNumber,

            // From SubActivity model (static data)
            name: subActivity.name, // URAIAN
            sat: subActivity.satuan || 'Unit', // SAT
            volume: volume, // VOLUME
            bobot: weight, // BOBOT (%)

            // A. Kemajuan Pekerjaan section (dynamic week data) - using correct field names
            realisasiMinggulalu: realisasiMinggulalu_volume, // A1
            targetMingguIni: targetMingguIni, // A2
            realisasiMingguIni: realisasiMingguIni, // A3
            statusKemajuanPekerjaan: status, // A4
            kumulatifMingguIni: kumulatifMingguIni_volume, // A5

            // B. % Terhadap section - calculated percentage fields
            persentaseRealisasiMingguLalu: Math.min(
              Math.max(realisasiMinggulalu_volume * weight, 0),
              100
            ), // New field for weighted previous week
            persentaseItemPekerjaan: Math.min(Math.max(persentaseItemPekerjaan, 0), 100), // B2
            persentaseGrafikProgress: Math.min(Math.max(persentaseGrafikProgress, 0), 100), // B3
            persentaseRencanaKumulatif: Math.min(Math.max(rencanaKumulatif, 0), 100), // B4 as percentage
            statusKumulatif: statusKumulatif, // B5
            persentaseSeluruhPekerjaan: persentaseSeluruhPekerjaan, // B6

            // Organization fields
            displayOrder: activityIndex * 1000 + subActivityIndex,
            subNumber: subActivityIndex,
          },
        })

        subActivityIndex++
      }

      activityIndex++
    }

    // Return the created report with activities
    const completeReport = await prisma.weeklyReport.findUnique({
      where: { id: weeklyReport.id },
      include: {
        activities: {
          include: {
            parentActivity: true,
            subActivities: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        project: {
          include: {
            satker: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: completeReport,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create weekly report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to convert numbers to Roman numerals
 */
function convertToRoman(num: number): string {
  const romanNumerals = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ] as const

  let result = ''
  let n = num

  for (const [roman, value] of romanNumerals) {
    while (n >= value) {
      result += roman
      n -= value
    }
  }

  return result
}

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
    // Assuming project starts from tanggalSpmk and each week is 7 days
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

      // Create sub-activity records with actual data
      for (const subActivity of activity.subActivities) {
        // Calculate values from Schedule data
        const currentWeekSchedule = subActivity.schedules.find(s => s.weekNumber === weekNumber)
        const previousWeeksSchedules = subActivity.schedules.filter(s => s.weekNumber < weekNumber)

        // Calculate cumulative realization up to previous week (REALISASI s/d MINGGU LALU)
        const realisasiMinggulalu_volume = previousWeeksSchedules.reduce(
          (sum, schedule) => sum + (schedule.realization || 0),
          0
        )

        // Current week values from Schedule model
        const targetMingguIni = currentWeekSchedule?.actionPlan || 0 // TARGET MINGGU INI
        const realisasiMingguIni = currentWeekSchedule?.realization || 0 // REALISASI MINGGU INI

        // Calculate cumulative up to current week (KUMULATIF s/d MINGGU INI)
        const kumulatifMingguIni_volume = realisasiMinggulalu_volume + realisasiMingguIni

        // Status determination
        const status = realisasiMingguIni >= targetMingguIni ? 'TERCAPAI' : 'TIDAK_TERCAPAI'

        // Calculate percentages - simplified business logic
        const volume = subActivity.volume || 1 // Avoid division by zero
        const persentaseItemPekerjaan = (kumulatifMingguIni_volume / volume) * 100
        const persentaseGrafikProgress =
          targetMingguIni > 0 ? (realisasiMingguIni / targetMingguIni) * 100 : 0

        await prisma.weeklyReportActivity.create({
          data: {
            weeklyReportId: weeklyReport.id,
            parentActivityId: mainActivity.id,
            sourceSubActivityId: subActivity.id,
            sourceScheduleWeekNumber: weekNumber,

            // From SubActivity model (static data)
            name: subActivity.name, // URAIAN
            sat: subActivity.satuan || 'Unit', // SAT
            volume: subActivity.volume || 0, // VOLUME
            bobot: subActivity.weight || 0, // BOBOT (%)

            // From Schedule model calculations (dynamic week data)
            realisasiMinggulalu_volume: realisasiMinggulalu_volume, // REALISASI s/d MINGGU LALU
            targetMingguIni: targetMingguIni, // TARGET MINGGU INI
            realisasiMingguIni: realisasiMingguIni, // REALISASI MINGGU INI
            status: status, // STATUS
            kumulatifMingguIni_volume: kumulatifMingguIni_volume, // KUMULATIF s/d MINGGU INI

            // Calculated percentage fields (% TERHADAP section)
            persentaseItemPekerjaan: Math.min(persentaseItemPekerjaan, 100),
            persentaseGrafikProgress: Math.min(persentaseGrafikProgress, 100),
            persentaseRencanaKumulatif: Math.min(persentaseItemPekerjaan, 100),
            statusKumulatif: status === 'TERCAPAI' ? 'Tercapai' : 'Tidak Tercapai',
            persentaseSeluruhPekerjaan: (persentaseItemPekerjaan * (subActivity.weight || 0)) / 100,

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

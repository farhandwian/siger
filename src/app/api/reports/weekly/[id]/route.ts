import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WeeklyReportDetailsResponseSchema } from '@/lib/schemas/reports'

const prisma = new PrismaClient()

/**
 * GET /api/reports/weekly/[id]
 *
 * Fetch detailed weekly report data for preview modal
 * Returns hierarchical activity structure with all calculation fields
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Fetch weekly report with activities
    const weeklyReport = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            pekerjaan: true,
            satker: { select: { name: true } },
          },
        },
        activities: {
          orderBy: [{ parentActivityId: 'asc' }, { displayOrder: 'asc' }],
        },
      },
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { success: false, error: 'Weekly report not found' },
        { status: 404 }
      )
    }

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
      activities: weeklyReport.activities.map(activity => ({
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
      })),
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

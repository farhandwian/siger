import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/weekly-reports/[id]
 * Fetch weekly report data by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch weekly report with activities
    const weeklyReport = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { displayOrder: 'asc' },
        },
        project: {
          select: {
            id: true,
            pekerjaan: true,
          },
        },
      },
    })

    if (!weeklyReport) {
      return Response.json(
        { success: false, error: 'Weekly report not found' },
        { status: 404 }
      )
    }

    // Group activities by parent
    const mainActivities = weeklyReport.activities.filter(
      activity => !activity.parentActivityId
    )

    const groupedActivities = mainActivities.map(mainActivity => ({
      ...mainActivity,
      subActivities: weeklyReport.activities.filter(
        activity => activity.parentActivityId === mainActivity.id
      ),
    }))

    return Response.json({
      success: true,
      data: {
        ...weeklyReport,
        activities: groupedActivities,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching weekly report:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch weekly report' },
      { status: 500 }
    )
  }
}
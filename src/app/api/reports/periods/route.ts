import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query schema for filtering by project
const periodQuerySchema = z.object({
  projectId: z.string().optional(),
})

/**
 * GET /api/reports/periods
 *
 * Flow Point 1: Get period filter data based on project weeks
 * - If projectId provided: return min/max weeks for that specific project
 * - If no projectId: return global min/max weeks from all projects
 *
 * Returns period range that can be used for report creation and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = periodQuerySchema.parse({
      projectId: searchParams.get('projectId') || undefined,
    })

    let weekRangeQuery

    if (query.projectId) {
      // Get min/max weeks for specific project
      weekRangeQuery = await prisma.schedule.aggregate({
        where: {
          subActivity: {
            activity: {
              projectId: query.projectId,
            },
          },
        },
        _min: {
          weekNumber: true,
        },
        _max: {
          weekNumber: true,
        },
      })
    } else {
      // Get global min/max weeks from all projects
      weekRangeQuery = await prisma.schedule.aggregate({
        _min: {
          weekNumber: true,
        },
        _max: {
          weekNumber: true,
        },
      })
    }

    // Also get project details if specific project requested
    let projectInfo = null
    if (query.projectId) {
      projectInfo = await prisma.project.findUnique({
        where: { id: query.projectId },
        select: {
          id: true,
          pekerjaan: true,
          satker: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      })
    }

    const periodData = {
      minWeek: weekRangeQuery._min.weekNumber || 1,
      maxWeek: weekRangeQuery._max.weekNumber || 1,
      totalWeeks: (weekRangeQuery._max.weekNumber || 1) - (weekRangeQuery._min.weekNumber || 1) + 1,
      projectId: query.projectId || null,
      projectInfo,
    }

    return NextResponse.json({
      success: true,
      data: periodData,
    })
  } catch (error) {
    console.error('Error fetching period data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch period data',
      },
      { status: 500 }
    )
  }
}

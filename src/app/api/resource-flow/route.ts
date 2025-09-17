/**
 * API route for Resource Flow data
 * GET /api/resource-flow - Fetch analisa kebutuhan data grouped by activity and sub-activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Query schema for resource flow data
const ResourceFlowQuerySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
})

/**
 * GET /api/resource-flow
 * Fetch analisa kebutuhan data with related sub-activities, activities, and schedules
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = ResourceFlowQuerySchema.parse(Object.fromEntries(searchParams))

    // Fetch analisa kebutuhan data with all necessary relations
    const analisaKebutuhanData = await prisma.analisaKebutuhan.findMany({
      where: {
        subActivity: {
          activity: {
            projectId: query.projectId,
          },
        },
      },
      include: {
        subActivity: {
          include: {
            activity: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        kebutuhan: {
          include: {
            kategoriKebutuhan: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
        resourceFlowSchedules: {
          orderBy: {
            tanggal: 'asc',
          },
        },
      },
      orderBy: [
        {
          subActivity: {
            activity: {
              name: 'asc',
            },
          },
        },
        {
          subActivity: {
            name: 'asc',
          },
        },
        {
          kebutuhan: {
            kategoriKebutuhan: {
              nama: 'asc',
            },
          },
        },
        {
          kebutuhan: {
            nama: 'asc',
          },
        },
      ],
    })

    return NextResponse.json({
      success: true,
      data: analisaKebutuhanData,
    })
  } catch (error) {
    console.error('Error fetching resource flow data:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch resource flow data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

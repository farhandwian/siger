import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  projectId: z.string().optional(), // Optional filter by project
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      projectId: searchParams.get('projectId') || undefined,
    }

    const validatedParams = QuerySchema.parse(queryParams)
    const { page, limit, projectId } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause for subActivities filter
    const subActivityWhere: any = {}
    if (projectId) {
      subActivityWhere.activity = {
        projectId: projectId,
      }
    }

    // First, get all unique subActivityIds with their latest tanggalProgres
    const latestEntriesRaw = await prisma.dailySubActivity.groupBy({
      by: ['subActivityId'],
      _max: {
        tanggalProgres: true,
      },
      where: subActivityWhere.activity
        ? {
            subActivity: subActivityWhere,
          }
        : undefined,
    })

    if (!latestEntriesRaw.length) {
      return NextResponse.json({
        success: true,
        data: [],
        latestDate: null,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Get the overall latest date for response
    const globalLatestDate = latestEntriesRaw
      .map(entry => entry._max.tanggalProgres)
      .filter(date => date !== null)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

    // Create conditions to find the actual records
    const orConditions = latestEntriesRaw
      .filter(entry => entry._max.tanggalProgres !== null)
      .map(entry => ({
        subActivityId: entry.subActivityId,
        tanggalProgres: entry._max.tanggalProgres!,
      }))

    if (!orConditions.length) {
      return NextResponse.json({
        success: true,
        data: [],
        latestDate: globalLatestDate,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Get the actual daily activities with latest dates per subActivityId
    const [dailyActivities, total] = await Promise.all([
      prisma.dailySubActivity.findMany({
        where: {
          OR: orConditions,
        },
        skip,
        take: limit,
        orderBy: [{ tanggalProgres: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          subActivityId: true,
          userId: true,
          koordinat: true,
          catatanKegiatan: true,
          file: true,
          progresRealisasiPerHari: true,
          tanggalProgres: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
          subActivity: {
            select: {
              id: true,
              name: true,
              satuan: true,
              volumeKontrak: true,
              weight: true,
              activity: {
                select: {
                  id: true,
                  name: true,
                  project: {
                    select: {
                      id: true,
                      pekerjaan: true,
                      penyediaJasa: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.dailySubActivity.count({
        where: {
          OR: orConditions,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: dailyActivities,
      latestDate: globalLatestDate,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching latest daily sub activities:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch latest daily activities' },
      { status: 500 }
    )
  }
}

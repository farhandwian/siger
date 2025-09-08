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

    // Get the latest date from daily_sub_activities
    const latestDateResult = await prisma.dailySubActivity.findFirst({
      orderBy: { tanggalProgres: 'desc' },
      select: { tanggalProgres: true },
    })

    if (!latestDateResult) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    const latestDate = latestDateResult.tanggalProgres

    // Build where clause
    const where: any = {
      tanggalProgres: latestDate,
    }

    // Add project filter if provided
    if (projectId) {
      where.subActivity = {
        activity: {
          projectId: projectId,
        },
      }
    }

    // Get daily activities for the latest date (one per sub activity)
    const [dailyActivities, total] = await Promise.all([
      prisma.dailySubActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subActivityId: true,
          koordinat: true,
          catatanKegiatan: true,
          file: true,
          progresRealisasiPerHari: true,
          tanggalProgres: true,
          createdAt: true,
          updatedAt: true,
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
      prisma.dailySubActivity.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: dailyActivities,
      latestDate,
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

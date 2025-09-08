import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const DailyUpdateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  subActivityId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sortBy: z
    .enum(['tanggalProgres', 'createdAt', 'progresRealisasiPerHari'])
    .default('tanggalProgres'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      projectId: searchParams.get('projectId'),
      userId: searchParams.get('userId'),
      subActivityId: searchParams.get('subActivityId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    }

    const validatedParams = DailyUpdateQuerySchema.parse(queryParams)
    const {
      page,
      limit,
      search,
      projectId,
      userId,
      subActivityId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Text search in activity names, sub activity names, user names, or notes
    if (search) {
      where.OR = [
        { catatanKegiatan: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { subActivity: { name: { contains: search, mode: 'insensitive' } } },
        { subActivity: { activity: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Filter by project
    if (projectId) {
      where.subActivity = {
        ...where.subActivity,
        activity: {
          ...where.subActivity?.activity,
          projectId: projectId,
        },
      }
    }

    // Filter by user
    if (userId) {
      where.userId = userId
    }

    // Filter by sub activity
    if (subActivityId) {
      where.subActivityId = subActivityId
    }

    // Filter by date range
    if (startDate || endDate) {
      where.tanggalProgres = {}
      if (startDate) {
        where.tanggalProgres.gte = startDate
      }
      if (endDate) {
        where.tanggalProgres.lte = endDate
      }
    }

    // Get daily updates with pagination
    const [dailyUpdates, total] = await Promise.all([
      prisma.dailySubActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
              phoneNumber: true,
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
                      tanggalKontrak: true,
                      akhirKontrak: true,
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
      data: dailyUpdates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        projectId,
        userId,
        subActivityId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching daily updates:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily updates' },
      { status: 500 }
    )
  }
}

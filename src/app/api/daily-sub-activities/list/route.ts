import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  DailySubActivitiesQuerySchema,
  DailySubActivitiesResponseSchema,
  DailySubActivitiesErrorResponseSchema,
} from '@/lib/schemas/daily-sub-activities'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const parsedQuery = DailySubActivitiesQuerySchema.parse(queryParams)

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      projectId,
      activityId,
      subActivityId,
      userId,
      startDate,
      endDate,
    } = parsedQuery

    // Build where clause for filtering
    const whereClause: Prisma.DailySubActivityWhereInput = {
      // userId, // Always filter by the specified user ID - TEMPORARILY DISABLED
    }

    // Add filters
    if (subActivityId) {
      whereClause.subActivityId = subActivityId
    } else if (activityId) {
      whereClause.subActivity = {
        activityId,
      }
    } else if (projectId) {
      whereClause.subActivity = {
        activity: {
          projectId,
        },
      }
    }

    // Add search filter for sub activity name
    if (search) {
      whereClause.subActivity = {
        ...whereClause.subActivity,
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }
    }

    // Add date range filter
    if (startDate || endDate) {
      const dateFilter: any = {}
      if (startDate) {
        dateFilter.gte = startDate
      }
      if (endDate) {
        dateFilter.lte = endDate
      }
      whereClause.tanggalProgres = dateFilter
    }

    // Build order by clause
    let orderBy: Prisma.DailySubActivityOrderByWithRelationInput = {}

    switch (sortBy) {
      case 'updatedAt':
        orderBy.updatedAt = sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = sortOrder
        break
      case 'tanggalProgres':
        orderBy.tanggalProgres = sortOrder
        break
      default:
        orderBy.updatedAt = 'desc'
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      prisma.dailySubActivity.findMany({
        where: whereClause,
        orderBy,
        skip,
        take,
        include: {
          subActivity: {
            include: {
              activity: {
                include: {
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
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.dailySubActivity.count({
        where: whereClause,
      }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Format response data
    const formattedData = data.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    // Build response
    const response = {
      success: true as const,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        projectId,
        activityId,
        subActivityId,
        userId,
        search,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    }

    // Validate response before sending
    const validatedResponse = DailySubActivitiesResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Error in GET /api/daily-sub-activities/list:', error)

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const errorResponse = {
        success: false as const,
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: error,
      }
      return NextResponse.json(DailySubActivitiesErrorResponseSchema.parse(errorResponse), {
        status: 400,
      })
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const errorResponse = {
        success: false as const,
        error: 'Database Error',
        message: 'Failed to retrieve daily sub activities',
        details: {
          code: error.code,
          meta: error.meta,
        },
      }
      return NextResponse.json(DailySubActivitiesErrorResponseSchema.parse(errorResponse), {
        status: 500,
      })
    }

    // Handle generic errors
    const errorResponse = {
      success: false as const,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
    }

    return NextResponse.json(DailySubActivitiesErrorResponseSchema.parse(errorResponse), {
      status: 500,
    })
  }
}

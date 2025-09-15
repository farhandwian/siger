import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReportQuerySchema, WeeklyReportsResponseSchema, ErrorResponseSchema } from '@/lib/schemas/reports'
import { Prisma } from '@prisma/client'

/**
 * GET /api/reports - Fetch weekly reports with filtering, searching, and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by project name
 * - projectId: Filter by specific project
 * - startDate: Filter by period start date (YYYY-MM-DD)
 * - endDate: Filter by period end date (YYYY-MM-DD)
 * - weekNumber: Filter by week number
 * - status: Filter by report status (draft, published, archived)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Parse and validate query parameters with safe defaults
    const queryParams = ReportQuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      weekNumber: searchParams.get('weekNumber') || undefined,
      status: searchParams.get('status') || undefined,
    })    // Build where clause for filtering
    const where: Prisma.WeeklyReportWhereInput = {}

    // Filter by project ID
    if (queryParams.projectId) {
      where.projectId = queryParams.projectId
    }

    // Filter by search term (project name)
    if (queryParams.search) {
      where.project = {
        pekerjaan: {
          contains: queryParams.search,
          mode: 'insensitive',
        },
      }
    }

    // Filter by date range
    if (queryParams.startDate || queryParams.endDate) {
      where.startDate = {}
      if (queryParams.startDate) {
        where.startDate.gte = new Date(queryParams.startDate)
      }
      if (queryParams.endDate) {
        where.startDate.lte = new Date(queryParams.endDate)
      }
    }

    // Filter by week number
    if (queryParams.weekNumber) {
      where.weekNumber = queryParams.weekNumber
    }

    // Filter by status
    if (queryParams.status) {
      where.status = queryParams.status.toUpperCase() as any
    }

    // Calculate pagination
    const skip = (queryParams.page - 1) * queryParams.limit
    const take = queryParams.limit

    // Execute queries in parallel for better performance
    const [reports, totalCount] = await Promise.all([
      prisma.weeklyReport.findMany({
        where,
        skip,
        take,
        include: {
          project: {
            select: {
              id: true,
              pekerjaan: true,
              lokasiProyek: true,
            },
          },
        },
        orderBy: [
          { weekNumber: 'desc' },
          { startDate: 'desc' },
        ],
      }),
      prisma.weeklyReport.count({ where }),
    ])

    // Transform data to match the response schema
    const transformedReports = reports.map((report) => {
      // Format the report period display string
      const startDate = new Date(report.startDate)
      const endDate = new Date(report.endDate)
      const startDateStr = startDate.toLocaleDateString('id-ID', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const endDateStr = endDate.toLocaleDateString('id-ID', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const reportPeriod = `Minggu ke-${report.weekNumber} | ${startDateStr} - ${endDateStr}`

      return {
        id: report.id,
        projectId: report.projectId,
        projectName: report.project.pekerjaan || 'Unknown Project',
        weekNumber: report.weekNumber,
        startDate: report.startDate.toISOString(),
        endDate: report.endDate.toISOString(),
        reportPeriod,
        filePath: report.filePath,
        fileUrl: report.fileUrl,
        status: report.status.toLowerCase() as 'draft' | 'published' | 'archived',
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / queryParams.limit)
    const pagination = {
      page: queryParams.page,
      limit: queryParams.limit,
      total: totalCount,
      totalPages,
    }

    // Validate response before sending
    const response = WeeklyReportsResponseSchema.parse({
      success: true,
      data: transformedReports,
      pagination,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching weekly reports:', error)

    // Return validation error details if it's a Zod error
    if (error instanceof Error && 'issues' in error) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Invalid query parameters',
        details: error,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Return generic error response
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      error: 'Failed to fetch weekly reports',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * POST /api/reports - Create a new weekly report
 * 
 * Body should contain:
 * - projectId: string
 * - weekNumber: number
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - status?: 'draft' | 'published'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Import the schema dynamically to avoid issues
    const { CreateWeeklyReportSchema } = await import('@/lib/schemas/reports')
    const validatedData = CreateWeeklyReportSchema.parse(body)

    // Check if report with same project, week, and date already exists
    const existingReport = await prisma.weeklyReport.findFirst({
      where: {
        projectId: validatedData.projectId,
        weekNumber: validatedData.weekNumber,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      },
    })

    if (existingReport) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Report already exists for this project, week, and date range',
      })
      return NextResponse.json(errorResponse, { status: 409 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { id: true, pekerjaan: true },
    })

    if (!project) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Project not found',
      })
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Create the weekly report
    const report = await prisma.weeklyReport.create({
      data: {
        projectId: validatedData.projectId,
        weekNumber: validatedData.weekNumber,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: validatedData.status.toUpperCase() as any,
        filePath: `/reports/${validatedData.projectId}/week-${validatedData.weekNumber}.pdf`,
        fileUrl: `/api/reports/download/${validatedData.projectId}/week-${validatedData.weekNumber}`,
      },
      include: {
        project: {
          select: {
            id: true,
            pekerjaan: true,
          },
        },
      },
    })

    // Transform response data
    const startDate = new Date(report.startDate)
    const endDate = new Date(report.endDate)
    const startDateStr = startDate.toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const endDateStr = endDate.toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const reportPeriod = `Minggu ke-${report.weekNumber} | ${startDateStr} - ${endDateStr}`

    const transformedReport = {
      id: report.id,
      projectId: report.projectId,
      projectName: report.project.pekerjaan || 'Unknown Project',
      weekNumber: report.weekNumber,
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      reportPeriod,
      filePath: report.filePath,
      fileUrl: report.fileUrl,
      status: report.status.toLowerCase() as 'draft' | 'published' | 'archived',
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: transformedReport,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating weekly report:', error)

    // Return validation error details if it's a Zod error
    if (error instanceof Error && 'issues' in error) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Invalid request data',
        details: error,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Return generic error response
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      error: 'Failed to create weekly report',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
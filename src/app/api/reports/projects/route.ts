import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectOptionsResponseSchema, ErrorResponseSchema } from '@/lib/schemas/reports'

/**
 * GET /api/reports/projects - Fetch project options for dropdown filters
 * 
 * Returns simplified project data for use in filter dropdowns
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch projects with basic information
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        pekerjaan: true,
        lokasiProyek: true,
      },
      where: {
        pekerjaan: {
          not: null, // Only include projects with a name
        },
      },
      orderBy: {
        pekerjaan: 'asc',
      },
    })

    // Transform data for dropdown options
    const projectOptions = projects.map((project) => ({
      id: project.id,
      name: project.pekerjaan || 'Unknown Project',
      location: project.lokasiProyek || undefined,
    }))

    // Validate response before sending
    const response = ProjectOptionsResponseSchema.parse({
      success: true,
      data: projectOptions,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching project options:', error)

    // Return generic error response
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      error: 'Failed to fetch project options',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
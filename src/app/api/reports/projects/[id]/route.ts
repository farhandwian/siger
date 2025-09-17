import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectDetailsResponseSchema, ErrorResponseSchema } from '@/lib/schemas/reports'

/**
 * GET /api/reports/projects/[id] - Fetch detailed project information including number of weeks
 *
 * Returns detailed project data including numberOfWeeks for week period calculation
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params as required by Next.js 15
    const { id } = await params

    if (!id) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Project ID is required',
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Fetch project with detailed information
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        pekerjaan: true,
        lokasiProyek: true,
        numberOfWeeks: true,
        tanggalKontrak: true,
        tanggalSpmk: true, // Added tanggalSpmk for project start date
        akhirKontrak: true,
      },
    })

    if (!project) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        error: 'Project not found',
      })
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Transform data for response
    const projectDetails = {
      id: project.id,
      name: project.pekerjaan || 'Unknown Project',
      location: project.lokasiProyek || undefined,
      numberOfWeeks: project.numberOfWeeks,
      tanggalKontrak: project.tanggalKontrak,
      tanggalSpmk: project.tanggalSpmk, // Added tanggalSpmk to response
      akhirKontrak: project.akhirKontrak,
    }

    // Validate response before sending
    const response = ProjectDetailsResponseSchema.parse({
      success: true,
      data: projectDetails,
    })

    return NextResponse.json(response)
  } catch (error) {
    // Return generic error response
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      error: 'Failed to fetch project details',
      details: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

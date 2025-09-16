import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema for query parameters validation
const QuerySchema = z.object({
  includeProgress: z.coerce.boolean().default(true),
})

/**
 * GET /api/projects/summary
 * Fetch project execution summary metrics with real progress calculations
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = QuerySchema.parse(Object.fromEntries(searchParams))

    // Get all projects with their progress data
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        pekerjaan: true,
        fisikProgress: true,
        fisikDeviasi: true,
        fisikTarget: true,
        nilaiKontrak: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Calculate summary metrics
    const totalProyek = projects.length

    // Calculate total contract value (convert from string and handle currency)
    const totalKontrak = projects.reduce((sum, project) => {
      if (project.nilaiKontrak) {
        // Remove currency format and convert to number
        const cleanValue = project.nilaiKontrak.replace(/[Rp.,\s]/g, '').replace(/\./g, '') // Remove thousand separators
        const numericValue = parseFloat(cleanValue) || 0
        return sum + numericValue
      }
      return sum
    }, 0)

    // Calculate average progress (excluding projects with no progress data)
    const projectsWithProgress = projects.filter(
      p => p.fisikProgress !== null && p.fisikProgress !== undefined
    )
    const progressRataRata =
      projectsWithProgress.length > 0
        ? projectsWithProgress.reduce((sum, p) => sum + (p.fisikProgress || 0), 0) /
          projectsWithProgress.length
        : 0

    // Calculate average deviation (excluding projects with no deviation data)
    const projectsWithDeviation = projects.filter(
      p => p.fisikDeviasi !== null && p.fisikDeviasi !== undefined
    )
    const deviasiRataRata =
      projectsWithDeviation.length > 0
        ? projectsWithDeviation.reduce((sum, p) => sum + (p.fisikDeviasi || 0), 0) /
          projectsWithDeviation.length
        : 0

    // Get detailed progress data if requested
    let progressDetails = null
    if (parsed.includeProgress) {
      progressDetails = projects.map(project => ({
        id: project.id,
        name: project.pekerjaan,
        progress: project.fisikProgress || 0,
        deviation: project.fisikDeviasi || 0,
        target: project.fisikTarget || 100,
        contractValue: project.nilaiKontrak,
        lastUpdated: project.updatedAt,
      }))
    }

    // Get project status distribution based on progress and deviation
    const statusDistribution = projects.reduce(
      (acc, project) => {
        const progress = project.fisikProgress || 0
        const deviation = project.fisikDeviasi || 0

        let status: 'on-track' | 'at-risk' | 'delayed'

        if (deviation <= -10) {
          status = 'delayed'
        } else if (deviation <= -5 || progress < 30) {
          status = 'at-risk'
        } else {
          status = 'on-track'
        }

        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        totalProyek,
        totalKontrak,
        progressRataRata: Math.round(progressRataRata * 100) / 100, // Round to 2 decimal places
        deviasiRataRata: Math.round(deviasiRataRata * 100) / 100,
        statusDistribution,
        ...(progressDetails && { progressDetails }),
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        projectCount: totalProyek,
      },
    })
  } catch (error) {
    console.error('Error fetching project summary:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

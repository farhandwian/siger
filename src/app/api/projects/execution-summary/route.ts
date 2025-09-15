import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for execution summary response
const ExecutionSummarySchema = z.object({
  success: z.literal(true),
  data: z.object({
    totalProjects: z.number(),
    totalContract: z.string(),
    averageProgress: z.number(),
    averageDeviation: z.number(),
  }),
})

export type ExecutionSummary = z.infer<typeof ExecutionSummarySchema>['data']

/**
 * GET /api/projects/execution-summary
 * Returns summary metrics for project execution (pelaksanaan)
 */
export async function GET() {
  try {
    // Get all projects with their progress data
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        pekerjaan: true,
        fisikProgress: true,
        fisikDeviasi: true,
        fisikTarget: true,
        nilaiKontrak: true,
        bangunanProgress: true,
        bangunanDeviasi: true,
        saluranProgress: true,
        saluranDeviasi: true,
        keuanganProgress: true,
        keuanganDeviasi: true,
        activities: {
          include: {
            schedules: true,
          },
        },
      },
    })

    // Calculate total projects
    const totalProjects = projects.length

    // Calculate total contract value (convert from string and handle currency)
    const totalContractValue = projects.reduce((sum: number, project) => {
      if (project.nilaiKontrak) {
        // Remove currency format and convert to number
        const cleanValue = project.nilaiKontrak.replace(/[Rp.,\s]/g, '').replace(/\./g, '')
        const numericValue = parseFloat(cleanValue) || 0
        return sum + numericValue
      }
      return sum
    }, 0)

    // Format contract value to IDR string
    const totalContract = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(totalContractValue)

    // Calculate average progress from fisikProgress field
    const projectsWithProgress = projects.filter(
      p => p.fisikProgress !== null && p.fisikProgress !== undefined
    )

    const averageProgress =
      projectsWithProgress.length > 0
        ? projectsWithProgress.reduce(
            (sum: number, project) => sum + (project.fisikProgress || 0),
            0
          ) / projectsWithProgress.length
        : 0

    // Calculate average deviation from fisikDeviasi field
    const projectsWithDeviation = projects.filter(
      p => p.fisikDeviasi !== null && p.fisikDeviasi !== undefined
    )

    const averageDeviation =
      projectsWithDeviation.length > 0
        ? projectsWithDeviation.reduce(
            (sum: number, project) => sum + (project.fisikDeviasi || 0),
            0
          ) / projectsWithDeviation.length
        : 0

    // Return formatted response
    const response = {
      success: true as const,
      data: {
        totalProjects,
        totalContract,
        averageProgress: Math.round(averageProgress * 100) / 100, // Round to 2 decimal places
        averageDeviation: Math.round(averageDeviation * 100) / 100, // Round to 2 decimal places
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching execution summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution summary' },
      { status: 500 }
    )
  }
}

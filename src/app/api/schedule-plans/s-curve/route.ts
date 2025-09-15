import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SCurveDataPoint {
  weekNumber: number
  weekLabel: string
  rencana: number
  realisasi: number
  deviation: number
}

// GET /api/schedule-plans/s-curve - Optimized endpoint for S-curve data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // First get the project to get the SPMK date
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        pekerjaan: true,
        tanggalSpmk: true
      }
    })

    if (!project || !project.tanggalSpmk) {
      return NextResponse.json(
        { success: false, error: 'Project not found or missing SPMK date' },
        { status: 404 }
      )
    }

    const currentYear = new Date().getFullYear()

    // Get schedule plans and realizations for this project in parallel
    const [schedulePlans, realizations] = await Promise.all([
      prisma.schedulePlan.findMany({
        where: {
          subActivity: {
            activity: {
              projectId: projectId
            }
          }
        },
        select: {
          weekNumber: true,
          percentage: true
        }
      }),
      prisma.realization.findMany({
        where: {
          subActivity: {
            activity: {
              projectId: projectId
            }
          }
        },
        select: {
          weekNumber: true,
          percentage: true
        }
      })
    ])

    // Find the maximum week number to determine total weeks
    const maxPlanWeek = Math.max(...schedulePlans.map(p => p.weekNumber), 0)
    const maxRealWeek = Math.max(...realizations.map(r => r.weekNumber), 0)
    const totalWeeks = Math.max(maxPlanWeek, maxRealWeek, 20) // Default to 20 weeks minimum

    // Calculate S-curve data with cumulative values
    const sCurveData: SCurveDataPoint[] = []
    let cumulativePlan = 0
    let cumulativeActual = 0

    for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
      // Sum up all schedule plans and realizations for this week
      const weekPlanTotal = schedulePlans
        .filter(plan => plan.weekNumber === weekNumber)
        .reduce((sum, plan) => sum + (plan.percentage || 0), 0)

      const weekActualTotal = realizations
        .filter(real => real.weekNumber === weekNumber)
        .reduce((sum, real) => sum + (real.percentage || 0), 0)

      // Calculate cumulative values
      cumulativePlan += weekPlanTotal
      cumulativeActual += weekActualTotal

      sCurveData.push({
        weekNumber,
        weekLabel: `Week ${weekNumber}`,
        rencana: Math.round(cumulativePlan * 100) / 100, // Round to 2 decimals
        realisasi: Math.round(cumulativeActual * 100) / 100,
        deviation: Math.round((cumulativeActual - cumulativePlan) * 100) / 100
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        projectInfo: {
          id: project.id,
          name: project.pekerjaan,
          tanggalSpmk: project.tanggalSpmk
        },
        sCurveData,
        summary: {
          totalWeeks: sCurveData.length,
          finalPlan: cumulativePlan,
          finalActual: cumulativeActual,
          finalDeviation: cumulativeActual - cumulativePlan
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch S-curve data' },
      { status: 500 }
    )
  }
}

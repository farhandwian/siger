import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCumulativeSchema = z.object({
  projectId: z.string(),
  month: z.number(),
  year: z.number(),
  week: z.number(),
  cumulativePlan: z.number().nullable(),
  cumulativeActual: z.number().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, month, year, week, cumulativePlan, cumulativeActual } =
      updateCumulativeSchema.parse(body)

    // Calculate deviation (plan - actual)
    const cumulativeDeviation =
      cumulativePlan !== null && cumulativeActual !== null
        ? cumulativePlan - cumulativeActual
        : null

    // Upsert cumulative data
    const cumulativeData = await prisma.cumulativeSchedule.upsert({
      where: {
        projectId_month_year_week: {
          projectId,
          month,
          year,
          week,
        },
      },
      update: {
        cumulativePlan,
        cumulativeActual,
        cumulativeDeviation,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        month,
        year,
        week,
        cumulativePlan,
        cumulativeActual,
        cumulativeDeviation,
      },
    })

    return NextResponse.json({
      success: true,
      data: cumulativeData,
    })
  } catch (error) {
    console.error('Error updating cumulative data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cumulative data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    console.log('GET cumulative - projectId:', projectId)

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    console.log('Fetching cumulative data for project:', projectId)

    const cumulativeData = await prisma.cumulativeSchedule.findMany({
      where: { projectId },
      orderBy: [{ month: 'asc' }, { week: 'asc' }],
    })

    console.log('Cumulative data found:', cumulativeData.length, 'records')

    return NextResponse.json({
      success: true,
      data: cumulativeData,
    })
  } catch (error) {
    console.error('Error fetching cumulative data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cumulative data' },
      { status: 500 }
    )
  }
}

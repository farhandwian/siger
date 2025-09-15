import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateScheduleSchema } from '@/lib/schemas/schedule'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// GET /api/schedules - Fetch schedules with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const subActivityId = searchParams.get('subActivityId')
    const weekNumber = searchParams.get('weekNumber')

    // Build where clause with proper typing
    const where: Prisma.ScheduleWhereInput = {}
    
    if (subActivityId) {
      where.subActivityId = subActivityId
    }
    
    if (projectId && !subActivityId) {
      where.subActivity = {
        activity: {
          projectId: projectId
        }
      }
    }
    
    if (weekNumber) {
      where.weekNumber = parseInt(weekNumber)
    }

    // Optimize query based on filtering patterns
    let schedules

    if (projectId && !subActivityId) {
      // For project-based queries, use a more efficient approach
      // First get subActivityIds for the project, then query schedules
      const subActivityIds = await prisma.subActivity.findMany({
        where: {
          activity: {
            projectId: projectId
          }
        },
        select: {
          id: true
        }
      })

      const subActivityIdList = subActivityIds.map(sa => sa.id)

      if (subActivityIdList.length === 0) {
        return NextResponse.json({
          success: true,
          data: []
        })
      }

      // Build optimized where clause
      const optimizedWhere: Prisma.ScheduleWhereInput = {
        subActivityId: {
          in: subActivityIdList
        }
      }

      if (weekNumber) optimizedWhere.weekNumber = parseInt(weekNumber)

      schedules = await prisma.schedule.findMany({
        where: optimizedWhere,
        select: {
          id: true,
          subActivityId: true,
          weekNumber: true,
          plan: true,
          actionPlan: true,
          realization: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { weekNumber: 'asc' }
        ]
      })
    } else {
      // For other queries, use the standard approach
      schedules = await prisma.schedule.findMany({
        where,
        select: {
          id: true,
          subActivityId: true,
          weekNumber: true,
          plan: true,
          actionPlan: true,
          realization: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { weekNumber: 'asc' }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateScheduleSchema.parse(body)

    // Check for existing schedule with same constraints
    const existing = await prisma.schedule.findFirst({
      where: {
        subActivityId: validatedData.subActivityId,
        weekNumber: validatedData.weekNumber
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule already exists for this week' },
        { status: 409 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: validatedData,
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        plan: true,
        actionPlan: true,
        realization: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: schedule
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/schedules - Update existing schedule (upsert operation)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateScheduleSchema.parse(body)

    const schedule = await prisma.schedule.upsert({
      where: {
        subActivityId_weekNumber: {
          subActivityId: validatedData.subActivityId,
          weekNumber: validatedData.weekNumber
        }
      },
      update: {
        plan: validatedData.plan,
        actionPlan: validatedData.actionPlan,
        realization: validatedData.realization,
      },
      create: validatedData,
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        plan: true,
        actionPlan: true,
        realization: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

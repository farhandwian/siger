import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateSchedulePlanSchema } from '@/lib/schemas'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// GET /api/schedule-plans - Fetch schedule plans with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const subActivityId = searchParams.get('subActivityId')
    const weekNumber = searchParams.get('weekNumber')

    // Build where clause with proper typing
    const where: Prisma.SchedulePlanWhereInput = {}
    
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
    let schedulePlans

    if (projectId && !subActivityId) {
      // For project-based queries, use a more efficient approach
      // First get subActivityIds for the project, then query schedule plans
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
      const optimizedWhere: Prisma.SchedulePlanWhereInput = {
        subActivityId: {
          in: subActivityIdList
        }
      }

      if (weekNumber) optimizedWhere.weekNumber = parseInt(weekNumber)

      schedulePlans = await prisma.schedulePlan.findMany({
        where: optimizedWhere,
        select: {
          id: true,
          subActivityId: true,
          weekNumber: true,
          percentage: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { weekNumber: 'asc' }
        ]
      })
    } else {
      // For other queries, use the standard approach
      schedulePlans = await prisma.schedulePlan.findMany({
        where,
        select: {
          id: true,
          subActivityId: true,
          weekNumber: true,
          percentage: true,
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
      data: schedulePlans
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule plans' },
      { status: 500 }
    )
  }
}

// POST /api/schedule-plans - Create a new schedule plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateSchedulePlanSchema.parse(body)

    // Check for existing schedule plan with same constraints
    const existing = await prisma.schedulePlan.findFirst({
      where: {
        subActivityId: validatedData.subActivityId,
        weekNumber: validatedData.weekNumber
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule plan already exists for this week' },
        { status: 409 }
      )
    }

    const schedulePlan = await prisma.schedulePlan.create({
      data: validatedData,
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        percentage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: schedulePlan
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create schedule plan' },
      { status: 500 }
    )
  }
}

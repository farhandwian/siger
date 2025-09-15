import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateRealizationSchema } from '@/lib/schemas'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// GET /api/realizations - Fetch realizations with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const subActivityId = searchParams.get('subActivityId')
    const weekNumber = searchParams.get('weekNumber')

    // Build where clause with proper typing
    const where: Prisma.RealizationWhereInput = {}
    
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
    let realizations

    if (projectId && !subActivityId) {
      // For project-based queries, use a more efficient approach
      // First get subActivityIds for the project, then query realizations
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
      const optimizedWhere: Prisma.RealizationWhereInput = {
        subActivityId: {
          in: subActivityIdList
        }
      }

      if (weekNumber) optimizedWhere.weekNumber = parseInt(weekNumber)

      realizations = await prisma.realization.findMany({
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
      realizations = await prisma.realization.findMany({
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
      data: realizations
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch realizations' },
      { status: 500 }
    )
  }
}

// POST /api/realizations - Create a new realization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateRealizationSchema.parse(body)

    // Check for existing realization with same constraints
    const existing = await prisma.realization.findFirst({
      where: {
        subActivityId: validatedData.subActivityId,
        weekNumber: validatedData.weekNumber
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Realization already exists for this week' },
        { status: 409 }
      )
    }

    const realization = await prisma.realization.create({
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
      data: realization
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create realization' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateRealizationSchema } from '@/lib/schemas'
import { z } from 'zod'

// GET /api/realizations - Fetch realizations with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const subActivityId = searchParams.get('subActivityId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // Build where clause based on filters
    const where: Record<string, any> = {}
    
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
    
    if (year) {
      where.year = parseInt(year)
    }
    
    if (month) {
      where.month = parseInt(month)
    }

    const realizations = await prisma.realization.findMany({
      where,
      include: {
        subActivity: {
          include: {
            activity: {
              include: {
                project: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { week: 'asc' }
      ]
    })

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
        year: validatedData.year,
        month: validatedData.month,
        week: validatedData.week
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Realization already exists for this period' },
        { status: 409 }
      )
    }

    const realization = await prisma.realization.create({
      data: validatedData,
      include: {
        subActivity: {
          include: {
            activity: {
              include: {
                project: true
              }
            }
          }
        }
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

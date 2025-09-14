import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SchedulePlanSchema, CreateSchedulePlanSchema } from '@/lib/schemas'
import { z } from 'zod'

// GET /api/schedule-plans - Fetch schedule plans with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const subActivityId = searchParams.get('subActivityId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // Build where clause based on filters
    const where: any = {}
    
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

    const schedulePlans = await prisma.schedulePlan.findMany({
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
      data: schedulePlans
    })
  } catch (error) {
    console.error('Error fetching schedule plans:', error)
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
        year: validatedData.year,
        month: validatedData.month,
        week: validatedData.week
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule plan already exists for this period' },
        { status: 409 }
      )
    }

    const schedulePlan = await prisma.schedulePlan.create({
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
      data: schedulePlan
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating schedule plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule plan' },
      { status: 500 }
    )
  }
}

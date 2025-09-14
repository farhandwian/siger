// API route for Action Plan Schedules - GET and POST
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  CreateActionPlanSchema,
  ActionPlanResponseSchema,
} from '@/lib/schemas/action-plan-schedule'

// Query parameters schema for filtering action plan schedules
const QuerySchema = z.object({
  projectId: z.string().optional(),
  activityId: z.string().optional(),
  subActivityId: z.string().optional(),
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause based on query parameters
    const where: any = {}

    if (query.subActivityId) {
      where.subActivityId = query.subActivityId
    }

    if (query.year) {
      where.year = query.year
    }

    if (query.month) {
      where.month = query.month
    }

    // If projectId or activityId is provided, filter through subActivity relations
    if (query.projectId || query.activityId) {
      where.subActivity = {}
      
      if (query.activityId) {
        where.subActivity.activityId = query.activityId
      }
      
      if (query.projectId) {
        where.subActivity.activity = {
          projectId: query.projectId,
        }
      }
    }

    const actionPlans = await prisma.actionPlan.findMany({
      where,
      include: {
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
            activity: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { week: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: actionPlans,
    })
  } catch (error) {
    console.error('Error fetching action plan schedules:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateActionPlanSchema.parse(body)

    // Validate that subActivityId is provided (required field in new schema)
    if (!data.subActivityId) {
      return NextResponse.json(
        { success: false, error: 'subActivityId is required' },
        { status: 400 }
      )
    }

    // Check if a schedule already exists for this subactivity and time period
    const existingSchedule = await prisma.actionPlan.findFirst({
      where: {
        subActivityId: data.subActivityId,
        month: data.month,
        year: data.year,
        week: data.week,
      },
    })

    if (existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule already exists for this time period' },
        { status: 409 }
      )
    }

    const actionPlan = await prisma.actionPlan.create({
      data: {
        subActivityId: data.subActivityId,
        month: data.month,
        year: data.year,
        week: data.week,
        percentage: data.percentage || 0,
      },
      include: {
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
            activity: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: actionPlan,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// API route for Action Plan SchedulePlans - GET and POST
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  CreateActionPlanSchema,
  ActionPlanResponseSchema,
} from '@/lib/schemas/action-plan-scheduleplan'

// Query parameters schema for filtering action plan scheduleplans
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

    if (query.activityId) {
      where.activityId = query.activityId
    }

    if (query.subActivityId) {
      where.subActivityId = query.subActivityId
    }

    if (query.year) {
      where.year = query.year
    }

    if (query.month) {
      where.month = query.month
    }

    // If projectId is provided, filter by activities belonging to that project
    if (query.projectId) {
      where.OR = [
        {
          activity: {
            projectId: query.projectId,
          },
        },
        {
          subActivity: {
            activity: {
              projectId: query.projectId,
            },
          },
        },
      ]
    }

    const actionPlans = await prisma.actionPlan.findMany({
      where,
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
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
    console.error('Error fetching action plan scheduleplans:', error)

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
    console.log('=== ACTION PLAN SCHEDULEPLANS POST API ===')
    const body = await req.json()
    console.log('Request body:', body)

    const data = CreateActionPlanSchema.parse(body)
    console.log('Parsed data:', data)

    // Validate that either activityId or subActivityId is provided, but not both
    if (!data.activityId && !data.subActivityId) {
      console.log('Validation error: Neither activityId nor subActivityId provided')
      return NextResponse.json(
        { success: false, error: 'Either activityId or subActivityId must be provided' },
        { status: 400 }
      )
    }

    if (data.activityId && data.subActivityId) {
      console.log('Validation error: Both activityId and subActivityId provided')
      return NextResponse.json(
        { success: false, error: 'Cannot provide both activityId and subActivityId' },
        { status: 400 }
      )
    }

    // Check if a scheduleplan already exists for this activity/subactivity and time period
    const existingSchedulePlan = await prisma.actionPlan.findFirst({
      where: {
        ...(data.activityId
          ? { activityId: data.activityId }
          : { subActivityId: data.subActivityId }),
        month: data.month,
        year: data.year,
        week: data.week,
      },
    })

    if (existingSchedulePlan) {
      return NextResponse.json(
        { success: false, error: 'Action plan scheduleplan already exists for this time period' },
        { status: 409 }
      )
    }

    const actionPlan = await prisma.actionPlan.create({
      data,
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
            activityId: true,
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
    console.error('Error creating action plan scheduleplan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

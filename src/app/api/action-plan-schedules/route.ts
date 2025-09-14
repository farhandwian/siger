// API route for Action Plan Schedules - GET and POST
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  CreateActionPlanScheduleSchema,
  ActionPlanScheduleResponseSchema,
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
    console.log('=== ACTION PLAN SCHEDULES GET API ===')
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))
    console.log('Query parameters:', query)

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

    const actionPlanSchedules = await prisma.actionPlanSchedule.findMany({
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
      data: actionPlanSchedules,
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
    console.log('=== ACTION PLAN SCHEDULES POST API ===')
    const body = await req.json()
    console.log('Request body:', body)

    const data = CreateActionPlanScheduleSchema.parse(body)
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

    // Check if a schedule already exists for this activity/subactivity and time period
    const existingSchedule = await prisma.actionPlanSchedule.findFirst({
      where: {
        ...(data.activityId
          ? { activityId: data.activityId }
          : { subActivityId: data.subActivityId }),
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

    const actionPlanSchedule = await prisma.actionPlanSchedule.create({
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
        data: actionPlanSchedule,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating action plan schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

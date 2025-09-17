// API route for Action Plan Schedules - GET and POST
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  CreateScheduleSchema,
} from '@/lib/schemas/schedule'

// Query parameters schema for filtering action plan schedules
const QuerySchema = z.object({
  projectId: z.string().optional(),
  activityId: z.string().optional(),
  subActivityId: z.string().optional(),
  weekNumber: z.coerce.number().optional(),
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

    if (query.weekNumber) {
      where.weekNumber = query.weekNumber
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

    const actionPlans = await prisma.schedule.findMany({
      where,
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        actionPlan: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [{ weekNumber: 'asc' }],
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
    const data = CreateScheduleSchema.parse(body)

    // Validate that subActivityId is provided (required field in new schema)
    if (!data.subActivityId) {
      return NextResponse.json(
        { success: false, error: 'subActivityId is required' },
        { status: 400 }
      )
    }

    // Check if a schedule already exists for this subactivity and week
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        subActivityId: data.subActivityId,
        weekNumber: data.weekNumber,
      },
    })

    if (existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Action plan schedule already exists for this week' },
        { status: 409 }
      )
    }

    const actionPlan = await prisma.schedule.create({
      data: {
        subActivityId: data.subActivityId,
        weekNumber: data.weekNumber,
        actionPlan: data.actionPlan || 0,
      },
      select: {
        id: true,
        subActivityId: true,
        weekNumber: true,
        actionPlan: true,
        createdAt: true,
        updatedAt: true
      }
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

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * Activities API with optional schedule data
 * 
 * GET /api/activities?projectId={id}&weekStart={start}&weekEnd={end}&includeSchedules={boolean}
 * Returns activities with optional embedded schedule data for the specified week range
 */

const GetActivitiesSchema = z.object({
  projectId: z.string(),
  weekStart: z.coerce.number().int().positive().default(1),
  weekEnd: z.coerce.number().int().positive().default(52),
  includeSchedules: z.coerce.boolean().default(false),
})

const ScheduleSchema = z.object({
  id: z.string(),
  weekNumber: z.number(),
  plan: z.number().nullable(),
  actionPlan: z.number().nullable(),
  realization: z.number().nullable(),
})

const SubActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number(),
  order: z.number(),
  satuan: z.string().nullable(),
  volume: z.number().nullable(),
  schedules: z.array(ScheduleSchema).optional(),
})

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  subActivities: z.array(SubActivitySchema),
})

const ActivitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActivitySchema),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = GetActivitiesSchema.parse(Object.fromEntries(searchParams))
    
    const activities = await prisma.activity.findMany({
      where: {
        projectId: params.projectId
      },
      include: {
        subActivities: {
          include: {
            // Only include schedules if requested and for the specified week range
            schedules: params.includeSchedules ? {
              where: {
                weekNumber: {
                  gte: params.weekStart,
                  lte: params.weekEnd,
                }
              },
              select: {
                id: true,
                weekNumber: true,
                plan: true,
                actionPlan: true,
                realization: true,
              },
              orderBy: {
                weekNumber: 'asc'
              }
            } : false
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })
    
    // Validate response data
    const validatedData = ActivitiesResponseSchema.parse({
      success: true,
      data: activities,
    })
    
    return NextResponse.json(validatedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

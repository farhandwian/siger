import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateActivityScheduleSchema } from '@/lib/schemas'
import { z } from 'zod'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CreateActivityScheduleSchema.parse(body)

    // Extract activityId or subActivityId from request body
    const { activityId, subActivityId } = body

    // Create or update schedule
    const schedule = await prisma.activitySchedule.upsert({
      where: {
        ...(activityId
          ? {
              activityId_month_year_week: {
                activityId,
                month: validatedData.month,
                year: validatedData.year,
                week: validatedData.week,
              },
            }
          : {
              subActivityId_month_year_week: {
                subActivityId: subActivityId!,
                month: validatedData.month,
                year: validatedData.year,
                week: validatedData.week,
              },
            }),
      },
      update: {
        planPercentage: validatedData.planPercentage,
        actualPercentage: validatedData.actualPercentage,
      },
      create: {
        month: validatedData.month,
        year: validatedData.year,
        week: validatedData.week,
        planPercentage: validatedData.planPercentage,
        actualPercentage: validatedData.actualPercentage,
        ...(activityId ? { activityId } : { subActivityId }),
      },
    })

    // Get project ID for cumulative calculation
    let projectId: string
    if (activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { projectId: true },
      })
      projectId = activity!.projectId
    } else {
      const subActivity = await prisma.subActivity.findUnique({
        where: { id: subActivityId! },
        include: { activity: { select: { projectId: true } } },
      })
      projectId = subActivity!.activity.projectId
    }

    // Note: Cumulative data is now calculated on the client side
    // No need to update cumulative data in the database

    return Response.json({
      success: true,
      data: schedule,
      message: 'Jadwal berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating schedule:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to update schedule',
      },
      { status: 500 }
    )
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateActivityScheduleSchema } from '@/lib/schemas'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId?: string; subActivityId?: string }> }
) {
  try {
    const { activityId, subActivityId } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = CreateActivityScheduleSchema.parse(body)

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
        ...validatedData,
        ...(activityId ? { activityId } : { subActivityId }),
      },
    })

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

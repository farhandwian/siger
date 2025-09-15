import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateSchedulePlanSchema } from '@/lib/schemas'
import { z } from 'zod'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CreateSchedulePlanSchema.parse(body)

    // Extract subActivityId from request body (SchedulePlan only works with subActivityId)
    const { subActivityId } = body

    if (!subActivityId) {
      return Response.json({ error: 'subActivityId is required' }, { status: 400 })
    }

    // Create or update schedule
    const schedule = await prisma.schedulePlan.upsert({
      where: {
        subActivityId_month_year_week: {
          subActivityId,
          month: validatedData.month,
          year: validatedData.year,
          week: validatedData.week,
        },
      },
      update: {
        percentage: validatedData.percentage,
      },
      create: {
        subActivityId,
        month: validatedData.month,
        year: validatedData.year,
        week: validatedData.week,
        percentage: validatedData.percentage,
      },
    })

    // Get project ID for cumulative calculation
    const subActivity = await prisma.subActivity.findUnique({
      where: { id: subActivityId },
      include: { activity: { select: { projectId: true } } },
    })

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

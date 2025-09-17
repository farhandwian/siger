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
    const schedule = await prisma.schedule.upsert({
      where: {
        subActivityId_weekNumber: {
          subActivityId,
          weekNumber: validatedData.weekNumber,
        },
      },
      update: {
        plan: validatedData.plan,
      },
      create: {
        subActivityId,
        weekNumber: validatedData.weekNumber,
        plan: validatedData.plan,
      },
    })

    // Get project ID for cumulative calculation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

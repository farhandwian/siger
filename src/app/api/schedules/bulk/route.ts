import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BulkScheduleUpdateSchema } from '@/lib/schemas/schedule'
import { z } from 'zod'

// POST /api/schedules/bulk - Bulk update schedules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = BulkScheduleUpdateSchema.parse(body)

    const results = {
      updated: 0,
      created: 0,
      errors: [] as string[]
    }

    // Process each schedule in a transaction
    await prisma.$transaction(async (tx) => {
      for (const scheduleData of validatedData.schedules) {
        try {
          const schedule = await tx.schedule.upsert({
            where: {
              subActivityId_weekNumber: {
                subActivityId: validatedData.subActivityId,
                weekNumber: scheduleData.weekNumber
              }
            },
            update: {
              ...(scheduleData.plan !== undefined && { plan: scheduleData.plan }),
              ...(scheduleData.actionPlan !== undefined && { actionPlan: scheduleData.actionPlan }),
              ...(scheduleData.realization !== undefined && { realization: scheduleData.realization }),
            },
            create: {
              subActivityId: validatedData.subActivityId,
              weekNumber: scheduleData.weekNumber,
              plan: scheduleData.plan ?? 0,
              actionPlan: scheduleData.actionPlan ?? 0,
              realization: scheduleData.realization ?? 0,
            }
          })

          // Determine if this was an update or create
          const existing = await tx.schedule.findFirst({
            where: {
              subActivityId: validatedData.subActivityId,
              weekNumber: scheduleData.weekNumber,
              createdAt: { lt: schedule.updatedAt }
            }
          })

          if (existing) {
            results.updated++
          } else {
            results.created++
          }
        } catch (error) {
          results.errors.push(`Week ${scheduleData.weekNumber}: Failed to process`)
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to bulk update schedules' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/bulk - Bulk delete schedules
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { subActivityId, weekNumbers } = body

    if (!subActivityId || !Array.isArray(weekNumbers)) {
      return NextResponse.json(
        { success: false, error: 'subActivityId and weekNumbers array are required' },
        { status: 400 }
      )
    }

    const deleted = await prisma.schedule.deleteMany({
      where: {
        subActivityId,
        weekNumber: {
          in: weekNumbers
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { deleted: deleted.count }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to bulk delete schedules' },
      { status: 500 }
    )
  }
}

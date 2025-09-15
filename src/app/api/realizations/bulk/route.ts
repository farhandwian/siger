import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateRealizationSchema } from '@/lib/schemas'
import { z } from 'zod'

const BulkRealizationSchema = z.object({
  items: z.array(CreateRealizationSchema)
})

// POST /api/realizations/bulk - Bulk create/update realizations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = BulkRealizationSchema.parse(body)

    if (validatedData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided' },
        { status: 400 }
      )
    }

    if (validatedData.items.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 items allowed per request' },
        { status: 400 }
      )
    }

    // Use transaction for bulk operations
    const result = await prisma.$transaction(async (tx) => {
      const results = []

      for (const item of validatedData.items) {
        // Use upsert to handle both create and update
        const realization = await tx.realization.upsert({
          where: {
            subActivityId_month_year_week: {
              subActivityId: item.subActivityId,
              month: item.month,
              year: item.year,
              week: item.week
            }
          },
          update: {
            percentage: item.percentage
          },
          create: item,
          select: {
            id: true,
            subActivityId: true,
            month: true,
            year: true,
            week: true,
            percentage: true
          }
        })
        results.push(realization)
      }

      return results
    })

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        count: result.length,
        message: `Successfully processed ${result.length} realizations`
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process bulk realizations' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = ParamsSchema.parse(await params)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Copy plan values to action plan values for all schedules in this project using raw SQL
    // This is much more efficient than fetching and updating each record individually
    const result = await prisma.$executeRaw`
      UPDATE "schedules" 
      SET "action_plan" = "plan"
      WHERE "sub_activity_id" IN (
        SELECT sa."id" 
        FROM "sub_activities" sa
        JOIN "activities" a ON sa."activity_id" = a."id"
        WHERE a."project_id" = ${projectId}
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Successfully copied plan values to action plan',
      data: {
        updatedCount: result,
      },
    })
  } catch (error) {
    console.error('Error copying plan to action plan:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to copy plan to action plan' },
      { status: 500 }
    )
  }
}
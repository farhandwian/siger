/**
 * API route for Resource Flow Schedules
 * POST /api/resource-flow/schedules - Create/upsert a resource flow schedule entry
 * PUT /api/resource-flow/schedules - Update a resource flow schedule entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Request schemas
const CreateResourceFlowScheduleSchema = z.object({
  analisaKebutuhanId: z.string().min(1, 'Analisa kebutuhan ID is required'),
  tanggal: z.string().min(1, 'Tanggal is required'),
  rencana: z.number().nullable().default(0),
  realisasi: z.number().nullable().default(0),
  file: z.any().nullable().optional(),
})

const UpdateResourceFlowScheduleSchema = z.object({
  rencana: z.number().nullable().optional(),
  realisasi: z.number().nullable().optional(),
  file: z.any().nullable().optional(),
})

const UpdateQuerySchema = z.object({
  id: z.string().min(1, 'Schedule ID is required'),
})

/**
 * POST /api/resource-flow/schedules
 * Create or update (upsert) a resource flow schedule entry
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateResourceFlowScheduleSchema.parse(body)

    // Use upsert to create or update based on unique constraint
    const schedule = await prisma.resourceFlowSchedule.upsert({
      where: {
        analisaKebutuhanId_tanggal: {
          analisaKebutuhanId: data.analisaKebutuhanId,
          tanggal: data.tanggal,
        },
      },
      update: {
        rencana: data.rencana,
        realisasi: data.realisasi,
        file: data.file,
      },
      create: {
        analisaKebutuhanId: data.analisaKebutuhanId,
        tanggal: data.tanggal,
        rencana: data.rencana,
        realisasi: data.realisasi,
        file: data.file,
      },
    })

    return NextResponse.json({
      success: true,
      data: schedule,
    })
  } catch (error) {
    console.error('Error creating/updating resource flow schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update resource flow schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/resource-flow/schedules?id={scheduleId}
 * Update an existing resource flow schedule entry
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = UpdateQuerySchema.parse(Object.fromEntries(searchParams))

    const body = await req.json()
    const data = UpdateResourceFlowScheduleSchema.parse(body)

    // Update the existing schedule
    const schedule = await prisma.resourceFlowSchedule.update({
      where: {
        id: query.id,
      },
      data: {
        ...(data.rencana !== undefined && { rencana: data.rencana }),
        ...(data.realisasi !== undefined && { realisasi: data.realisasi }),
        ...(data.file !== undefined && { file: data.file }),
      },
    })

    return NextResponse.json({
      success: true,
      data: schedule,
    })
  } catch (error) {
    console.error('Error updating resource flow schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update resource flow schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

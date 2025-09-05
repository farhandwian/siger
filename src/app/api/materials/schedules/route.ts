import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createScheduleSchema = z.object({
  materialId: z.string(),
  date: z.string(),
  rencana: z.number().optional().default(0),
  rencanaKumulatif: z.number().optional().default(0),
  realisasi: z.number().optional().default(0),
  realisasiKumulatif: z.number().optional().default(0),
})

const updateScheduleSchema = z.object({
  realisasi: z.number().optional(),
  realisasiKumulatif: z.number().optional(),
})

// GET /api/materials/schedules - Get schedules for a material
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const schedules = await prisma.materialSchedule.findMany({
      where: { materialId },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ success: true, data: { schedules } })
  } catch (error) {
    console.error('Error fetching material schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

// POST /api/materials/schedules - Create or update a schedule entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Get all schedules for this material to calculate cumulative values
    const allSchedules = await prisma.materialSchedule.findMany({
      where: { materialId: validatedData.materialId },
      orderBy: { date: 'asc' },
    })

    // Create a map of existing schedules
    const scheduleMap = new Map(allSchedules.map(s => [s.date, s]))

    // Update the map with the new data
    scheduleMap.set(validatedData.date, {
      ...scheduleMap.get(validatedData.date),
      ...validatedData,
    })

    // Convert map back to array and sort by date
    const sortedSchedules = Array.from(scheduleMap.entries())
      .map(([date, schedule]) => ({ ...schedule, date }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Recalculate cumulative values
    let rencanaKumulatif = 0
    let realisasiKumulatif = 0

    for (const schedule of sortedSchedules) {
      rencanaKumulatif += schedule.rencana || 0
      realisasiKumulatif += schedule.realisasi || 0

      if (schedule.date === validatedData.date) {
        validatedData.rencanaKumulatif = rencanaKumulatif
        validatedData.realisasiKumulatif = realisasiKumulatif
        break
      }
    }

    // Determine tercapai based on realisasi vs rencana
    const tercapai = validatedData.realisasi >= validatedData.rencana ? 'Y' : 'T'

    let schedule

    try {
      // Try to create new schedule first
      schedule = await prisma.materialSchedule.create({
        data: {
          ...validatedData,
          tercapai,
        },
      })
    } catch (createError: any) {
      // If create fails due to unique constraint, update existing record
      if (createError.code === 'P2002') {
        const existingSchedule = await prisma.materialSchedule.findFirst({
          where: {
            materialId: validatedData.materialId,
            date: validatedData.date,
          },
        })

        if (existingSchedule) {
          schedule = await prisma.materialSchedule.update({
            where: { id: existingSchedule.id },
            data: {
              rencana: validatedData.rencana,
              rencanaKumulatif: validatedData.rencanaKumulatif,
              realisasi: validatedData.realisasi,
              realisasiKumulatif: validatedData.realisasiKumulatif,
              tercapai,
            },
          })
        } else {
          throw createError
        }
      } else {
        throw createError
      }
    }

    // Update cumulative values for all subsequent dates
    const subsequentSchedules = await prisma.materialSchedule.findMany({
      where: {
        materialId: validatedData.materialId,
        date: { gt: validatedData.date },
      },
      orderBy: { date: 'asc' },
    })

    let currentRencanaKumulatif = validatedData.rencanaKumulatif
    let currentRealisasiKumulatif = validatedData.realisasiKumulatif

    for (const subSchedule of subsequentSchedules) {
      currentRencanaKumulatif += subSchedule.rencana || 0
      currentRealisasiKumulatif += subSchedule.realisasi || 0

      const newTercapai = subSchedule.realisasi >= subSchedule.rencana ? 'Y' : 'T'

      await prisma.materialSchedule.update({
        where: { id: subSchedule.id },
        data: {
          rencanaKumulatif: currentRencanaKumulatif,
          realisasiKumulatif: currentRealisasiKumulatif,
          tercapai: newTercapai,
        },
      })
    }

    return NextResponse.json({ success: true, data: { schedule } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating/updating schedule:', error)
    return NextResponse.json({ error: 'Failed to create/update schedule' }, { status: 500 })
  }
}

// PUT /api/materials/schedules - Update a schedule entry
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateScheduleSchema.parse(body)

    // Get the current schedule to calculate tercapai
    const currentSchedule = await prisma.materialSchedule.findUnique({
      where: { id },
    })

    if (!currentSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Determine tercapai based on realisasi vs rencana
    let tercapai = currentSchedule.tercapai
    if (validatedData.realisasi !== undefined) {
      tercapai = validatedData.realisasi >= (currentSchedule.rencana || 0) ? 'Y' : 'T'
    }

    const updatedSchedule = await prisma.materialSchedule.update({
      where: { id },
      data: {
        ...validatedData,
        tercapai,
      },
    })

    return NextResponse.json({ success: true, data: { schedule: updatedSchedule } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchedulePlanSchema = z.object({
  materialId: z.string(),
  date: z.string(),
  rencana: z.number().optional().default(0),
  rencanaKumulatif: z.number().optional().default(0),
  realisasi: z.number().optional().default(0),
  realisasiKumulatif: z.number().optional().default(0),
})

const updateSchedulePlanSchema = z.object({
  realisasi: z.number().optional(),
  realisasiKumulatif: z.number().optional(),
})

// GET /api/materials/scheduleplans - Get scheduleplans for a material
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const scheduleplans = await prisma.materialSchedulePlan.findMany({
      where: { materialId },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ success: true, data: { scheduleplans } })
  } catch (error) {
    console.error('Error fetching material scheduleplans:', error)
    return NextResponse.json({ error: 'Failed to fetch scheduleplans' }, { status: 500 })
  }
}

// POST /api/materials/scheduleplans - Create or update a scheduleplan entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSchedulePlanSchema.parse(body)

    // Get all scheduleplans for this material to calculate cumulative values
    const allSchedulePlans = await prisma.materialSchedulePlan.findMany({
      where: { materialId: validatedData.materialId },
      orderBy: { date: 'asc' },
    })

    // Create a map of existing scheduleplans
    const scheduleplanMap = new Map(allSchedulePlans.map(s => [s.date, s]))

    // Update the map with the new data
    const existingSchedulePlan = scheduleplanMap.get(validatedData.date)
    scheduleplanMap.set(validatedData.date, {
      ...existingSchedulePlan,
      ...validatedData,
      id: existingSchedulePlan?.id || '', // Ensure id is always a string
      createdAt: existingSchedulePlan?.createdAt || new Date(),
      updatedAt: existingSchedulePlan?.updatedAt || new Date(),
      tercapai: existingSchedulePlan?.tercapai || null,
    })

    // Convert map back to array and sort by date
    const sortedSchedulePlans = Array.from(scheduleplanMap.entries())
      .map(([date, scheduleplan]) => ({ ...scheduleplan, date }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Recalculate cumulative values
    let rencanaKumulatif = 0
    let realisasiKumulatif = 0

    for (const scheduleplan of sortedSchedulePlans) {
      rencanaKumulatif += scheduleplan.rencana || 0
      realisasiKumulatif += scheduleplan.realisasi || 0

      if (scheduleplan.date === validatedData.date) {
        validatedData.rencanaKumulatif = rencanaKumulatif
        validatedData.realisasiKumulatif = realisasiKumulatif
        break
      }
    }

    // Determine tercapai based on realisasi vs rencana
    const tercapai = validatedData.realisasi >= validatedData.rencana ? 'Y' : 'T'

    let scheduleplan

    try {
      // Try to create new scheduleplan first
      scheduleplan = await prisma.materialSchedulePlan.create({
        data: {
          ...validatedData,
          tercapai,
        },
      })
    } catch (createError: any) {
      // If create fails due to unique constraint, update existing record
      if (createError.code === 'P2002') {
        const existingSchedulePlan = await prisma.materialSchedulePlan.findFirst({
          where: {
            materialId: validatedData.materialId,
            date: validatedData.date,
          },
        })

        if (existingSchedulePlan) {
          scheduleplan = await prisma.materialSchedulePlan.update({
            where: { id: existingSchedulePlan.id },
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
    const subsequentSchedulePlans = await prisma.materialSchedulePlan.findMany({
      where: {
        materialId: validatedData.materialId,
        date: { gt: validatedData.date },
      },
      orderBy: { date: 'asc' },
    })

    let currentRencanaKumulatif = validatedData.rencanaKumulatif
    let currentRealisasiKumulatif = validatedData.realisasiKumulatif

    for (const subSchedulePlan of subsequentSchedulePlans) {
      currentRencanaKumulatif += subSchedulePlan.rencana || 0
      currentRealisasiKumulatif += subSchedulePlan.realisasi || 0

      const newTercapai = (subSchedulePlan.realisasi || 0) >= (subSchedulePlan.rencana || 0) ? 'Y' : 'T'

      await prisma.materialSchedulePlan.update({
        where: { id: subSchedulePlan.id },
        data: {
          rencanaKumulatif: currentRencanaKumulatif,
          realisasiKumulatif: currentRealisasiKumulatif,
          tercapai: newTercapai,
        },
      })
    }

    return NextResponse.json({ success: true, data: { scheduleplan } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating/updating scheduleplan:', error)
    return NextResponse.json({ error: 'Failed to create/update scheduleplan' }, { status: 500 })
  }
}

// PUT /api/materials/scheduleplans - Update a scheduleplan entry
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'SchedulePlan ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateSchedulePlanSchema.parse(body)

    // Get the current scheduleplan to calculate tercapai
    const currentSchedulePlan = await prisma.materialSchedulePlan.findUnique({
      where: { id },
    })

    if (!currentSchedulePlan) {
      return NextResponse.json({ error: 'SchedulePlan not found' }, { status: 404 })
    }

    // Determine tercapai based on realisasi vs rencana
    let tercapai = currentSchedulePlan.tercapai
    if (validatedData.realisasi !== undefined) {
      tercapai = validatedData.realisasi >= (currentSchedulePlan.rencana || 0) ? 'Y' : 'T'
    }

    const updatedSchedulePlan = await prisma.materialSchedulePlan.update({
      where: { id },
      data: {
        ...validatedData,
        tercapai,
      },
    })

    return NextResponse.json({ success: true, data: { scheduleplan: updatedSchedulePlan } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating scheduleplan:', error)
    return NextResponse.json({ error: 'Failed to update scheduleplan' }, { status: 500 })
  }
}

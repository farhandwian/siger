import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMaterialSchema = z.object({
  projectId: z.string(),
  jenisMaterial: z.string().min(1, 'Jenis material is required'),
  volumeSatuan: z.enum(['m3', 'buah']).default('m3'),
  volumeTarget: z.number().min(0).default(0),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  waktuSelesai: z.number().optional(),
})

const updateMaterialSchema = z.object({
  jenisMaterial: z.string().optional(),
  volumeSatuan: z.enum(['m3', 'buah']).optional(),
  volumeTarget: z.number().min(0).optional(),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  waktuSelesai: z.number().optional(),
})

// GET /api/materials - Get all materials for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const materials = await prisma.material.findMany({
      where: { projectId },
      include: {
        schedules: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: { materials } })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

// POST /api/materials - Create a new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMaterialSchema.parse(body)

    const material = await prisma.material.create({
      data: validatedData,
      include: {
        schedules: true,
      },
    })

    return NextResponse.json({ success: true, data: { material } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}

// PUT /api/materials - Update a material
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateMaterialSchema.parse(body)

    const material = await prisma.material.update({
      where: { id },
      data: validatedData,
      include: {
        schedules: {
          orderBy: { date: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: { material } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating material:', error)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

// DELETE /api/materials - Delete a material
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    await prisma.material.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}

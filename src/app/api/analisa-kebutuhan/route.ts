import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  AnalisaKebutuhanQuerySchema,
  CreateAnalisaKebutuhanSchema,
  AnalisaKebutuhanListResponseSchema,
  ErrorResponseSchema,
} from '@/lib/schemas/analisa-kebutuhan'

/**
 * GET /api/analisa-kebutuhan
 * Fetch analisa kebutuhan data with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = AnalisaKebutuhanQuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause based on query parameters
    const where: any = {}

    if (query.subActivityId) {
      where.subActivityId = query.subActivityId
    }

    if (query.kategoriId) {
      where.kebutuhan = {
        kategoriKebutuhanId: query.kategoriId,
      }
    }

    if (query.tanggal) {
      where.tanggal = query.tanggal
    } else if (query.tanggalMulai || query.tanggalSelesai) {
      where.tanggal = {}
      if (query.tanggalMulai) {
        where.tanggal.gte = query.tanggalMulai
      }
      if (query.tanggalSelesai) {
        where.tanggal.lte = query.tanggalSelesai
      }
    }

    if (query.search) {
      where.OR = [
        {
          kebutuhan: {
            nama: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
        {
          subActivity: {
            nama: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      prisma.analisaKebutuhan.findMany({
        where,
        include: {
          kebutuhan: {
            include: {
              kategoriKebutuhan: true,
            },
          },
          subActivity: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.analisaKebutuhan.count({ where }),
    ])

    const response = {
      success: true as const,
      data: data.map(item => ({
        ...item,
        kebutuhan: {
          ...item.kebutuhan,
          kategoriKebutuhan: item.kebutuhan.kategoriKebutuhan,
        },
        subActivity: item.subActivity,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching analisa kebutuhan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/analisa-kebutuhan
 * Create new analisa kebutuhan entry
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateAnalisaKebutuhanSchema.parse(body)

    // Check if sub activity exists
    const subActivity = await prisma.subActivity.findUnique({
      where: { id: validatedData.subActivityId },
    })

    if (!subActivity) {
      return NextResponse.json({ success: false, error: 'Sub activity not found' }, { status: 404 })
    }

    // Check if kebutuhan exists
    const kebutuhan = await prisma.kebutuhan.findUnique({
      where: { id: validatedData.kebutuhanId },
    })

    if (!kebutuhan) {
      return NextResponse.json({ success: false, error: 'Kebutuhan not found' }, { status: 404 })
    }

    // Check for duplicate entry (unique constraint: subActivityId + kebutuhanId + tanggal)
    const existingEntry = await prisma.analisaKebutuhan.findUnique({
      where: {
        subActivityId_kebutuhanId_tanggal: {
          subActivityId: validatedData.subActivityId,
          kebutuhanId: validatedData.kebutuhanId,
          tanggal: validatedData.tanggal,
        },
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Entry already exists for this sub activity, kebutuhan, and date',
        },
        { status: 409 }
      )
    }

    // Create the entry
    const analisaKebutuhan = await prisma.analisaKebutuhan.create({
      data: validatedData,
      include: {
        kebutuhan: {
          include: {
            kategoriKebutuhan: true,
          },
        },
        subActivity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const response = {
      success: true as const,
      data: {
        ...analisaKebutuhan,
        kebutuhan: {
          ...analisaKebutuhan.kebutuhan,
          kategoriKebutuhan: analisaKebutuhan.kebutuhan.kategoriKebutuhan,
        },
        subActivity: analisaKebutuhan.subActivity,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating analisa kebutuhan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

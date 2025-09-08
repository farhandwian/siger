import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
    }

    const validatedParams = QuerySchema.parse(queryParams)
    const { page, limit, search } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            { pekerjaan: { contains: search, mode: 'insensitive' } },
            { penyediaJasa: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    // Get projects with their activities and sub-activities
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          pekerjaan: true,
          penyediaJasa: true,
          nilaiKontrak: true,
          tanggalKontrak: true,
          akhirKontrak: true,
          fisikProgress: true,
          fisikTarget: true,
          activities: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              order: true,
              subActivities: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  name: true,
                  satuan: true,
                  volumeKontrak: true,
                  weight: true,
                  order: true,
                },
              },
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching full projects:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 })
  }
}

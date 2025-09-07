import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  CreateActivityProposalSchema,
  ActivityProposalsResponseSchema,
} from '@/lib/schemas/proposal'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  tahun: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}

    if (query.search) {
      where.OR = [
        { daerahIrigasi: { contains: query.search, mode: 'insensitive' } },
        { kategoriKegiatan: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.tahun) {
      where.tahun = query.tahun
    }

    const [data, total] = await Promise.all([
      prisma.activityProposal.findMany({
        where,
        include: {
          lingkupUsulan: true,
          readinessCriteria: true,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityProposal.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Error fetching activity proposals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity proposals' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateActivityProposalSchema.parse(body)

    const proposal = await prisma.activityProposal.create({
      data: {
        ...data,
        outcome: data.outcome || 0,
        kebutuhanAnggaran: data.kebutuhanAnggaran || 0,
        anggaranPerHektar: data.anggaranPerHektar || 0,
        ipExisting: data.ipExisting || 0,
        ipRencana: data.ipRencana || 0,
      },
      include: {
        lingkupUsulan: true,
        readinessCriteria: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: proposal,
    })
  } catch (error) {
    console.error('Error creating activity proposal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create activity proposal' },
      { status: 500 }
    )
  }
}

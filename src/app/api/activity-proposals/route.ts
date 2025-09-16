import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema for query parameters validation
const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().optional(),
  kategoriKegiatan: z.string().optional(),
  tahun: z.string().optional(),
})

/**
 * GET /api/activity-proposals
 * Fetch activity proposals with filtering, pagination, and summary metrics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = QuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause for filtering
    const where: any = {}

    if (parsed.status) {
      where.status = parsed.status
    }

    if (parsed.kategoriKegiatan) {
      where.kategoriKegiatan = parsed.kategoriKegiatan
    }

    if (parsed.tahun) {
      where.tahun = parsed.tahun
    }

    // Execute queries in parallel for better performance
    const [proposals, total, statusCounts] = await Promise.all([
      // Get paginated proposals
      prisma.activityProposal.findMany({
        where,
        include: {
          lingkupUsulan: true,
          readinessCriteria: true,
        },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
        orderBy: { createdAt: 'desc' },
      }),

      // Get total count for pagination
      prisma.activityProposal.count({ where }),

      // Get status-based summary counts
      prisma.activityProposal.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
    ])

    // Calculate summary metrics
    const totalUsulan = await prisma.activityProposal.count()
    const statusSummary = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate total approved budget by category
    const approvedProposals = await prisma.activityProposal.findMany({
      where: { status: 'Diterima' },
      include: { lingkupUsulan: true },
    })

    const categoryBreakdown = approvedProposals.reduce(
      (acc, proposal) => {
        const category = proposal.kategoriKegiatan
        if (!acc[category]) {
          acc[category] = {
            totalUsulan: 0,
            totalAnggaran: 0,
            totalOutcome: 0,
          }
        }
        acc[category].totalUsulan += 1
        acc[category].totalAnggaran += proposal.kebutuhanAnggaran || 0
        acc[category].totalOutcome += proposal.outcome || 0
        return acc
      },
      {} as Record<string, { totalUsulan: number; totalAnggaran: number; totalOutcome: number }>
    )

    return NextResponse.json({
      success: true,
      data: proposals,
      pagination: {
        page: parsed.page,
        limit: parsed.limit,
        total,
        totalPages: Math.ceil(total / parsed.limit),
      },
      summary: {
        total: totalUsulan,
        menungguVerifikasi: statusSummary['Draft'] || 0,
        diterima: statusSummary['Diterima'] || 0,
        ditolak: statusSummary['Ditolak'] || 0,
        totalAnggaran: approvedProposals.reduce((sum, p) => sum + (p.kebutuhanAnggaran || 0), 0),
        categoryBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching activity proposals:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const QuerySchema = z.object({
  kategoriId: z.string().optional(),
})

/**
 * GET /api/analisa-kebutuhan/kebutuhan
 * Fetch kebutuhan items, optionally filtered by category
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}
    if (query.kategoriId) {
      where.kategoriKebutuhanId = query.kategoriId
    }

    const kebutuhan = await prisma.kebutuhan.findMany({
      where,
      include: {
        kategoriKebutuhan: true,
      },
      orderBy: [{ kategoriKebutuhan: { nama: 'asc' } }, { nama: 'asc' }],
    })

    const response = {
      success: true,
      data: kebutuhan.map(item => ({
        ...item,
        kategoriKebutuhan: item.kategoriKebutuhan,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching kebutuhan:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

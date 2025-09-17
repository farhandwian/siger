import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/analisa-kebutuhan/categories
 * Fetch all kategori kebutuhan for dropdown selection
 */
export async function GET() {
  try {
    const categories = await prisma.kategoriKebutuhan.findMany({
      orderBy: {
        nama: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

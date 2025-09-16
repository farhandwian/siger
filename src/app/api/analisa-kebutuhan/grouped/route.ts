import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Query schema for grouped data
const GroupedAnalisaKebutuhanQuerySchema = z.object({
  projectId: z.string().optional(),
})

/**
 * GET /api/analisa-kebutuhan/grouped
 * Fetch analisa kebutuhan data grouped by activities and sub-activities
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = GroupedAnalisaKebutuhanQuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause for analisa kebutuhan
    const analisaWhere: Record<string, unknown> = {}

    // If projectId is provided, filter by activities belonging to that project
    const activityWhere: Record<string, unknown> = {}
    if (query.projectId) {
      activityWhere.projectId = query.projectId
    }

    // Fetch project data to get masa kontrak for target calculation
    const project = query.projectId
      ? await prisma.project.findUnique({
          where: { id: query.projectId },
          select: { masaKontrak: true },
        })
      : null

    // Fetch activities with their sub-activities and analisa kebutuhan data
    const activities = await prisma.activity.findMany({
      where: activityWhere,
      include: {
        subActivities: {
          include: {
            analisaKebutuhan: {
              where: analisaWhere,
              include: {
                kebutuhan: {
                  include: {
                    kategoriKebutuhan: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Helper function to format percentage or number
    const formatValue = (value: number | null | undefined): string => {
      if (value === null || value === undefined) return '-'

      // Check if it's a percentage (between 0 and 200, typically)
      if (value >= 0 && value <= 200) {
        return `${value}%`
      }

      // For other values, return as string with appropriate formatting
      return value.toString()
    }

    // Helper function to format stock values with + or - signs
    const formatStockDifference = (value: number | null | undefined): string => {
      if (value === null || value === undefined) return '-'
      if (value === 0) return '0%'
      if (value > 0) return `+${value}%`
      return `${value}%`
    }

    // Helper function to get appropriate unit for category
    const getUnitForCategory = (categoryName: string, koefisien: number): string => {
      const lowerCategory = categoryName.toLowerCase()

      if (lowerCategory.includes('tenaga') || lowerCategory.includes('kerja')) {
        return `${koefisien} Orang/Hari`
      } else if (lowerCategory.includes('bahan')) {
        return `${koefisien} m³/Hari`
      } else if (lowerCategory.includes('alat')) {
        return `${koefisien} Unit/Hari`
      } else {
        // Default generic unit
        return `${koefisien} Unit/Hari`
      }
    }

    // Helper function to calculate weekly target based on project duration
    const calculateWeeklyTarget = (
      volume: number | null,
      satuan: string | null,
      masaKontrak: string | null
    ): string => {
      if (!volume || !masaKontrak) return '0 Unit/Minggu'

      const masaKontrakDays = parseInt(masaKontrak) || 1
      const volumePerHari = volume / masaKontrakDays
      const weeklyTarget = volumePerHari * 7 // 7 days per week

      return `${weeklyTarget.toFixed(2)} ${satuan || 'Unit'}/Minggu`
    }

    // Transform data to match the dummy structure
    const transformedData = {
      Kegiatan: activities.map(activity => ({
        name: activity.name,
        subActivities: activity.subActivities.map(subActivity => {
          // Group analisa kebutuhan by kategori
          const analisaByKategori = subActivity.analisaKebutuhan.reduce(
            (acc, analisa) => {
              const kategoriNama = analisa.kebutuhan.kategoriKebutuhan.nama
              if (!acc[kategoriNama]) {
                acc[kategoriNama] = []
              }
              acc[kategoriNama].push(analisa)
              return acc
            },
            {} as Record<string, typeof subActivity.analisaKebutuhan>
          )

          // Build the sub-activity object
          const subActivityData: {
            name: string
            Target: string
            categories?: Record<
              string,
              Array<{
                name: string
                jumlah: string
                stokHarian: string
                terpasang: string
                totalStokHariIni: string
              }>
            >
          } = {
            name: subActivity.name,
            Target: calculateWeeklyTarget(
              subActivity.volume,
              subActivity.satuan,
              project?.masaKontrak || null
            ),
          }

          // Process all categories dynamically
          if (Object.keys(analisaByKategori).length > 0) {
            subActivityData.categories = {}

            Object.entries(analisaByKategori).forEach(([categoryName, analisaList]) => {
              if (subActivityData.categories) {
                subActivityData.categories[categoryName] = analisaList.map(analisa => ({
                  name: analisa.kebutuhan.nama,
                  jumlah: getUnitForCategory(categoryName, analisa.koefisien),
                  stokHarian: formatValue(analisa.stokHarian),
                  terpasang: formatValue(analisa.terpasang),
                  totalStokHariIni: formatStockDifference(analisa.totalSisaStokHariIni),
                }))
              }
            })
          }

          return subActivityData
        }),
      })),
    }

    const response = {
      success: true as const,
      data: transformedData,
    }

    return NextResponse.json(response)
  } catch (error) {
    // Log error for debugging but don't expose sensitive information
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

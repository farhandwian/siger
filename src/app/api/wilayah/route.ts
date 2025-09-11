import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const level = searchParams.get('level') || 'all' // 'province', 'regency', 'district', 'village', 'all'

    let wilayahData: any[]

    if (level === 'province') {
      wilayahData = await prisma.wilayah.findMany({
        where: {
          nama: {
            contains: query,
            mode: 'insensitive',
          },
          kode: {
            not: {
              contains: '.',
            },
          },
        },
        take: limit,
        orderBy: {
          nama: 'asc',
        },
      })
    } else if (level === 'regency') {
      wilayahData = await prisma.$queryRaw`
        SELECT * FROM "wilayah" 
        WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
        AND "kode" ~ '^[0-9]{2}\.[0-9]{2}$'
        ORDER BY "nama" ASC
        LIMIT ${limit}
      `
    } else if (level === 'district') {
      wilayahData = await prisma.$queryRaw`
        SELECT * FROM "wilayah" 
        WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
        AND "kode" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}$'
        ORDER BY "nama" ASC
        LIMIT ${limit}
      `
    } else if (level === 'village') {
      wilayahData = await prisma.$queryRaw`
        SELECT * FROM "wilayah" 
        WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
        AND "kode" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
        ORDER BY "nama" ASC
        LIMIT ${limit}
      `
    } else {
      // For 'all', prioritize higher administrative levels and limit villages
      // Get regencies/cities first (most important)
      const regencies: any[] = await prisma.$queryRaw`
        SELECT * FROM "wilayah" 
        WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
        AND "kode" ~ '^[0-9]{2}\.[0-9]{2}$'
        ORDER BY "nama" ASC
        LIMIT 20
      `

      // Then get districts (if we need more results)
      let districts: any[] = []
      if (regencies.length < 10) {
        districts = await prisma.$queryRaw`
          SELECT * FROM "wilayah" 
          WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
          AND "kode" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}$'
          ORDER BY "nama" ASC
          LIMIT ${Math.min(15, 25 - regencies.length)}
        `
      }

      // Finally, get some villages if we still need more
      let villages: any[] = []
      if (regencies.length + districts.length < 8) {
        villages = await prisma.$queryRaw`
          SELECT * FROM "wilayah" 
          WHERE LOWER("nama") LIKE LOWER(${`%${query}%`}) 
          AND "kode" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
          ORDER BY "nama" ASC
          LIMIT ${Math.min(8, 15 - regencies.length - districts.length)}
        `
      }

      wilayahData = [...regencies, ...districts, ...villages]
    }

    // Get parent context for better labeling
    const transformedData = await Promise.all(
      wilayahData.map(async item => {
        const parts = item.kode.split('.')
        let level = 'village'
        let type = 'Desa'

        if (parts.length === 1) {
          level = 'province'
          type = 'Provinsi'
        } else if (parts.length === 2) {
          level = 'regency'
          type = item.nama.includes('KOTA') ? 'Kota' : 'Kabupaten'
        } else if (parts.length === 3) {
          level = 'district'
          type = 'Kecamatan'
        }

        // Build hierarchical label with parent context
        let hierarchicalLabel = item.nama

        try {
          if (parts.length >= 2) {
            // Get regency/city name
            const regencyCode = `${parts[0]}.${parts[1]}`
            const regency = await prisma.wilayah.findUnique({
              where: { kode: regencyCode },
            })

            if (regency && level !== 'regency') {
              const regencyType = regency.nama.includes('KOTA') ? 'Kota' : 'Kab.'
              const cleanRegencyName = regency.nama.replace(/^(KAB\.|KOTA)\s*/, '')

              if (parts.length === 3) {
                // District: "Bandung Wetan, Kota Bandung"
                hierarchicalLabel = `${item.nama}, ${regencyType} ${cleanRegencyName}`
              } else if (parts.length === 4) {
                // Village: "Desa XYZ, Kec. ABC, Kab. DEF"
                const districtCode = `${parts[0]}.${parts[1]}.${parts[2]}`
                const district = await prisma.wilayah.findUnique({
                  where: { kode: districtCode },
                })

                if (district) {
                  hierarchicalLabel = `${item.nama}, Kec. ${district.nama}, ${regencyType} ${cleanRegencyName}`
                } else {
                  hierarchicalLabel = `${item.nama}, ${regencyType} ${cleanRegencyName}`
                }
              }
            }
          }
        } catch (e) {
          // If error getting parent context, just use the original name
        }

        return {
          value: item.kode,
          label: hierarchicalLabel,
          level,
          type,
          searchText: `${hierarchicalLabel} (${type})`,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
    })
  } catch (error) {
    console.error('Error fetching wilayah data:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

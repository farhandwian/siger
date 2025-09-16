import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Predefined categories and requirements data based on the Figma design
const kategoriesAndKebutuhan = {
  'Tenaga Kerja': ['Pekerja', 'Tukang', 'Mandor'],
  Bahan: [
    'Tanah',
    'Batu',
    'Kerikil',
    'Pasir',
    'Semen',
    'Besi Beton',
    'Kayu Balok',
    'Kayu Papan',
    'Paku',
    'Kawat Beton',
    'Cat',
    'Genteng',
    'Pipa PVC',
  ],
  Alat: [
    'Excavator',
    'Stamper',
    'Wheel Loader',
    'Bulldozer',
    'Concrete Mixer',
    'Vibrator',
    'Generator',
    'Water Pump',
    'Scaffolding',
    'Concrete Pump',
    'Crane',
    'Compactor',
  ],
}

// Sample analisa kebutuhan data for realistic testing
const analisaKebutuhanSamples = [
  // Mobilisasi Alat dan Material
  {
    subActivityName: 'Mobilisasi Alat dan Material',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 4,
        stokHarian: 95,
        terpasang: 100,
        totalSisaStokHariIni: 5,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Mandor',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Alat',
        nama: 'Crane',
        koefisien: 1,
        stokHarian: 90,
        terpasang: 85,
        totalSisaStokHariIni: -5,
      },
      {
        kategori: 'Alat',
        nama: 'Wheel Loader',
        koefisien: 2,
        stokHarian: 100,
        terpasang: 95,
        totalSisaStokHariIni: -5,
      },
    ],
  },
  // Pengukuran dan Pematokan
  {
    subActivityName: 'Pengukuran dan Pematokan',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Tukang',
        koefisien: 2,
        stokHarian: 98,
        terpasang: 95,
        totalSisaStokHariIni: -3,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 3,
        stokHarian: 102,
        terpasang: 100,
        totalSisaStokHariIni: 2,
      },
      {
        kategori: 'Bahan',
        nama: 'Paku',
        koefisien: 2.5,
        stokHarian: 95,
        terpasang: 90,
        totalSisaStokHariIni: -5,
      },
    ],
  },
  // Pembersihan Lahan
  {
    subActivityName: 'Pembersihan Lahan',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 6,
        stokHarian: 100,
        terpasang: 98,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Mandor',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Alat',
        nama: 'Bulldozer',
        koefisien: 1,
        stokHarian: 85,
        terpasang: 80,
        totalSisaStokHariIni: -5,
      },
    ],
  },
  // Galian Tanah Biasa
  {
    subActivityName: 'Galian Tanah Biasa',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 8,
        stokHarian: 97,
        terpasang: 95,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Tukang',
        koefisien: 2,
        stokHarian: 100,
        terpasang: 98,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Mandor',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Alat',
        nama: 'Excavator',
        koefisien: 2,
        stokHarian: 90,
        terpasang: 85,
        totalSisaStokHariIni: -5,
      },
      {
        kategori: 'Alat',
        nama: 'Wheel Loader',
        koefisien: 1,
        stokHarian: 95,
        terpasang: 90,
        totalSisaStokHariIni: -5,
      },
    ],
  },
  // Beton K-200
  {
    subActivityName: 'Beton K-200',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 12,
        stokHarian: 98,
        terpasang: 96,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Tukang',
        koefisien: 4,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Mandor',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Bahan',
        nama: 'Semen',
        koefisien: 350,
        stokHarian: 95,
        terpasang: 92,
        totalSisaStokHariIni: -3,
      },
      {
        kategori: 'Bahan',
        nama: 'Pasir',
        koefisien: 0.7,
        stokHarian: 100,
        terpasang: 98,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Bahan',
        nama: 'Kerikil',
        koefisien: 1.05,
        stokHarian: 98,
        terpasang: 95,
        totalSisaStokHariIni: -3,
      },
      {
        kategori: 'Bahan',
        nama: 'Besi Beton',
        koefisien: 120,
        stokHarian: 90,
        terpasang: 88,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Alat',
        nama: 'Concrete Mixer',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Alat',
        nama: 'Vibrator',
        koefisien: 2,
        stokHarian: 95,
        terpasang: 90,
        totalSisaStokHariIni: -5,
      },
    ],
  },
  // Normalisasi Saluran Primer
  {
    subActivityName: 'Normalisasi Saluran Primer',
    requirements: [
      {
        kategori: 'Tenaga Kerja',
        nama: 'Pekerja',
        koefisien: 10,
        stokHarian: 96,
        terpasang: 94,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Tukang',
        koefisien: 3,
        stokHarian: 100,
        terpasang: 98,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Tenaga Kerja',
        nama: 'Mandor',
        koefisien: 1,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
      {
        kategori: 'Alat',
        nama: 'Excavator',
        koefisien: 1,
        stokHarian: 88,
        terpasang: 85,
        totalSisaStokHariIni: -3,
      },
      {
        kategori: 'Alat',
        nama: 'Compactor',
        koefisien: 1,
        stokHarian: 92,
        terpasang: 90,
        totalSisaStokHariIni: -2,
      },
      {
        kategori: 'Bahan',
        nama: 'Tanah',
        koefisien: 1.2,
        stokHarian: 100,
        terpasang: 100,
        totalSisaStokHariIni: 0,
      },
    ],
  },
]

export async function seedAnalisaKebutuhan() {
  console.log('🏗️ Seeding Analisa Kebutuhan data...')

  try {
    // First, create categories and kebutuhan items
    const categories = await Promise.all(
      Object.keys(kategoriesAndKebutuhan).map(async categoryName => {
        const category = await prisma.kategoriKebutuhan.upsert({
          where: { nama: categoryName },
          update: {},
          create: {
            nama: categoryName,
          },
        })

        console.log(`  ✅ Created/Updated category: ${categoryName}`)
        return {
          ...category,
          items: kategoriesAndKebutuhan[categoryName as keyof typeof kategoriesAndKebutuhan],
        }
      })
    )

    // Create kebutuhan for each category
    const kebutuhanMap = new Map<string, string>() // Map: categoryName-itemName -> kebutuhanId

    for (const category of categories) {
      for (const itemName of category.items) {
        const kebutuhan = await prisma.kebutuhan
          .upsert({
            where: {
              id:
                (
                  await prisma.kebutuhan.findFirst({
                    where: {
                      kategoriKebutuhanId: category.id,
                      nama: itemName,
                    },
                  })
                )?.id || 'new',
            },
            update: {},
            create: {
              kategoriKebutuhanId: category.id,
              nama: itemName,
            },
          })
          .catch(async () => {
            return await prisma.kebutuhan.create({
              data: {
                kategoriKebutuhanId: category.id,
                nama: itemName,
              },
            })
          })

        kebutuhanMap.set(`${category.nama}-${itemName}`, kebutuhan.id)
        console.log(`    ✅ Created/Updated kebutuhan: ${itemName}`)
      }
    }

    // Get existing sub-activities to create analisa kebutuhan for
    const subActivities = await prisma.subActivity.findMany({
      select: {
        id: true,
        name: true,
        activity: {
          select: {
            name: true,
          },
        },
      },
    })

    if (subActivities.length === 0) {
      console.log('⚠️ No sub-activities found. Please run the activities seeder first.')
      return
    }

    console.log(`📋 Found ${subActivities.length} sub-activities`)

    // Clear existing analisa kebutuhan data
    await prisma.analisaKebutuhan.deleteMany({})
    console.log('🗑️ Cleared existing analisa kebutuhan data')

    // Create analisa kebutuhan data
    let createdCount = 0

    for (const sample of analisaKebutuhanSamples) {
      // Find matching sub-activity
      const subActivity = subActivities.find(sa => sa.name === sample.subActivityName)

      if (!subActivity) {
        console.log(`⚠️ Sub-activity not found: ${sample.subActivityName}`)
        continue
      }

      console.log(`🔨 Creating analisa kebutuhan for: ${sample.subActivityName}`)

      // Create analisa kebutuhan entries for this sub-activity
      for (const req of sample.requirements) {
        const kebutuhanId = kebutuhanMap.get(`${req.kategori}-${req.nama}`)

        if (!kebutuhanId) {
          console.log(`⚠️ Kebutuhan not found: ${req.kategori}-${req.nama}`)
          continue
        }

        try {
          // Calculate hasilAnalisaKebutuhan based on koefisien
          // This represents the daily requirement for resource flow
          const hasilAnalisaKebutuhan = req.koefisien * 0.8 // 80% of koefisien as daily target

          await prisma.analisaKebutuhan.create({
            data: {
              subActivityId: subActivity.id,
              kebutuhanId: kebutuhanId,
              koefisien: req.koefisien,
              hasilAnalisaKebutuhan: hasilAnalisaKebutuhan,
              satuanHasilAnalisaKebutuhan:
                req.kategori === 'Tenaga Kerja'
                  ? 'Orang/Hari'
                  : req.kategori === 'Bahan'
                    ? 'Unit/Hari'
                    : 'Unit/Hari', // Default for Alat
              stokHarian: req.stokHarian,
              terpasang: req.terpasang,
              totalSisaStokHariIni: req.totalSisaStokHariIni,
            },
          })
          createdCount++
          console.log(
            `    ✅ Created analisa kebutuhan: ${req.nama} (koef: ${req.koefisien}, daily: ${hasilAnalisaKebutuhan})`
          )
        } catch (error) {
          console.log(`    ❌ Failed to create: ${req.nama} - ${error}`)
        }
      }
    }

    console.log('✅ Analisa Kebutuhan seeding completed!')

    // Return statistics
    const categoryCount = await prisma.kategoriKebutuhan.count()
    const kebutuhanCount = await prisma.kebutuhan.count()
    const analisaCount = await prisma.analisaKebutuhan.count()

    console.log(`📊 Total categories: ${categoryCount}`)
    console.log(`📊 Total kebutuhan items: ${kebutuhanCount}`)
    console.log(`📊 Total analisa kebutuhan entries: ${analisaCount}`)
    console.log(`📊 Created in this run: ${createdCount}`)
  } catch (error) {
    console.error('❌ Error seeding Analisa Kebutuhan:', error)
    throw error
  }
}

// Allow this file to be run directly
if (require.main === module) {
  seedAnalisaKebutuhan()
    .then(() => {
      console.log('🎉 Standalone seeding completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

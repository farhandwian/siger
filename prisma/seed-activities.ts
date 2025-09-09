import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedActivities() {
  console.log('🌱 Seeding activities and sub-activities...')

  // Clear existing activity data
  await prisma.dailySubActivity.deleteMany({})
  await prisma.activitySchedule.deleteMany({})
  await prisma.subActivity.deleteMany({})
  await prisma.activity.deleteMany({})

  // Get existing projects to use their IDs
  const projects = await prisma.project.findMany({
    select: { id: true },
  })

  if (projects.length === 0) {
    console.log('⚠️ No projects found. Please run the main seeder first to create projects.')
    return
  }

  // Define activities and sub-activities for project infrastructure
  const activitiesData = [
    {
      name: 'Pekerjaan Persiapan',
      order: 1,
      subActivities: [
        {
          name: 'Mobilisasi Alat dan Material',
          satuan: 'LS',
          volumeKontrak: 1,
          volumeMC0: 1,
          bobotMC0: 3.5,
          weight: 35,
          order: 1,
        },
        {
          name: 'Pengukuran dan Pematokan',
          satuan: 'm',
          volumeKontrak: 5000,
          volumeMC0: 5000,
          bobotMC0: 2.5,
          weight: 25,
          order: 2,
        },
        {
          name: 'Pembersihan Lahan',
          satuan: 'm2',
          volumeKontrak: 12000,
          volumeMC0: 12000,
          bobotMC0: 4.0,
          weight: 40,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Galian dan Timbunan',
      order: 2,
      subActivities: [
        {
          name: 'Galian Tanah Biasa',
          satuan: 'm3',
          volumeKontrak: 8500,
          volumeMC0: 8500,
          bobotMC0: 15.2,
          weight: 40,
          order: 1,
        },
        {
          name: 'Galian Tanah Keras',
          satuan: 'm3',
          volumeKontrak: 3200,
          volumeMC0: 3200,
          bobotMC0: 8.8,
          weight: 30,
          order: 2,
        },
        {
          name: 'Timbunan Tanah Pilihan',
          satuan: 'm3',
          volumeKontrak: 4500,
          volumeMC0: 4500,
          bobotMC0: 9.5,
          weight: 30,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Beton dan Pasangan',
      order: 3,
      subActivities: [
        {
          name: 'Beton K-200',
          satuan: 'm3',
          volumeKontrak: 450,
          volumeMC0: 450,
          bobotMC0: 12.8,
          weight: 35,
          order: 1,
        },
        {
          name: 'Beton K-250',
          satuan: 'm3',
          volumeKontrak: 280,
          volumeMC0: 280,
          bobotMC0: 8.9,
          weight: 25,
          order: 2,
        },
        {
          name: 'Pasangan Batu Kali',
          satuan: 'm3',
          volumeKontrak: 650,
          volumeMC0: 650,
          bobotMC0: 14.3,
          weight: 40,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Saluran Primer',
      order: 4,
      subActivities: [
        {
          name: 'Normalisasi Saluran Primer',
          satuan: 'm',
          volumeKontrak: 2800,
          volumeMC0: 2800,
          bobotMC0: 18.5,
          weight: 45,
          order: 1,
        },
        {
          name: 'Lining Saluran Beton',
          satuan: 'm2',
          volumeKontrak: 5600,
          volumeMC0: 5600,
          bobotMC0: 16.2,
          weight: 35,
          order: 2,
        },
        {
          name: 'Pembuatan Jalan Inspeksi',
          satuan: 'm',
          volumeKontrak: 2800,
          volumeMC0: 2800,
          bobotMC0: 8.3,
          weight: 20,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Saluran Sekunder',
      order: 5,
      subActivities: [
        {
          name: 'Normalisasi Saluran Sekunder',
          satuan: 'm',
          volumeKontrak: 4200,
          volumeMC0: 4200,
          bobotMC0: 14.8,
          weight: 50,
          order: 1,
        },
        {
          name: 'Rehabilitasi Saluran Sekunder',
          satuan: 'm',
          volumeKontrak: 1800,
          volumeMC0: 1800,
          bobotMC0: 9.2,
          weight: 30,
          order: 2,
        },
        {
          name: 'Box Culvert Saluran Sekunder',
          satuan: 'unit',
          volumeKontrak: 12,
          volumeMC0: 12,
          bobotMC0: 6.5,
          weight: 20,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Bangunan Pelengkap',
      order: 6,
      subActivities: [
        {
          name: 'Pintu Air Otomatis',
          satuan: 'unit',
          volumeKontrak: 8,
          volumeMC0: 8,
          bobotMC0: 12.6,
          weight: 40,
          order: 1,
        },
        {
          name: 'Pintu Air Manual',
          satuan: 'unit',
          volumeKontrak: 15,
          volumeMC0: 15,
          bobotMC0: 8.4,
          weight: 25,
          order: 2,
        },
        {
          name: 'Jembatan Penyeberangan',
          satuan: 'unit',
          volumeKontrak: 6,
          volumeMC0: 6,
          bobotMC0: 9.8,
          weight: 35,
          order: 3,
        },
      ],
    },
    {
      name: 'Pekerjaan Finishing',
      order: 7,
      subActivities: [
        {
          name: 'Pemasangan Pagar Keliling',
          satuan: 'm',
          volumeKontrak: 1200,
          volumeMC0: 1200,
          bobotMC0: 4.2,
          weight: 30,
          order: 1,
        },
        {
          name: 'Pemasangan Rambu dan Papan Nama',
          satuan: 'unit',
          volumeKontrak: 8,
          volumeMC0: 8,
          bobotMC0: 1.8,
          weight: 20,
          order: 2,
        },
        {
          name: 'Pembersihan Akhir dan Demobilisasi',
          satuan: 'LS',
          volumeKontrak: 1,
          volumeMC0: 1,
          bobotMC0: 4.5,
          weight: 50,
          order: 3,
        },
      ],
    },
  ]

  // Create activities and sub-activities for each project
  for (const project of projects) {
    console.log(`📋 Creating activities for project ${project.id}...`)

    for (const activityData of activitiesData) {
      const activity = await prisma.activity.create({
        data: {
          projectId: project.id,
          name: activityData.name,
          order: activityData.order,
        },
      })

      console.log(`  ✅ Created activity: ${activity.name}`)

      // Create sub-activities for this activity
      for (const subActivityData of activityData.subActivities) {
        const subActivity = await prisma.subActivity.create({
          data: {
            activityId: activity.id,
            name: subActivityData.name,
            satuan: subActivityData.satuan,
            volumeKontrak: subActivityData.volumeKontrak,
            volumeMC0: subActivityData.volumeMC0,
            bobotMC0: subActivityData.bobotMC0,
            weight: subActivityData.weight,
            order: subActivityData.order,
          },
        })

        console.log(`    ✅ Created sub-activity: ${subActivity.name}`)

        // Create schedules for the current year (2025) for each sub-activity
        const currentYear = 2025
        const scheduleData = []

        // Create monthly schedules for the entire year
        for (let month = 1; month <= 12; month++) {
          for (let week = 1; week <= 4; week++) {
            // Calculate plan percentage based on activity progression
            let planPercentage = 0
            let actualPercentage = 0

            // Distribute work across months based on activity order
            const startMonth = Math.max(1, activityData.order - 1)
            const endMonth = Math.min(12, activityData.order + 2)

            if (month >= startMonth && month <= endMonth) {
              const totalWeeks = (endMonth - startMonth + 1) * 4
              const currentWeek = (month - startMonth) * 4 + week
              planPercentage = Math.min(100, (currentWeek / totalWeeks) * 100)

              // Add some realistic variance to actual progress
              if (month <= 9) {
                // Up to current month (September 2025)
                const variance = (Math.random() - 0.5) * 10 // ±5% variance
                actualPercentage = Math.max(0, Math.min(100, planPercentage + variance))
              }
            }

            scheduleData.push({
              subActivityId: subActivity.id,
              month,
              year: currentYear,
              week,
              planPercentage: Math.round(planPercentage * 100) / 100,
              actualPercentage: Math.round(actualPercentage * 100) / 100,
            })
          }
        }

        // Insert all schedules for this sub-activity
        await prisma.activitySchedule.createMany({
          data: scheduleData,
        })

        console.log(`    📅 Created ${scheduleData.length} schedules for ${subActivity.name}`)
      }
    }
  }

  // Create sample daily sub-activities
  await createSampleDailyActivities()

  console.log('✅ Activities and sub-activities seeding completed!')
}

async function createSampleDailyActivities() {
  console.log('📱 Creating sample daily sub-activities...')

  // Get some users to assign daily activities
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    take: 3,
  })

  if (users.length === 0) {
    console.log('⚠️ No users found for daily activities.')
    return
  }

  // Get some sub-activities to create daily updates for
  const subActivities = await prisma.subActivity.findMany({
    take: 10, // Get first 10 sub-activities
  })

  // Create daily activities for the last 30 days
  const currentDate = new Date()
  const datesList: string[] = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i)
    datesList.push(date.toISOString().split('T')[0])
  }

  let dailyActivitiesCreated = 0

  for (const subActivity of subActivities) {
    // Randomly assign some days to users
    for (const date of datesList) {
      // Skip some days randomly to make it more realistic
      if (Math.random() < 0.3) continue

      const user = users[Math.floor(Math.random() * users.length)]

      try {
        // Generate coordinates in the range of Lampung area (-5.385 to -5.405 lat, 105.285 to 105.31 lng)
        const baseLatitude = -5.395
        const baseLongitude = 105.295
        const latitudeRange = 0.02 // ±0.01 degrees (roughly -5.385 to -5.405)
        const longitudeRange = 0.025 // ±0.0125 degrees (roughly 105.285 to 105.31)

        await prisma.dailySubActivity.create({
          data: {
            subActivityId: subActivity.id,
            userId: user.id,
            koordinat: {
              latitude: baseLatitude + (Math.random() - 0.5) * latitudeRange,
              longitude: baseLongitude + (Math.random() - 0.5) * longitudeRange,
            },
            catatanKegiatan: `Progres kerja ${subActivity.name.toLowerCase()} hari ini sesuai rencana. ${getRandomProgressNote()}`,
            file: [
              {
                filename: `progress_${date.replace(/-/g, '')}_${Math.floor(Math.random() * 1000)}.jpg`,
                path: `/uploads/daily/${date.replace(/-/g, '')}/progress_${Math.floor(Math.random() * 1000)}.jpg`,
              },
            ],
            progresRealisasiPerHari: Math.round((Math.random() * 15 + 5) * 100) / 100, // 5-20% daily progress
            tanggalProgres: date,
          },
        })
        dailyActivitiesCreated++
      } catch (error) {
        // Skip if duplicate (unique constraint on subActivityId, tanggalProgres, userId)
        continue
      }
    }
  }

  console.log(`📱 Created ${dailyActivitiesCreated} daily sub-activities`)
}

function getRandomProgressNote(): string {
  const notes = [
    'Cuaca mendukung untuk pelaksanaan pekerjaan.',
    'Material tersedia cukup di lokasi.',
    'Tim kerja bekerja dengan koordinasi yang baik.',
    'Tidak ada kendala berarti dalam pelaksanaan.',
    'Perlu sedikit penyesuaian pada metode kerja.',
    'Alat berat berfungsi dengan baik.',
    'Koordinasi dengan tim lain berjalan lancar.',
    'Target harian tercapai sesuai rencana.',
    'Ada sedikit penyesuaian karena kondisi lapangan.',
    'Progres sesuai dengan jadwal yang telah ditetapkan.',
  ]

  return notes[Math.floor(Math.random() * notes.length)]
}

export default seedActivities

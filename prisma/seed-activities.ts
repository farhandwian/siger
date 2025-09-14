import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seeds activities and sub-activities with new schema structure
 * 
 * Key improvements:
 * 1. Total weight distribution: ALL sub-activities in a project sum to exactly 100%
 * 2. Schedule plan percentages correspond directly to sub-activity weights
 * 3. Removed deprecated fields (volumeMC0, bobotMC0) to match current Prisma schema
 * 4. Each sub-activity weight represents its percentage contribution to the total project
 * 5. 21 sub-activities total: weights range from 2% to 9% each, summing to 100%
 */
async function seedActivities() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding activities and sub-activities with new schemas...')

  // Clear existing activity data
  await prisma.dailyReport.deleteMany({})
  await prisma.realizationDaily.deleteMany({})
  await prisma.realization.deleteMany({})
  await prisma.actionPlan.deleteMany({})
  await prisma.schedulePlan.deleteMany({})
  await prisma.subActivity.deleteMany({})
  await prisma.activity.deleteMany({})

  // Get existing projects to use their IDs
  const projects = await prisma.project.findMany({
    select: { id: true },
  })

  if (projects.length === 0) {
    // eslint-disable-next-line no-console
    console.log('⚠️ No projects found. Please run the main seeder first to create projects.')
    return
  }

  // Define activities and sub-activities with proper weight distribution
  // Total weight of ALL sub-activities within a single project should sum to 100%
  // 21 sub-activities total, carefully distributed to sum exactly to 100%
  const activitiesData = [
    {
      name: 'Pekerjaan Persiapan',
      order: 1,
      subActivities: [
        {
          name: 'Mobilisasi Alat dan Material',
          satuan: 'LS',
          volume: 1,
          weight: 5.0, // 5% of total project (reduced from 6%)
          order: 1,
        },
        {
          name: 'Pengukuran dan Pematokan',
          satuan: 'm',
          volume: 5000,
          weight: 4.0, // 4% of total project
          order: 2,
        },
        {
          name: 'Pembersihan Lahan',
          satuan: 'm2',
          volume: 12000,
          weight: 5.0, // 5% of total project
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
          volume: 8500,
          weight: 7.0, // 7% of total project (reduced from 8%)
          order: 1,
        },
        {
          name: 'Galian Tanah Keras',
          satuan: 'm3',
          volume: 3200,
          weight: 5.0, // 5% of total project (reduced from 6%)
          order: 2,
        },
        {
          name: 'Timbunan Tanah Pilihan',
          satuan: 'm3',
          volume: 4500,
          weight: 5.0, // 5% of total project
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
          volume: 450,
          weight: 6.0, // 6% of total project (reduced from 7%)
          order: 1,
        },
        {
          name: 'Beton K-250',
          satuan: 'm3',
          volume: 280,
          weight: 4.0, // 4% of total project
          order: 2,
        },
        {
          name: 'Pasangan Batu Kali',
          satuan: 'm3',
          volume: 650,
          weight: 6.0, // 6% of total project
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
          volume: 2800,
          weight: 8.0, // 8% of total project (reduced from 9%)
          order: 1,
        },
        {
          name: 'Lining Saluran Beton',
          satuan: 'm2',
          volume: 5600,
          weight: 6.0, // 6% of total project (reduced from 7%)
          order: 2,
        },
        {
          name: 'Pembuatan Jalan Inspeksi',
          satuan: 'm',
          volume: 2800,
          weight: 3.0, // 3% of total project
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
          volume: 4200,
          weight: 7.0, // 7% of total project (reduced from 8%)
          order: 1,
        },
        {
          name: 'Rehabilitasi Saluran Sekunder',
          satuan: 'm',
          volume: 1800,
          weight: 5.0, // 5% of total project
          order: 2,
        },
        {
          name: 'Box Culvert Saluran Sekunder',
          satuan: 'unit',
          volume: 12,
          weight: 3.0, // 3% of total project
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
          volume: 8,
          weight: 5.0, // 5% of total project (reduced from 6%)
          order: 1,
        },
        {
          name: 'Pintu Air Manual',
          satuan: 'unit',
          volume: 15,
          weight: 4.0, // 4% of total project
          order: 2,
        },
        {
          name: 'Jembatan Penyeberangan',
          satuan: 'unit',
          volume: 6,
          weight: 3.0, // 3% of total project
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
          volume: 1200,
          weight: 3.0, // 3% of total project (reduced from 4%)
          order: 1,
        },
        {
          name: 'Pemasangan Rambu dan Papan Nama',
          satuan: 'unit',
          volume: 8,
          weight: 2.0, // 2% of total project
          order: 2,
        },
        {
          name: 'Pembersihan Akhir dan Demobilisasi',
          satuan: 'LS',
          volume: 1,
          weight: 4.0, // 4% of total project
          order: 3,
        },
      ],
    },
  ]
  
  // Verify total weight = 100%
  // 5+4+5 + 7+5+5 + 6+4+6 + 8+6+3 + 7+5+3 + 5+4+3 + 3+2+4 = 14+17+16+17+15+12+9 = 100 ✅
  const totalWeight = activitiesData.reduce((sum, activity) => 
    sum + activity.subActivities.reduce((actSum, sub) => actSum + sub.weight, 0), 0
  )
  if (totalWeight !== 100) {
    throw new Error(`Total sub-activity weights must equal 100%, got ${totalWeight}%`)
  }

  // Create activities and sub-activities for each project
  for (const project of projects) {
    // eslint-disable-next-line no-console
    console.log(`📋 Creating activities for project ${project.id}...`)

    for (const activityData of activitiesData) {
      const activity = await prisma.activity.create({
        data: {
          projectId: project.id,
          name: activityData.name,
          order: activityData.order,
        },
      })

      // eslint-disable-next-line no-console
      console.log(`  ✅ Created activity: ${activity.name}`)

      // Create sub-activities for this activity
      for (const subActivityData of activityData.subActivities) {
        const subActivity = await prisma.subActivity.create({
          data: {
            activityId: activity.id,
            name: subActivityData.name,
            satuan: subActivityData.satuan,
            volume: subActivityData.volume,
            weight: subActivityData.weight,
            order: subActivityData.order,
          },
        })

        // eslint-disable-next-line no-console
        console.log(`    ✅ Created sub-activity: ${subActivity.name}`)

        // Create schedules for the current year (2025) for each sub-activity
        // The sub-activity weight represents its percentage contribution to the total project
        const currentYear = 2025
        const scheduleData = []

        // Create monthly schedules for the entire year
        for (let month = 1; month <= 12; month++) {
          for (let week = 1; week <= 4; week++) {
            // Calculate plan percentage based on activity progression and timeline
            let planPercentage = 0
            let actualPercentage = 0

            // Distribute work across months based on activity order and timeline
            const startMonth = Math.max(1, activityData.order)
            const endMonth = Math.min(12, activityData.order + 3)

            if (month >= startMonth && month <= endMonth) {
              const totalWeeks = (endMonth - startMonth + 1) * 4
              const currentWeek = (month - startMonth) * 4 + week

              // Calculate weekly progress as a portion of total sub-activity weight
              // Each week should contribute a small portion of the total weight
              const weeklyProgress = subActivityData.weight / totalWeeks
              planPercentage = Math.min(subActivityData.weight, weeklyProgress * currentWeek)

              // Add some realistic variance to actual progress
              if (month <= 9) {
                // Up to current month (September 2025)
                const variance = (Math.random() - 0.5) * 0.5 // ±0.25% variance
                actualPercentage = Math.max(0, Math.min(subActivityData.weight, planPercentage + variance))
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

        // Create separate SchedulePlan and Realization records
        const schedulePlans = scheduleData.map(data => ({
          subActivityId: data.subActivityId,
          month: data.month,
          year: data.year,
          week: data.week,
          percentage: data.planPercentage,
        }))

        const realizations = scheduleData.filter(data => data.actualPercentage > 0).map(data => ({
          subActivityId: data.subActivityId,
          month: data.month,
          year: data.year,
          week: data.week,
          percentage: data.actualPercentage,
        }))

        // Insert schedule plans
        await prisma.schedulePlan.createMany({
          data: schedulePlans,
        })

        // Insert realizations (only for completed periods)
        if (realizations.length > 0) {
          await prisma.realization.createMany({
            data: realizations,
          })
        }

        // eslint-disable-next-line no-console
        console.log(`    📅 Created ${schedulePlans.length} schedule plans and ${realizations.length} realizations for ${subActivity.name}`)
      }
    }
  }

  // Create sample daily sub-activities
  await createSampleDailyActivities()

  // eslint-disable-next-line no-console
  console.log('✅ Activities and sub-activities seeding completed!')
}

async function createSampleDailyActivities() {
  // eslint-disable-next-line no-console
  console.log('📱 Creating sample daily reports...')

  // Get some users to assign daily activities (PPK and VENDOR users who do daily updates)
  const users = await prisma.user.findMany({
    where: { 
      role: {
        in: [UserRole.PPK, UserRole.VENDOR]
      }
    },
    take: 3,
  })

  if (users.length === 0) {
    // eslint-disable-next-line no-console
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

        await prisma.dailyReport.create({
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

  // eslint-disable-next-line no-console
  console.log(`📱 Created ${dailyActivitiesCreated} daily reports`)
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

async function main() {
  try {
    await seedActivities()
    // eslint-disable-next-line no-console
    console.log('🎉 Activities seeding completed successfully!')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error during activities seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e)
      process.exit(1)
    })
}

export default seedActivities

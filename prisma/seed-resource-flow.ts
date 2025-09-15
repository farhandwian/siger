/**
 * Seeder for Resource Flow Schedule data
 * Creates sample schedule data for testing the Resource Flow functionality
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate date range
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// Helper function to generate realistic schedule values
function generateScheduleValue(date: string, baseValue: number, variance: number = 0.2): number {
  const dayOfMonth = new Date(date).getDate()
  const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
  const dailyVariance = 1 + (Math.random() - 0.5) * variance

  // Create some pattern based on day of month
  let dayFactor = 1
  if (dayOfMonth <= 10) {
    dayFactor = 0.7 // Slower start
  } else if (dayOfMonth <= 20) {
    dayFactor = 1.2 // Peak activity
  } else {
    dayFactor = 0.9 // Wind down
  }

  return Math.round(baseValue * randomFactor * dailyVariance * dayFactor * 100) / 100
}

export async function seedResourceFlowSchedules() {
  console.log('🏗️ Seeding Resource Flow Schedule data...')

  try {
    // Clear existing resource flow schedules
    await prisma.resourceFlowSchedule.deleteMany({})
    console.log('🗑️ Cleared existing resource flow schedules')

    // Get all analisa kebutuhan entries
    const analisaKebutuhanEntries = await prisma.analisaKebutuhan.findMany({
      include: {
        subActivity: {
          include: {
            activity: true,
          },
        },
        kebutuhan: {
          include: {
            kategoriKebutuhan: true,
          },
        },
      },
    })

    console.log(`📋 Found ${analisaKebutuhanEntries.length} analisa kebutuhan entries`)

    if (analisaKebutuhanEntries.length === 0) {
      console.log(
        '⚠️ No analisa kebutuhan entries found. Please run the analisa kebutuhan seeder first.'
      )
      return
    }

    // Generate date range for current month and next 2 months
    const currentDate = new Date()
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

    const dateRange = generateDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )

    console.log(
      `📅 Generating schedules for ${dateRange.length} days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`
    )

    let createdCount = 0

    // Create schedules for each analisa kebutuhan entry
    for (const analisaEntry of analisaKebutuhanEntries) {
      console.log(
        `🔨 Creating schedules for: ${analisaEntry.subActivity.activity.name} > ${analisaEntry.subActivity.name} > ${analisaEntry.kebutuhan.nama}`
      )

      // Use koefisien as base value for generating realistic numbers
      const baseRencana = analisaEntry.koefisien || 1
      const baseRealisasi = baseRencana * 0.85 // Slightly lower realisasi on average

      for (const date of dateRange) {
        try {
          // Generate realistic values
          const rencana = generateScheduleValue(date, baseRencana, 0.3)
          const realisasi = generateScheduleValue(date, baseRealisasi, 0.4)

          await prisma.resourceFlowSchedule.create({
            data: {
              analisaKebutuhanId: analisaEntry.id,
              tanggal: date,
              rencana: rencana,
              realisasi: realisasi,
              file: null, // No files for seed data
            },
          })

          createdCount++
        } catch (error) {
          console.log(`    ❌ Failed to create schedule for ${date}: ${error}`)
        }
      }

      console.log(`    ✅ Created ${dateRange.length} schedules`)
    }

    console.log('✅ Resource Flow Schedule seeding completed!')
    console.log(`📊 Total schedules created: ${createdCount}`)

    // Return statistics
    const totalSchedules = await prisma.resourceFlowSchedule.count()
    console.log(`📊 Total schedules in database: ${totalSchedules}`)
  } catch (error) {
    console.error('❌ Error seeding Resource Flow Schedules:', error)
    throw error
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedResourceFlowSchedules()
    .then(() => {
      console.log('🎉 Standalone seeding completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

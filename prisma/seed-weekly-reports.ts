import { PrismaClient, ReportStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed data for weekly reports
 * Creates sample weekly reports for existing projects
 */
export async function seedWeeklyReports() {
  console.log('🌱 Seeding weekly reports...')

  try {
    // First, get some existing projects
    const projects = await prisma.project.findMany({
      take: 5, // Get first 5 projects
      select: {
        id: true,
        pekerjaan: true,
      },
    })

    if (projects.length === 0) {
      console.log('⚠️ No projects found. Please seed projects first.')
      return
    }

    const weeklyReports = []

    // Create sample weekly reports for each project
    for (const project of projects) {
      // Create reports for the last 8 weeks
      for (let week = 1; week <= 8; week++) {
        const startDate = new Date('2025-08-10')
        startDate.setDate(startDate.getDate() + (week - 1) * 7)

        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)

        weeklyReports.push({
          projectId: project.id,
          weekNumber: week,
          startDate,
          endDate,
          filePath: `/reports/${project.id}/week-${week}.pdf`,
          fileUrl: `/api/reports/download/${project.id}/week-${week}`,
          status: week <= 6 ? ReportStatus.PUBLISHED : ReportStatus.DRAFT,
        })
      }
    }

    // Insert all weekly reports
    const created = await prisma.weeklyReport.createMany({
      data: weeklyReports,
      skipDuplicates: true,
    })

    console.log(`✅ Created ${created.count} weekly reports`)

    return created
  } catch (error) {
    console.error('❌ Error seeding weekly reports:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if this script was called directly
if (process.argv[1] === __filename) {
  seedWeeklyReports()
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

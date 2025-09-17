/**
 * Main seeder file that runs all necessary seed scripts
 * This file replaces the old seed.ts and runs the enhanced auth system
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...')

  // Delete records in correct order to avoid foreign key constraint issues
  // Delete child tables first
  await prisma.resourceFlowSchedule.deleteMany({})
  await prisma.analisaKebutuhan.deleteMany({})
  await prisma.kebutuhan.deleteMany({})
  await prisma.kategoriKebutuhan.deleteMany({})
  await prisma.dailyReport.deleteMany({})
  await prisma.schedule.deleteMany({})
  await prisma.subActivity.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.projectAssignment.deleteMany({})
  await prisma.projectAuditLog.deleteMany({})
  await prisma.addendums.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.satker.deleteMany({})
  await prisma.balai.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.verificationToken.deleteMany({})
  await prisma.wilayah.deleteMany({})

  console.log('✅ Database cleanup completed.')
}

async function main() {
  console.log('🌱 Starting database seeding process...\n')

  try {
    // Cleanup database first
    await cleanupDatabase()

    // Run enhanced auth seeder (includes organizations, users, and roles)
    console.log('📊 Seeding enhanced authentication system...')
    execSync('tsx prisma/seed-enhanced-auth.ts', { stdio: 'inherit' })
    console.log('✅ Enhanced auth system seeded successfully\n')

    // Run project assignments seeder (sample projects and assignments)
    console.log('🏗️ Seeding project assignments...')
    execSync('tsx prisma/seed-project-assignments.ts', { stdio: 'inherit' })
    console.log('✅ Project assignments seeded successfully\n')

    // Run activities seeder (activities, sub-activities, schedules, and daily activities)
    console.log('📋 Seeding activities and schedules...')
    execSync('tsx prisma/seed-activities.ts', { stdio: 'inherit' })
    console.log('✅ Activities and schedules seeded successfully\n')

    // Run analisa kebutuhan seeder (resource requirements analysis)
    console.log('🔧 Seeding analisa kebutuhan (resource requirements)...')
    execSync('tsx prisma/seed-analisa-kebutuhan.ts', { stdio: 'inherit' })
    console.log('✅ Analisa kebutuhan seeded successfully\n')

    // Run resource flow schedules seeder (resource flow planning data)
    console.log('📊 Seeding resource flow schedules...')
    execSync('tsx prisma/seed-resource-flow.ts', { stdio: 'inherit' })
    console.log('✅ Resource flow schedules seeded successfully\n')

    console.log('🎉 All seeding completed successfully!')
    console.log('📋 Summary:')
    console.log('   - Enhanced authentication system with 7 roles')
    console.log('   - Organizational hierarchy (4 Balai, 8 Satkers)')
    console.log('   - 15 users across all roles')
    console.log('   - 4 sample infrastructure projects')
    console.log('   - PPK/VENDOR project assignments')
    console.log('   - 7 activity categories with sub-activities')
    console.log('   - Activity schedules and daily progress data')
    console.log('   - Resource requirements analysis (Analisa Kebutuhan)')
    console.log('   - Resource flow schedules for project tracking')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

main().catch(e => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})

/**
 * Migration to add performance indexes for Schedule Plans and Realizations APIs
 * Run this after deploying the optimized API endpoints
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addPerformanceIndexes() {
  console.log('🔧 Adding performance indexes for Schedule Plans and Realizations...')

  try {
    // Add indexes for better query performance
    await prisma.$executeRaw`
      -- Index for filtering by project (most common query pattern)
      CREATE INDEX IF NOT EXISTS "schedule_plans_project_lookup_idx" 
      ON "schedule_plans" ("sub_activity_id");
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "realizations_project_lookup_idx" 
      ON "realizations" ("sub_activity_id");
    `

    await prisma.$executeRaw`
      -- Index for time-based filtering (year, month, week combinations)
      CREATE INDEX IF NOT EXISTS "schedule_plans_time_filter_idx" 
      ON "schedule_plans" ("year", "month", "week");
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "realizations_time_filter_idx" 
      ON "realizations" ("year", "month", "week");
    `

    await prisma.$executeRaw`
      -- Composite index for the most common query pattern (project + time)
      CREATE INDEX IF NOT EXISTS "schedule_plans_project_time_idx" 
      ON "schedule_plans" ("sub_activity_id", "year", "month", "week");
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "realizations_project_time_idx" 
      ON "realizations" ("sub_activity_id", "year", "month", "week");
    `

    await prisma.$executeRaw`
      -- Index for sub_activities to improve JOIN performance
      CREATE INDEX IF NOT EXISTS "sub_activities_activity_lookup_idx" 
      ON "sub_activities" ("activity_id");
    `

    await prisma.$executeRaw`
      -- Index for activities to improve project filtering
      CREATE INDEX IF NOT EXISTS "activities_project_lookup_idx" 
      ON "activities" ("project_id");
    `

    console.log('✅ Performance indexes added successfully!')
    console.log('Expected improvements:')
    console.log('- 30-50% reduction in query time for projectId filters')
    console.log('- Better performance for time-range queries')
    console.log('- Improved JOIN performance across related tables')

  } catch (error) {
    console.error('❌ Error adding performance indexes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
addPerformanceIndexes()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { addPerformanceIndexes }

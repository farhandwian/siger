/**
 * Main seeder file that runs all necessary seed scripts
 * This file replaces the old seed.ts and runs the enhanced auth system
 */

import { execSync } from 'child_process';

async function main() {
  console.log('🌱 Starting database seeding process...\n');
  
  try {
    // Run enhanced auth seeder (includes organizations, users, and roles)
    console.log('📊 Seeding enhanced authentication system...');
    execSync('tsx prisma/seed-enhanced-auth.ts', { stdio: 'inherit' });
    console.log('✅ Enhanced auth system seeded successfully\n');
    
    // Run project assignments seeder (sample projects and assignments)
    console.log('🏗️ Seeding project assignments...');
    execSync('tsx prisma/seed-project-assignments.ts', { stdio: 'inherit' });
    console.log('✅ Project assignments seeded successfully\n');
    
    // Run activities seeder (activities, sub-activities, schedules, and daily activities)
    console.log('📋 Seeding activities and schedules...');
    execSync('tsx prisma/seed-activities.ts', { stdio: 'inherit' });
    console.log('✅ Activities and schedules seeded successfully\n');
    
    console.log('🎉 All seeding completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Enhanced authentication system with 7 roles');
    console.log('   - Organizational hierarchy (4 Balai, 8 Departments)');
    console.log('   - 15 users across all roles');
    console.log('   - 4 sample infrastructure projects');
    console.log('   - PPK/VENDOR project assignments');
    console.log('   - 7 activity categories with sub-activities');
    console.log('   - Activity schedules and daily progress data');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error:', e);
    process.exit(1);
  });

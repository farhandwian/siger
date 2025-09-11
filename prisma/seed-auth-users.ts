import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * User Seeder
 * Creates initial users with different roles for testing authentication
 * Run with: npx tsx prisma/seed-auth-users.ts
 */

async function seedAuthUsers() {
  console.log('🌱 Seeding authentication users...')

  try {
    // Hash password for all users (use a secure password in production)
    const hashedPassword = await bcrypt.hash('password123', 12)

    const users = [
      {
        username: 'admin',
        email: 'admin@siger.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      {
        username: 'manager',
        email: 'manager@siger.com',
        name: 'Project Manager',
        password: hashedPassword,
        role: 'MANAGER',
        isActive: true,
      },
      {
        username: 'user',
        email: 'user@siger.com',
        name: 'Regular User',
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
      {
        username: 'viewer',
        email: 'viewer@siger.com',
        name: 'Read Only Viewer',
        password: hashedPassword,
        role: 'VIEWER',
        isActive: true,
      },
    ]

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: user.password,
          role: user.role as any,
          isActive: user.isActive,
        },
        create: user as any,
      })
      console.log(`✅ Created/updated user: ${user.email} (${user.role})`)
    }

    console.log('\n🎉 Authentication users seeded successfully!')
    console.log('\n📋 Login credentials:')
    console.log('Admin: admin@siger.com / password123')
    console.log('Manager: manager@siger.com / password123')
    console.log('User: user@siger.com / password123')
    console.log('Viewer: viewer@siger.com / password123')
    console.log('\n⚠️  Remember to change passwords in production!')
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAuthUsers()
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedAuthUsers }

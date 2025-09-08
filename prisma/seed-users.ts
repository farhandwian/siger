import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedUsers() {
  console.log('🌱 Seeding users...')

  const users = [
    {
      username: 'admin',
      email: 'admin@siger.com',
      name: 'Administrator',
      role: 'admin',
      phoneNumber: '+62812345678',
      isActive: true,
    },
    {
      username: 'supervisor1',
      email: 'supervisor1@siger.com',
      name: 'Supervisor Proyek 1',
      role: 'supervisor',
      phoneNumber: '+62812345679',
      isActive: true,
    },
    {
      username: 'supervisor2',
      email: 'supervisor2@siger.com',
      name: 'Supervisor Proyek 2',
      role: 'supervisor',
      phoneNumber: '+62812345680',
      isActive: true,
    },
    {
      username: 'pekerja1',
      email: 'pekerja1@siger.com',
      name: 'Pekerja Lapangan 1',
      role: 'user',
      phoneNumber: '+62812345681',
      isActive: true,
    },
    {
      username: 'pekerja2',
      email: 'pekerja2@siger.com',
      name: 'Pekerja Lapangan 2',
      role: 'user',
      phoneNumber: '+62812345682',
      isActive: true,
    },
    {
      username: 'pekerja3',
      email: 'pekerja3@siger.com',
      name: 'Pekerja Lapangan 3',
      role: 'user',
      phoneNumber: '+62812345683',
      isActive: true,
    },
    {
      username: 'mandor1',
      email: 'mandor1@siger.com',
      name: 'Mandor Tim 1',
      role: 'supervisor',
      phoneNumber: '+62812345684',
      isActive: true,
    },
    {
      username: 'mandor2',
      email: 'mandor2@siger.com',
      name: 'Mandor Tim 2',
      role: 'supervisor',
      phoneNumber: '+62812345685',
      isActive: true,
    },
    {
      username: 'operator1',
      email: 'operator1@siger.com',
      name: 'Operator Alat Berat 1',
      role: 'user',
      phoneNumber: '+62812345686',
      isActive: true,
    },
    {
      username: 'operator2',
      email: 'operator2@siger.com',
      name: 'Operator Alat Berat 2',
      role: 'user',
      phoneNumber: '+62812345687',
      isActive: true,
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: userData,
      create: userData,
    })
    console.log(`✓ User ${userData.username} (${userData.name}) created/updated`)
  }

  console.log('✅ Users seeding completed!')
}

export default seedUsers

// Run directly if this file is executed
if (require.main === module) {
  seedUsers()
    .catch(e => {
      console.error('❌ Error seeding users:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

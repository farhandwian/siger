import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedOrganizationalData() {
  console.log('🏢 Seeding organizational data...')

  // Create Balai (Regional Offices)
  const balaiData = [
    {
      id: 'balai-001',
      name: 'Balai Wilayah Sungai Sumatera I',
      code: 'BWS-S1', 
      description: 'BWS Sumatera I - Medan',
      address: 'Jl. Sisingamangaraja No.1, Medan'
    },
    {
      id: 'balai-002', 
      name: 'Balai Wilayah Sungai Sumatera II',
      code: 'BWS-S2',
      description: 'BWS Sumatera II - Padang', 
      address: 'Jl. Raya Padang-Bukittinggi No.23, Padang'
    },
    {
      id: 'balai-003',
      name: 'Balai Wilayah Sungai Jawa I',
      code: 'BWS-J1',
      description: 'BWS Jawa I - Jakarta',
      address: 'Jl. Pattimura No.20, Jakarta Selatan'
    },
    {
      id: 'balai-004',
      name: 'Balai Wilayah Sungai Jawa II', 
      code: 'BWS-J2',
      description: 'BWS Jawa II - Surabaya',
      address: 'Jl. A. Yani No.45, Surabaya'
    }
  ]

  for (const balai of balaiData) {
    await prisma.balai.upsert({
      where: { code: balai.code },
      update: balai,
      create: balai
    })
    console.log(`✅ Created/Updated Balai: ${balai.name}`)
  }

  // Create Departments (SATKER) under each Balai
  const departmentData = [
    // BWS Sumatera I Departments
    { 
      id: 'dept-001', 
      name: 'SATKER Pembangunan SDA Sumatera I',
      code: 'SATKER-PSDA-S1',
      description: 'Satuan Kerja Pembangunan SDA BWS Sumatera I',
      balaiId: 'balai-001'
    },
    {
      id: 'dept-002',
      name: 'SATKER Operasi & Pemeliharaan SDA Sumatera I', 
      code: 'SATKER-OP-S1',
      description: 'Satuan Kerja Operasi & Pemeliharaan SDA BWS Sumatera I',
      balaiId: 'balai-001'
    },
    // BWS Sumatera II Departments
    {
      id: 'dept-003',
      name: 'SATKER Pembangunan SDA Sumatera II',
      code: 'SATKER-PSDA-S2', 
      description: 'Satuan Kerja Pembangunan SDA BWS Sumatera II',
      balaiId: 'balai-002'
    },
    {
      id: 'dept-004',
      name: 'SATKER Operasi & Pemeliharaan SDA Sumatera II',
      code: 'SATKER-OP-S2',
      description: 'Satuan Kerja Operasi & Pemeliharaan SDA BWS Sumatera II', 
      balaiId: 'balai-002'
    },
    // BWS Jawa I Departments  
    {
      id: 'dept-005',
      name: 'SATKER Pembangunan SDA Jawa I',
      code: 'SATKER-PSDA-J1',
      description: 'Satuan Kerja Pembangunan SDA BWS Jawa I',
      balaiId: 'balai-003'
    },
    {
      id: 'dept-006', 
      name: 'SATKER Operasi & Pemeliharaan SDA Jawa I',
      code: 'SATKER-OP-J1',
      description: 'Satuan Kerja Operasi & Pemeliharaan SDA BWS Jawa I',
      balaiId: 'balai-003'
    },
    // BWS Jawa II Departments
    {
      id: 'dept-007',
      name: 'SATKER Pembangunan SDA Jawa II', 
      code: 'SATKER-PSDA-J2',
      description: 'Satuan Kerja Pembangunan SDA BWS Jawa II',
      balaiId: 'balai-004'
    },
    {
      id: 'dept-008',
      name: 'SATKER Operasi & Pemeliharaan SDA Jawa II',
      code: 'SATKER-OP-J2', 
      description: 'Satuan Kerja Operasi & Pemeliharaan SDA BWS Jawa II',
      balaiId: 'balai-004'
    }
  ]

  for (const dept of departmentData) {
    await prisma.department.upsert({
      where: { 
        balaiId_code: {
          balaiId: dept.balaiId,
          code: dept.code
        }
      },
      update: dept,
      create: dept
    })
    console.log(`✅ Created/Updated Department: ${dept.name}`)
  }
}

async function seedUserRoles() {
  console.log('👥 Seeding users with new roles...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  const userData = [
    // System Administrator
    {
      id: 'user-admin-sistem',
      username: 'admin.sistem',
      email: 'admin.sistem@siger.com', 
      name: 'Admin Sistem SIGER',
      password: hashedPassword,
      role: UserRole.ADMIN_SISTEM,
      isActive: true
    },
    
    // Director General
    {
      id: 'user-dirjen',
      username: 'dirjen.sda',
      email: 'dirjen.sda@pu.go.id',
      name: 'Direktur Jenderal SDA',
      password: hashedPassword, 
      role: UserRole.DIRJEN_SDA,
      isActive: true
    },

    // Balai Administrators
    {
      id: 'user-admin-balai-s1',
      username: 'admin.bws.s1',
      email: 'admin.bws.s1@pu.go.id',
      name: 'Admin BWS Sumatera I',
      password: hashedPassword,
      role: UserRole.ADMIN_BALAI, 
      isActive: true,
      balaiId: 'balai-001'
    },
    {
      id: 'user-admin-balai-j1',
      username: 'admin.bws.j1',
      email: 'admin.bws.j1@pu.go.id',
      name: 'Admin BWS Jawa I',
      password: hashedPassword,
      role: UserRole.ADMIN_BALAI,
      isActive: true,
      balaiId: 'balai-003'
    },

    // Kepala Balai (KABALAI)
    {
      id: 'user-kabalai-s1',
      username: 'kabalai.bws.s1', 
      email: 'kabalai.bws.s1@pu.go.id',
      name: 'Kepala BWS Sumatera I',
      password: hashedPassword,
      role: UserRole.KABALAI,
      isActive: true,
      balaiId: 'balai-001'
    },
    {
      id: 'user-kabalai-j1',
      username: 'kabalai.bws.j1',
      email: 'kabalai.bws.j1@pu.go.id', 
      name: 'Kepala BWS Jawa I',
      password: hashedPassword,
      role: UserRole.KABALAI,
      isActive: true,
      balaiId: 'balai-003'
    },

    // SATKER Users
    {
      id: 'user-satker-psda-s1',
      username: 'satker.psda.s1',
      email: 'satker.psda.s1@pu.go.id',
      name: 'SATKER Pembangunan SDA Sumatera I', 
      password: hashedPassword,
      role: UserRole.SATKER,
      isActive: true,
      departmentId: 'dept-001'
    },
    {
      id: 'user-satker-op-s1',
      username: 'satker.op.s1',
      email: 'satker.op.s1@pu.go.id',
      name: 'SATKER OP SDA Sumatera I',
      password: hashedPassword,
      role: UserRole.SATKER,
      isActive: true,
      departmentId: 'dept-002'
    },
    {
      id: 'user-satker-psda-j1',
      username: 'satker.psda.j1',
      email: 'satker.psda.j1@pu.go.id',
      name: 'SATKER Pembangunan SDA Jawa I',
      password: hashedPassword,
      role: UserRole.SATKER, 
      isActive: true,
      departmentId: 'dept-005'
    },

    // PPK Users (Project Commitment Officers) 
    {
      id: 'user-ppk-001',
      username: 'ppk.001',
      email: 'ppk.001@contractor.com',
      name: 'PPK Ahmad Sutanto',
      password: hashedPassword,
      role: UserRole.PPK,
      isActive: true,
      deviceInfo: {
        platform: 'android',
        allowMobileAccess: true
      }
    },
    {
      id: 'user-ppk-002', 
      username: 'ppk.002',
      email: 'ppk.002@contractor.com',
      name: 'PPK Siti Aminah',
      password: hashedPassword,
      role: UserRole.PPK,
      isActive: true,
      deviceInfo: {
        platform: 'ios', 
        allowMobileAccess: true
      }
    },
    {
      id: 'user-ppk-003',
      username: 'ppk.003',
      email: 'ppk.003@contractor.com',
      name: 'PPK Budi Santoso',
      password: hashedPassword,
      role: UserRole.PPK,
      isActive: true,
      deviceInfo: {
        platform: 'android',
        allowMobileAccess: true
      }
    },

    // VENDOR Users (Contractors)
    {
      id: 'user-vendor-001',
      username: 'vendor.001',
      email: 'vendor.001@contractor.com', 
      name: 'PT. Karya Mandiri - Supervisor',
      password: hashedPassword,
      role: UserRole.VENDOR,
      isActive: true,
      deviceInfo: {
        platform: 'android',
        allowMobileAccess: true
      }
    },
    {
      id: 'user-vendor-002',
      username: 'vendor.002',
      email: 'vendor.002@contractor.com',
      name: 'CV. Sejahtera Jaya - Supervisor',
      password: hashedPassword,
      role: UserRole.VENDOR,
      isActive: true,
      deviceInfo: {
        platform: 'android',
        allowMobileAccess: true
      }
    },
    {
      id: 'user-vendor-003',
      username: 'vendor.003', 
      email: 'vendor.003@contractor.com',
      name: 'PT. Bangun Nusantara - Supervisor',
      password: hashedPassword,
      role: UserRole.VENDOR,
      isActive: true,
      deviceInfo: {
        platform: 'ios',
        allowMobileAccess: true
      }
    }
  ]

  for (const user of userData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    })
    console.log(`✅ Created/Updated User: ${user.name} (${user.role})`)
  }
}

async function main() {
  try {
    await seedOrganizationalData()
    await seedUserRoles()
    console.log('🎉 Enhanced auth seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

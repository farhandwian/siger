import { PrismaClient, ProjectAssignmentRole } from '@prisma/client'

const prisma = new PrismaClient()

async function seedProjectAssignments() {
  console.log('🔗 Seeding project assignments...')

  // First, let's create some sample projects in departments
  const sampleProjects = [
    {
      id: 'project-001',
      pekerjaan: 'Pembangunan Bendung Sungai Musi',
      lokasiProyek: 'Kabupaten Musi Banyuasin, Sumatera Selatan',
      departmentId: 'dept-001', // SATKER Pembangunan SDA Sumatera I
      nomorKontrak: 'SPK-001/2024',
      nilaiKontrak: '15000000000',
      penyediaJasa: 'PT. Karya Mandiri',
      fisikTarget: 100,
      fisikProgress: 45.5,
      keuanganTarget: 15000000000,
      keuanganProgress: 6750000000
    },
    {
      id: 'project-002', 
      pekerjaan: 'Rehabilitasi Irigasi Daerah Lampung Tengah',
      lokasiProyek: 'Lampung Tengah, Lampung',
      departmentId: 'dept-002', // SATKER OP SDA Sumatera I
      nomorKontrak: 'SPK-002/2024',
      nilaiKontrak: '8500000000',
      penyediaJasa: 'CV. Sejahtera Jaya',
      fisikTarget: 100,
      fisikProgress: 78.2,
      keuanganTarget: 8500000000,
      keuanganProgress: 6645000000
    },
    {
      id: 'project-003',
      pekerjaan: 'Normalisasi Sungai Ciliwung Segmen 3',
      lokasiProyek: 'Jakarta Selatan, DKI Jakarta', 
      departmentId: 'dept-005', // SATKER Pembangunan SDA Jawa I
      nomorKontrak: 'SPK-003/2024',
      nilaiKontrak: '25000000000',
      penyediaJasa: 'PT. Bangun Nusantara',
      fisikTarget: 100,
      fisikProgress: 23.7,
      keuanganTarget: 25000000000,
      keuanganProgress: 5925000000
    },
    {
      id: 'project-004',
      pekerjaan: 'Pemeliharaan Bendung Katulampa',
      lokasiProyek: 'Bogor, Jawa Barat',
      departmentId: 'dept-006', // SATKER OP SDA Jawa I  
      nomorKontrak: 'SPK-004/2024',
      nilaiKontrak: '3200000000',
      penyediaJasa: 'PT. Karya Mandiri',
      fisikTarget: 100,
      fisikProgress: 92.1,
      keuanganTarget: 3200000000,
      keuanganProgress: 2947200000
    }
  ]

  // Create projects
  for (const project of sampleProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: project,
      create: project
    })
    console.log(`✅ Created/Updated Project: ${project.pekerjaan}`)
  }

  // Create project assignments for PPK and VENDOR users
  const assignments = [
    // PPK Ahmad Sutanto assigned to Project 1 and 4
    {
      userId: 'user-ppk-001',
      projectId: 'project-001',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-psda-s1',
      notes: 'PPK untuk proyek pembangunan bendung'
    },
    {
      userId: 'user-ppk-001', 
      projectId: 'project-004',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-op-j1',
      notes: 'PPK untuk proyek pemeliharaan bendung'
    },

    // PPK Siti Aminah assigned to Project 2
    {
      userId: 'user-ppk-002',
      projectId: 'project-002',
      role: ProjectAssignmentRole.PPK, 
      assignedBy: 'user-satker-op-s1',
      notes: 'PPK untuk proyek rehabilitasi irigasi'
    },

    // PPK Budi Santoso assigned to Project 3
    {
      userId: 'user-ppk-003',
      projectId: 'project-003',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-psda-j1', 
      notes: 'PPK untuk proyek normalisasi sungai'
    },

    // VENDOR assignments
    // PT. Karya Mandiri (vendor-001) working on Project 1 and 4
    {
      userId: 'user-vendor-001',
      projectId: 'project-001',
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-001',
      notes: 'Vendor untuk pembangunan bendung'
    },
    {
      userId: 'user-vendor-001',
      projectId: 'project-004', 
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-001',
      notes: 'Vendor untuk pemeliharaan bendung'
    },

    // CV. Sejahtera Jaya (vendor-002) working on Project 2
    {
      userId: 'user-vendor-002',
      projectId: 'project-002',
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-002',
      notes: 'Vendor untuk rehabilitasi irigasi'
    },

    // PT. Bangun Nusantara (vendor-003) working on Project 3
    {
      userId: 'user-vendor-003',
      projectId: 'project-003', 
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-003',
      notes: 'Vendor untuk normalisasi sungai'
    }
  ]

  // Create assignments
  for (const assignment of assignments) {
    await prisma.projectAssignment.upsert({
      where: {
        userId_projectId_role: {
          userId: assignment.userId,
          projectId: assignment.projectId,
          role: assignment.role
        }
      },
      update: assignment,
      create: assignment
    })
    console.log(`✅ Created/Updated Assignment: ${assignment.role} for project ${assignment.projectId}`)
  }
}

async function main() {
  try {
    await seedProjectAssignments()
    console.log('🎉 Project assignments seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during project assignments seeding:', error)
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

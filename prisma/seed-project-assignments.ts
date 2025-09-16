import { PrismaClient, ProjectAssignmentRole } from '@prisma/client'

const prisma = new PrismaClient()

async function seedProjectAssignments() {
  console.log('🔗 Seeding project assignments...')

  // First, let's create some sample projects in satkers
  const sampleProjects = [
    {
      id: '1',
      // Informasi Umum Proyek
      penyediaJasa: 'PT. Loeh Raya Perkasa',
      pekerjaan:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      jenisPaket: 'Fisik',
      jenisPengadaan: 'Kontraktual',

      // Informasi Kontrak & Anggaran
      paguAnggaran: 'Rp19.257.871.000',
      nilaiKontrak: 'Rp17.008.513.435',
      nomorKontrak: '01/HK0201/Aw9.2/V/2025',
      spmk: '01/SPMK/Aw9.2/V/2025',
      masaKontrak: '120 Hari Kalender',
      numberOfWeeks: 18,
      tanggalKontrak: '2025-05-22',
      tanggalSpmk: '2025-05-23',
      akhirKontrak: '2025-09-19',
      pembayaranTerakhir: '-',

      // Progress data
      fisikProgress: 68,
      fisikDeviasi: 2.06,
      fisikTarget: 100,

      saluranProgress: 69020,
      saluranDeviasi: 1452,
      saluranTarget: 100000,

      bangunanProgress: 29,
      bangunanDeviasi: 58,
      bangunanTarget: 100,

      keuanganProgress: 0,
      keuanganDeviasi: 0,
      keuanganTarget: 0,

      // Realisasi data
      outputData: [
        { label: 'Normalisasi', value: '81.398 m2' },
        { label: 'Rehab Saluran', value: '-' },
        { label: 'Rehab Pintu', value: '2' },
        { label: 'Rehab Bangunan', value: '3' },
      ],
      tenagaKerjaData: [
        { label: 'Mandor', value: '20' },
        { label: 'Tukang', value: '123' },
        { label: 'Pekerja', value: '134' },
      ],
      alatData: [
        { label: 'Excavator STD', value: '5' },
        { label: 'Excavator LA', value: '2' },
        { label: 'Excavator Mini', value: '4' },
        { label: 'Excavator Amphibi', value: '3' },
      ],
      materialData: [
        { label: 'Semen', value: '28405' },
        { label: 'Pasir', value: '78280' },
        { label: 'Agregat', value: '89775' },
        { label: 'Pintu', value: '81' },
        { label: 'U-ditch', value: '-' },
      ],
    },

    {
      id: '2',
      // Informasi Umum Proyek
      penyediaJasa: 'PT. Bangun Karya Lampung',
      pekerjaan:
        'Rehabilitasi Jaringan Utama D.I Kewenangan Daerah di Provinsi Lampung (Paket I)',
      jenisPaket: 'Fisik',
      jenisPengadaan: 'Kontraktual',

      // Informasi Kontrak & Anggaran
      paguAnggaran: 'Rp19.211.000.000',
      nilaiKontrak: 'Rp16.800.000.000',
      nomorKontrak: '02/HK0201/Aw9.2/V/2025',
      spmk: '02/SPMK/Aw9.2/V/2025',
      masaKontrak: '150 Hari Kalender',
      numberOfWeeks: 22,
      tanggalKontrak: '2025-05-24',
      tanggalSpmk: '2025-05-25',
      akhirKontrak: '2025-10-21',
      pembayaranTerakhir: 'Rp8.400.000.000',

      // Progress data
      fisikProgress: 80,
      fisikDeviasi: 0.08,
      fisikTarget: 100,

      saluranProgress: 85000,
      saluranDeviasi: 500,
      saluranTarget: 120000,

      bangunanProgress: 45,
      bangunanDeviasi: 12,
      bangunanTarget: 100,

      keuanganProgress: 50,
      keuanganDeviasi: 2.5,
      keuanganTarget: 100,

      // Realisasi data
      outputData: [
        { label: 'Normalisasi', value: '95.500 m2' },
        { label: 'Rehab Saluran', value: '12 km' },
        { label: 'Rehab Pintu', value: '5' },
        { label: 'Rehab Bangunan', value: '8' },
      ],
      tenagaKerjaData: [
        { label: 'Mandor', value: '15' },
        { label: 'Tukang', value: '98' },
        { label: 'Pekerja', value: '156' },
      ],
      alatData: [
        { label: 'Excavator STD', value: '8' },
        { label: 'Excavator LA', value: '3' },
        { label: 'Excavator Mini', value: '6' },
        { label: 'Excavator Amphibi', value: '2' },
      ],
      materialData: [
        { label: 'Semen', value: '35600' },
        { label: 'Pasir', value: '89400' },
        { label: 'Agregat', value: '102350' },
        { label: 'Pintu', value: '125' },
        { label: 'U-ditch', value: '450' },
      ],
    },

    {
      id: '3',
      // Informasi Umum Proyek
      penyediaJasa: 'PT. Infrastruktur Nusantara',
      pekerjaan:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan jaringan Irigasi DIR Rawa Jitu dan Rawa Pitu di Kabupaten',
      jenisPaket: 'Fisik',
      jenisPengadaan: 'Kontraktual',

      // Informasi Kontrak & Anggaran
      paguAnggaran: 'Rp29.900.973.824',
      nilaiKontrak: 'Rp25.500.000.000',
      nomorKontrak: '03/HK0201/Aw9.2/V/2025',
      spmk: '03/SPMK/Aw9.2/V/2025',
      masaKontrak: '180 Hari Kalender',
      numberOfWeeks: 26,
      tanggalKontrak: '2025-05-27',
      akhirKontrak: '2025-11-23',
      pembayaranTerakhir: 'Rp5.100.000.000',

      // Progress data
      fisikProgress: 20,
      fisikDeviasi: 35,
      fisikTarget: 100,

      saluranProgress: 25000,
      saluranDeviasi: 8500,
      saluranTarget: 150000,

      bangunanProgress: 8,
      bangunanDeviasi: 42,
      bangunanTarget: 100,

      keuanganProgress: 20,
      keuanganDeviasi: 15,
      keuanganTarget: 100,

      // Realisasi data
      outputData: [
        { label: 'Normalisasi', value: '32.150 m2' },
        { label: 'Rehab Saluran', value: '3.2 km' },
        { label: 'Rehab Pintu', value: '1' },
        { label: 'Rehab Bangunan', value: '2' },
      ],
      tenagaKerjaData: [
        { label: 'Mandor', value: '8' },
        { label: 'Tukang', value: '45' },
        { label: 'Pekerja', value: '67' },
      ],
      alatData: [
        { label: 'Excavator STD', value: '3' },
        { label: 'Excavator LA', value: '1' },
        { label: 'Excavator Mini', value: '2' },
        { label: 'Excavator Amphibi', value: '1' },
      ],
      materialData: [
        { label: 'Semen', value: '12850' },
        { label: 'Pasir', value: '34200' },
        { label: 'Agregat', value: '45600' },
        { label: 'Pintu', value: '25' },
        { label: 'U-ditch', value: '180' },
      ],
    },

    {
      id: '4',
      // Informasi Umum Proyek
      penyediaJasa: 'PT. Pembangunan Jaya',
      pekerjaan:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan IrigasiDIR Rawa Jitu Di Kabupaten Mesuji',
      jenisPaket: 'Fisik',
      jenisPengadaan: 'Kontraktual',

      // Informasi Kontrak & Anggaran
      paguAnggaran: 'Rp28.902.316.373',
      nilaiKontrak: 'Rp24.200.000.000',
      nomorKontrak: '04/HK0201/Aw9.2/V/2025',
      spmk: '04/SPMK/Aw9.2/V/2025',
      masaKontrak: '165 Hari Kalender',
      numberOfWeeks: 52,
      tanggalKontrak: '2025-05-29',
      akhirKontrak: '2025-11-10',
      pembayaranTerakhir: 'Rp16.456.000.000',

      // Progress data
      fisikProgress: 68,
      fisikDeviasi: 2.06,
      fisikTarget: 100,

      saluranProgress: 78500,
      saluranDeviasi: 2100,
      saluranTarget: 110000,

      bangunanProgress: 72,
      bangunanDeviasi: 8,
      bangunanTarget: 100,

      keuanganProgress: 68,
      keuanganDeviasi: 3.2,
      keuanganTarget: 100,

      // Realisasi data
      outputData: [
        { label: 'Normalisasi', value: '76.250 m2' },
        { label: 'Rehab Saluran', value: '9.8 km' },
        { label: 'Rehab Pintu', value: '4' },
        { label: 'Rehab Bangunan', value: '6' },
      ],
      tenagaKerjaData: [
        { label: 'Mandor', value: '18' },
        { label: 'Tukang', value: '89' },
        { label: 'Pekerja', value: '112' },
      ],
      alatData: [
        { label: 'Excavator STD', value: '6' },
        { label: 'Excavator LA', value: '2' },
        { label: 'Excavator Mini', value: '5' },
        { label: 'Excavator Amphibi', value: '3' },
      ],
      materialData: [
        { label: 'Semen', value: '26780' },
        { label: 'Pasir', value: '67340' },
        { label: 'Agregat', value: '78920' },
        { label: 'Pintu', value: '98' },
        { label: 'U-ditch', value: '320' },
      ],
    },
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
      projectId: '1',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-psda-s1',
      notes: 'PPK untuk proyek pembangunan bendung'
    },
    {
      userId: 'user-ppk-001', 
      projectId: '4',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-op-j1',
      notes: 'PPK untuk proyek pemeliharaan bendung'
    },

    // PPK Siti Aminah assigned to Project 2
    {
      userId: 'user-ppk-002',
      projectId: '2',
      role: ProjectAssignmentRole.PPK, 
      assignedBy: 'user-satker-op-s1',
      notes: 'PPK untuk proyek rehabilitasi irigasi'
    },

    // PPK Budi Santoso assigned to Project 3
    {
      userId: 'user-ppk-003',
      projectId: '3',
      role: ProjectAssignmentRole.PPK,
      assignedBy: 'user-satker-psda-j1', 
      notes: 'PPK untuk proyek normalisasi sungai'
    },

    // VENDOR assignments
    // PT. Karya Mandiri (vendor-001) working on Project 1 and 4
    {
      userId: 'user-vendor-001',
      projectId: '1',
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-001',
      notes: 'Vendor untuk pembangunan bendung'
    },
    {
      userId: 'user-vendor-001',
      projectId: '4', 
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-001',
      notes: 'Vendor untuk pemeliharaan bendung'
    },

    // CV. Sejahtera Jaya (vendor-002) working on Project 2
    {
      userId: 'user-vendor-002',
      projectId: '2',
      role: ProjectAssignmentRole.VENDOR,
      assignedBy: 'user-ppk-002',
      notes: 'Vendor untuk rehabilitasi irigasi'
    },

    // PT. Bangun Nusantara (vendor-003) working on Project 3
    {
      userId: 'user-vendor-003',
      projectId: '3', 
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

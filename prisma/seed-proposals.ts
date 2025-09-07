import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedActivityProposals() {
  console.log('Seeding activity proposals...')

  // Create sample activity proposals
  const proposals = await Promise.all([
    prisma.activityProposal.create({
      data: {
        tahun: '2025',
        prioritas: '1',
        kategoriKegiatan: 'Fisik',
        jenisDaerahIrigasi: 'Teknis',
        daerahIrigasi: 'DI Sekampung',
        outcome: 500,
        kebutuhanAnggaran: 15000000000,
        anggaranPerHektar: 30000000,
        ipExisting: 75,
        ipRencana: 100,
        status: 'Draft',
        readinessLevel: '80%',
        lingkupUsulan: {
          create: [
            {
              namaLingkupUsulan: 'Saluran Sekunder - 1 KM',
              nomenkaltur: 'Saluran Sekunder 1',
              perimeter: 2000,
              area: 125,
            },
            {
              namaLingkupUsulan: 'Bangunan Sadap - 2 Unit',
              nomenkaltur: 'BS-01, BS-02',
              perimeter: 80,
              area: 16,
            },
          ],
        },
        readinessCriteria: {
          create: [
            {
              dokumenType: 'SID / DED / As Built Drawing',
              keterangan: 'SID / DED/ As Built Drawing (Laporan Akhir dan Gambar Desain)',
              fileName: 'sid_ded_sekampung.pdf',
              filePath: '/uploads/documents/sid_ded_sekampung.pdf',
              fileSize: 2048576,
              uploadedAt: new Date(),
            },
            {
              dokumenType: 'Dokumen lingkungan (AMDAL/UKL-UPL/SPPL)',
              keterangan: 'AMDAL untuk rehabilitasi saluran sekunder',
              fileName: 'amdal_sekampung.pdf',
              filePath: '/uploads/documents/amdal_sekampung.pdf',
              fileSize: 1536000,
              uploadedAt: new Date(),
            },
            {
              dokumenType: 'Data sumber air yang masuk formulir usulan kegiatan',
              keterangan: 'Data sumber air yang masuk formulir usulan kegiatan',
              fileName: 'data_sumber_air.pdf',
              filePath: '/uploads/documents/data_sumber_air.pdf',
              fileSize: 512000,
              uploadedAt: new Date(),
            },
          ],
        },
      },
    }),
    prisma.activityProposal.create({
      data: {
        tahun: '2025',
        prioritas: '2',
        kategoriKegiatan: 'Rehabilitasi',
        jenisDaerahIrigasi: 'Semi Teknis',
        daerahIrigasi: 'DI Mesuji',
        outcome: 300,
        kebutuhanAnggaran: 8500000000,
        anggaranPerHektar: 28000000,
        ipExisting: 60,
        ipRencana: 85,
        status: 'Draft',
        readinessLevel: '65%',
        lingkupUsulan: {
          create: [
            {
              namaLingkupUsulan: 'Saluran Primer - 0.5 KM',
              nomenkaltur: 'Saluran Primer Mesuji',
              perimeter: 1200,
              area: 75,
            },
          ],
        },
        readinessCriteria: {
          create: [
            {
              dokumenType: 'KAK',
              keterangan: 'Kerangka Acuan Kerja rehabilitasi',
            },
            {
              dokumenType: 'RAB/Back Up Volume, Harga Satuan, SMKK, AHSP',
              keterangan: 'RAB untuk rehabilitasi saluran primer',
            },
          ],
        },
      },
    }),
    prisma.activityProposal.create({
      data: {
        tahun: '2025',
        prioritas: '3',
        kategoriKegiatan: 'Peningkatan',
        jenisDaerahIrigasi: 'Teknis',
        daerahIrigasi: 'DI Way Jepara',
        outcome: 750,
        kebutuhanAnggaran: 22000000000,
        anggaranPerHektar: 29000000,
        ipExisting: 80,
        ipRencana: 100,
        status: 'Submitted',
        readinessLevel: '90%',
        submittedAt: new Date(),
        submittedBy: 'BBWS Mesuji Sekampung',
        lingkupUsulan: {
          create: [
            {
              namaLingkupUsulan: 'Jaringan Irigasi Tersier - 2 KM',
              nomenkaltur: 'JIT-01, JIT-02',
              perimeter: 4500,
              area: 280,
            },
            {
              namaLingkupUsulan: 'Bangunan Pengatur - 5 Unit',
              nomenkaltur: 'BP-01 s/d BP-05',
              perimeter: 150,
              area: 30,
            },
          ],
        },
        readinessCriteria: {
          create: [
            {
              dokumenType: 'SID / DED / As Built Drawing',
              keterangan: 'SID / DED/ As Built Drawing (Laporan Akhir dan Gambar Desain)',
              fileName: 'sid_way_jepara.pdf',
              filePath: '/uploads/documents/sid_way_jepara.pdf',
              fileSize: 3072000,
              uploadedAt: new Date(),
            },
            {
              dokumenType: 'Dokumen lingkungan (AMDAL/UKL-UPL/SPPL)',
              keterangan: 'UKL-UPL untuk peningkatan jaringan irigasi',
              fileName: 'ukl_upl_way_jepara.pdf',
              filePath: '/uploads/documents/ukl_upl_way_jepara.pdf',
              fileSize: 1024000,
              uploadedAt: new Date(),
            },
            {
              dokumenType: 'Gambar Area Kerja dan Akses Jalan',
              keterangan: 'Gambar Area Kerja dan Akses Jalan',
              fileName: 'gambar_area_kerja.pdf',
              filePath: '/uploads/documents/gambar_area_kerja.pdf',
              fileSize: 2560000,
              uploadedAt: new Date(),
            },
          ],
        },
      },
    }),
  ])

  console.log(`Created ${proposals.length} activity proposals`)
  return proposals
}

async function main() {
  try {
    await seedActivityProposals()
    console.log('Seeding completed successfully')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

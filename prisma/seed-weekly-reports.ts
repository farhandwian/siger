import { PrismaClient, ReportStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed data for weekly reports with detailed activities
 * Creates sample weekly reports with complete table data for Excel export testing
 */
export async function seedWeeklyReports() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding weekly reports with detailed activities...')

  try {
    // Get the first project
    const project = await prisma.project.findFirst({
      select: {
        id: true,
        pekerjaan: true,
      },
    })

    if (!project) {
      // eslint-disable-next-line no-console
      console.log('⚠️ No projects found. Please seed projects first.')
      return
    }

    // Create a detailed weekly report for testing Excel export
    const weeklyReport = await prisma.weeklyReport.create({
      data: {
        projectId: project.id,
        weekNumber: 2,
        startDate: new Date('2025-08-14'),
        endDate: new Date('2025-08-20'),
        status: ReportStatus.PUBLISHED,
        satker: 'Dinas PU Kabupaten Lampung Tengah',
        kegiatan: 'Irigasi dan Rawa II',
        proyekPekerjaan:
          'Rehabilitasi/Peningkatan Jaringan Irigasi DIDIRI di Kabupaten Lampung Tengah dan Kabupaten Lampung Timur',
      },
    })

    // Create main activities and their sub-activities based on the sample structure
    const activities = [
      // Main Activity 1 - PEKERJAAN PERSIAPAN
      {
        weeklyReportId: weeklyReport.id,
        no: 1,
        name: 'PEKERJAAN PERSIAPAN',
        sat: '',
        volume: 0,
        weight: 0,
        displayOrder: 1,
      },
      // Sub-activities for Activity 1
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Mobilisasi dan demobilisasi',
        sat: 'Ls',
        volume: 1.0,
        weight: 1.174,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 0.59,
        realisasiMingguIni: 0.5,
        status: 'TIDAK_TERCAPAI' as const,
        kumulatifMingguIni_volume: 0.5,
        kumulatifMingguIni_weight: 0.59,
        persentaseItemPekerjaan: 50.0,
        persentaseGrafikProgress: 84.7,
        persentaseRencanaKumulatif: 50.0,
        statusKumulatif: 'Tercapai',
        persentaseSeluruhPekerjaan: 0.3,
        displayOrder: 2,
      },
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Stake out Trasa Saluran',
        sat: "m'",
        volume: 84797,
        weight: 1.55,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 0,
        realisasiMingguIni: 84587.58,
        status: 'TERCAPAI' as const,
        kumulatifMingguIni_volume: 84587.58,
        kumulatifMingguIni_weight: 1.55,
        persentaseItemPekerjaan: 99.8,
        persentaseGrafikProgress: 100.0,
        persentaseRencanaKumulatif: 99.8,
        statusKumulatif: 'Tercapai',
        persentaseSeluruhPekerjaan: 0.8,
        displayOrder: 3,
      },
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Pasangan Patok',
        sat: 'Bh',
        volume: 3.07,
        weight: 0.068,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 0,
        realisasiMingguIni: 1.455,
        status: 'TERCAPAI' as const,
        kumulatifMingguIni_volume: 1.455,
        kumulatifMingguIni_weight: 0.07,
        persentaseItemPekerjaan: 47.4,
        persentaseGrafikProgress: 100.0,
        persentaseRencanaKumulatif: 100.0,
        statusKumulatif: 'Tercapai',
        persentaseSeluruhPekerjaan: 0.03,
        displayOrder: 4,
      },
      // Main Activity 2 - SISTEM MANAJEMEN KESELAMATAN KERJA
      {
        weeklyReportId: weeklyReport.id,
        no: 2,
        name: 'SISTEM MANAJEMEN KESELAMATAN KERJA',
        sat: '',
        volume: 0,
        weight: 0,
        displayOrder: 5,
      },
      // Sub-activity for Activity 2
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Sistem Manajemen Keselamatan Kerja',
        sat: 'Ls',
        volume: 1.0,
        weight: 1.174,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 0.01,
        realisasiMingguIni: 1.01,
        status: 'TERCAPAI' as const,
        kumulatifMingguIni_volume: 1.01,
        kumulatifMingguIni_weight: 1.174,
        persentaseItemPekerjaan: 100.0,
        persentaseGrafikProgress: 100.0,
        persentaseRencanaKumulatif: 100.0,
        statusKumulatif: 'Tercapai',
        persentaseSeluruhPekerjaan: 0.6,
        displayOrder: 6,
      },
      // Main Activity 3 - PEKERJAAN NORMALISASI SALURAN
      {
        weeklyReportId: weeklyReport.id,
        no: 3,
        name: 'PEKERJAAN NORMALISASI SALURAN',
        sat: '',
        volume: 0,
        weight: 0,
        displayOrder: 7,
      },
      // Sub-activities for Activity 3
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Galian Tanah Manual',
        sat: 'm³',
        volume: 125436.5,
        weight: 22.876,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 12543.65,
        realisasiMingguIni: 8562.4,
        status: 'TIDAK_TERCAPAI' as const,
        kumulatifMingguIni_volume: 8562.4,
        kumulatifMingguIni_weight: 1.56,
        persentaseItemPekerjaan: 6.8,
        persentaseGrafikProgress: 68.3,
        persentaseRencanaKumulatif: 10.0,
        statusKumulatif: 'Tidak Tercapai',
        persentaseSeluruhPekerjaan: 0.8,
        displayOrder: 8,
      },
      {
        weeklyReportId: weeklyReport.id,
        no: 0,
        name: 'Galian Tanah Mekanis',
        sat: 'm³',
        volume: 89765.2,
        weight: 16.432,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_weight: 0,
        targetMingguIni: 8976.52,
        realisasiMingguIni: 12543.8,
        status: 'TERCAPAI' as const,
        kumulatifMingguIni_volume: 12543.8,
        kumulatifMingguIni_weight: 2.29,
        persentaseItemPekerjaan: 14.0,
        persentaseGrafikProgress: 139.7,
        persentaseRencanaKumulatif: 10.0,
        statusKumulatif: 'Tercapai',
        persentaseSeluruhPekerjaan: 1.2,
        displayOrder: 9,
      },
      // Additional Activity 4 - PEKERJAAN STRUKTUR
      {
        weeklyReportId: weeklyReport.id,
        name: 'PEKERJAAN STRUKTUR',
        activityType: 'MAIN_ACTIVITY' as const,
        sat: '',
        volume: 0,
        bobot: 0,
        displayOrder: 10,
      },
      // Sub-activities for Activity 4
      {
        weeklyReportId: weeklyReport.id,
        name: 'Pasangan Batu Kali',
        activityType: 'SUB_ACTIVITY' as const,
        sat: 'm³',
        volume: 2850.5,
        bobot: 15.24,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_bobot: 0,
        targetMingguIni: 285.05,
        realisasiMingguIni: 142.5,
        status: 'TIDAK_TERCAPAI' as const,
        kumulatifMingguIni_volume: 142.5,
        kumulatifMingguIni_bobot: 0.76,
        persentaseItemPekerjaan: 5.0,
        persentaseGrafikProgress: 50.0,
        persentaseRencanaKumulatif: 10.0,
        statusKumulatif: 'Tidak Tercapai',
        persentaseSeluruhPekerjaan: 0.4,
        displayOrder: 11,
      },
      {
        weeklyReportId: weeklyReport.id,
        name: 'Plesteran dan Acian',
        activityType: 'SUB_ACTIVITY' as const,
        sat: 'm²',
        volume: 5420.8,
        bobot: 8.65,
        realisasiMinggulalu_volume: 0,
        realisasiMinggulalu_bobot: 0,
        targetMingguIni: 0,
        realisasiMingguIni: 0,
        status: null, // Will use as 'Belum Dimulai' string for statusKumulatif
        kumulatifMingguIni_volume: 0,
        kumulatifMingguIni_bobot: 0,
        persentaseItemPekerjaan: 0,
        persentaseGrafikProgress: 0,
        persentaseRencanaKumulatif: 0,
        statusKumulatif: 'Belum Dimulai',
        persentaseSeluruhPekerjaan: 0,
        displayOrder: 12,
      },
    ]

    // Create main activities first
    const mainActivity1 = await prisma.weeklyReportActivity.create({
      data: activities[0],
    })

    const mainActivity2 = await prisma.weeklyReportActivity.create({
      data: activities[4],
    })

    const mainActivity3 = await prisma.weeklyReportActivity.create({
      data: activities[6],
    })

    const mainActivity4 = await prisma.weeklyReportActivity.create({
      data: activities[9],
    })

    // Create sub-activities with parent references
    await Promise.all([
      // Sub-activities for Activity 1
      prisma.weeklyReportActivity.create({
        data: { ...activities[1], parentActivityId: mainActivity1.id },
      }),
      prisma.weeklyReportActivity.create({
        data: { ...activities[2], parentActivityId: mainActivity1.id },
      }),
      prisma.weeklyReportActivity.create({
        data: { ...activities[3], parentActivityId: mainActivity1.id },
      }),
      // Sub-activity for Activity 2
      prisma.weeklyReportActivity.create({
        data: { ...activities[5], parentActivityId: mainActivity2.id },
      }),
      // Sub-activities for Activity 3
      prisma.weeklyReportActivity.create({
        data: { ...activities[7], parentActivityId: mainActivity3.id },
      }),
      prisma.weeklyReportActivity.create({
        data: { ...activities[8], parentActivityId: mainActivity3.id },
      }),
      // Sub-activities for Activity 4
      prisma.weeklyReportActivity.create({
        data: { ...activities[10], parentActivityId: mainActivity4.id },
      }),
      prisma.weeklyReportActivity.create({
        data: { ...activities[11], parentActivityId: mainActivity4.id },
      }),
    ])

    // eslint-disable-next-line no-console
    console.log(`✅ Created detailed weekly report: ${weeklyReport.id}`)
    // eslint-disable-next-line no-console
    console.log('📊 You can now test the Excel export functionality!')

    // Also create basic weekly reports for other projects if needed
    const otherProjects = await prisma.project.findMany({
      where: {
        id: { not: project.id },
      },
      take: 4,
      select: {
        id: true,
        pekerjaan: true,
      },
    })

    const basicReports = []
    for (const proj of otherProjects) {
      for (let week = 1; week <= 4; week++) {
        const startDate = new Date('2025-08-10')
        startDate.setDate(startDate.getDate() + (week - 1) * 7)

        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)

        basicReports.push({
          projectId: proj.id,
          weekNumber: week,
          startDate,
          endDate,
          status: week <= 3 ? ReportStatus.PUBLISHED : ReportStatus.DRAFT,
          satker: 'Dinas PU Sample',
          kegiatan: 'Sample Kegiatan',
          proyekPekerjaan: proj.pekerjaan,
        })
      }
    }

    if (basicReports.length > 0) {
      const created = await prisma.weeklyReport.createMany({
        data: basicReports,
        skipDuplicates: true,
      })
      // eslint-disable-next-line no-console
      console.log(`✅ Created ${created.count} additional basic weekly reports`)
    }

    return { weeklyReportId: weeklyReport.id }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error seeding weekly reports:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

// Check if this script was called directly
if (process.argv[1] === __filename) {
  seedWeeklyReports()
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

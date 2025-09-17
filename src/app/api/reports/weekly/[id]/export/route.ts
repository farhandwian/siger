import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

/**
 * GET /api/reports/weekly/[id]/export
 *
 * Flow Point 5: Export weekly report to Excel format
 * - Fetch the weekly report with all activities
 * - Format data to match the table structure
 * - Generate Excel file with proper formatting
 * - Return downloadable Excel file
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id

    // Fetch the weekly report with all activities
    const weeklyReport = await prisma.weeklyReport.findUnique({
      where: { id: reportId },
      include: {
        activities: {
          include: {
            parentActivity: true,
            subActivities: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        project: {
          include: {
            satker: true,
          },
        },
      },
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { success: false, error: 'Weekly report not found' },
        { status: 404 }
      )
    }

    // Prepare Excel data structure matching the table
    const excelData: any[] = []

    // Add report header information
    excelData.push(['Laporan Mingguan'])
    excelData.push([])
    excelData.push(['SATKER', ':', weeklyReport.satker || ''])
    excelData.push(['KEGIATAN', ':', weeklyReport.kegiatan || ''])
    excelData.push(['PROYEK PEKERJAAN', ':', weeklyReport.proyekPekerjaan || ''])
    excelData.push([
      'MINGGU KE',
      ':',
      `${weeklyReport.weekNumber} (${convertNumberToWords(weeklyReport.weekNumber)})`,
    ])
    excelData.push([
      'PERIODE',
      ':',
      `${formatDate(weeklyReport.startDate)} - ${formatDate(weeklyReport.endDate)}`,
    ])
    excelData.push([])

    // Add table headers
    excelData.push([
      'NO',
      'URAIAN',
      'SAT',
      'VOLUME',
      'BOBOT (%)',
      'REALISASI s/d MINGGU LALU',
      'TARGET MINGGU INI',
      'REALISASI MINGGU INI',
      'STATUS',
      'KUMULATIF s/d MINGGU INI',
      'REALISASI s/d MINGGU LALU',
      'ITEM PEKERJAAN',
      'GRAFIK PEMENUHAN PROGRESS (%)',
      'RENCANA KOMULATIF PEKERJAAN',
      'STATUS KOMULATIF',
      'SELURUH PEKERJAAN',
    ])

    // Add sub-header for progress columns
    excelData.push([
      '',
      '',
      '',
      '',
      '',
      '(KEMAJUAN PEKERJAAN)',
      '',
      '',
      '',
      '',
      '(% TERHADAP)',
      '',
      '',
      '',
      '',
      '',
    ])

    // Process activities and sub-activities
    const mainActivities = weeklyReport.activities.filter(a => !a.parentActivityId)

    mainActivities.forEach((mainActivity, index) => {
      // Add main activity row
      excelData.push([
        convertToRoman(index + 1),
        mainActivity.name,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ])

      // Add sub-activities
      const subActivities = weeklyReport.activities.filter(
        a => a.parentActivityId === mainActivity.id
      )

      subActivities.forEach((subActivity, subIndex) => {
        // First row of sub-activity (KEMAJUAN PEKERJAAN data)
        excelData.push([
          subIndex + 1,
          subActivity.name,
          subActivity.sat || '',
          subActivity.volume || '',
          subActivity.bobot || '',
          subActivity.realisasiMinggulalu_volume || '',
          subActivity.targetMingguIni || '',
          subActivity.realisasiMingguIni || '',
          subActivity.status || '',
          subActivity.kumulatifMingguIni_volume || '',
          subActivity.realisasiMinggulalu_bobot || '',
          `${subActivity.persentaseItemPekerjaan || 0}%`,
          `${subActivity.persentaseGrafikProgress || 0}%`,
          `${subActivity.persentaseRencanaKumulatif || 0}%`,
          subActivity.statusKumulatif || '',
          `${subActivity.persentaseSeluruhPekerjaan || 0}%`,
        ])

        // Second row of sub-activity (% TERHADAP data)
        excelData.push([
          '', // NO (merged)
          '', // URAIAN (merged)
          '', // SAT (merged)
          '', // VOLUME (merged)
          '', // BOBOT (merged)
          '', // Empty for KEMAJUAN section
          '',
          '',
          '',
          '',
          subActivity.kumulatifMingguIni_bobot || '', // % TERHADAP data
          `${subActivity.persentaseItemPekerjaan || 0}%`,
          `${subActivity.persentaseGrafikProgress || 0}%`,
          `${subActivity.persentaseRencanaKumulatif || 0}%`,
          subActivity.statusKumulatif || '',
          `${subActivity.persentaseSeluruhPekerjaan || 0}%`,
        ])
      })
    })

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // NO
      { wch: 30 }, // URAIAN
      { wch: 8 }, // SAT
      { wch: 12 }, // VOLUME
      { wch: 10 }, // BOBOT
      { wch: 15 }, // REALISASI s/d MINGGU LALU
      { wch: 15 }, // TARGET MINGGU INI
      { wch: 15 }, // REALISASI MINGGU INI
      { wch: 12 }, // STATUS
      { wch: 15 }, // KUMULATIF s/d MINGGU INI
      { wch: 15 }, // REALISASI s/d MINGGU LALU (%)
      { wch: 12 }, // ITEM PEKERJAAN
      { wch: 15 }, // GRAFIK PEMENUHAN PROGRESS
      { wch: 15 }, // RENCANA KOMULATIF PEKERJAAN
      { wch: 12 }, // STATUS KOMULATIF
      { wch: 12 }, // SELURUH PEKERJAAN
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Mingguan')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename
    const filename =
      `Laporan_Mingguan_Week_${weeklyReport.weekNumber}_${weeklyReport.project.pekerjaan || 'Project'}.xlsx`
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export weekly report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to convert numbers to Roman numerals
 */
function convertToRoman(num: number): string {
  const romanNumerals = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ] as const

  let result = ''
  let n = num

  for (const [roman, value] of romanNumerals) {
    while (n >= value) {
      result += roman
      n -= value
    }
  }

  return result
}

/**
 * Helper function to convert numbers to Indonesian words
 */
function convertNumberToWords(num: number): string {
  const words = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
  ]

  if (num <= 10) {
    return words[num] || num.toString()
  }

  return num.toString()
}

/**
 * Helper function to format dates
 */
function formatDate(date: Date): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

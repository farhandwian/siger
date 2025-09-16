import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

/**
 * Export Weekly Report as Excel File
 * GET /api/weekly-reports/[id]/export
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch weekly report with activities
    const weeklyReport = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            pekerjaan: true,
            spmk: true,
            tanggalSpmk: true,
            satker: {
              select: {
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: [
            { displayOrder: 'asc' },
            { no: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })

    if (!weeklyReport) {
      return NextResponse.json(
        { success: false, error: 'Weekly report not found' },
        { status: 404 }
      )
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Mingguan')

    // Set column widths
    worksheet.columns = [
      { key: 'no', width: 5 },           // NO
      { key: 'uraian', width: 40 },     // URAIAN
      { key: 'sat', width: 8 },         // SAT
      { key: 'volume', width: 12 },     // VOLUME
      { key: 'bobot', width: 10 },      // BOBOT
      { key: 'realisasiLalu', width: 12 },      // REALISASI s/d MINGGU LALU
      { key: 'target', width: 12 },             // TARGET MINGGU INI
      { key: 'realisasi', width: 12 },          // REALISASI MINGGU INI
      { key: 'status', width: 15 },             // STATUS
      { key: 'kumulatif', width: 12 },          // KUMULATIF s/d MINGGU INI
      { key: 'pctRealisasiLalu', width: 12 },   // % REALISASI s/d MINGGU LALU
      { key: 'pctItem', width: 12 },            // % ITEM PEKERJAAN
      { key: 'pctGrafik', width: 12 },          // % GRAFIK PROGRESS
      { key: 'pctRencana', width: 12 },         // % RENCANA KUMULATIF
      { key: 'statusKumulatif', width: 15 },    // STATUS KUMULATIF
      { key: 'pctSeluruh', width: 12 },         // % SELURUH PEKERJAAN
    ]

    // Header information
    worksheet.mergeCells('A1:P1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'LAPORAN MINGGUAN'
    titleCell.font = { bold: true, size: 16 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B7280' } // gray-600
    }

    // Report details
    let currentRow = 3
    worksheet.getCell(`A${currentRow}`).value = 'SATKER:'
    worksheet.getCell(`B${currentRow}`).value = weeklyReport.satker || weeklyReport.project?.satker?.name || ''
    worksheet.getCell(`K${currentRow}`).value = 'MINGGU KE:'
    worksheet.getCell(`L${currentRow}`).value = `${weeklyReport.weekNumber} (${numberToWords(weeklyReport.weekNumber)})`
    
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = 'KEGIATAN:'
    worksheet.getCell(`B${currentRow}`).value = weeklyReport.kegiatan || ''
    worksheet.getCell(`K${currentRow}`).value = 'PERIODE:'
    worksheet.getCell(`L${currentRow}`).value = `${formatDate(weeklyReport.startDate)} - ${formatDate(weeklyReport.endDate)}`
    
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = 'PROYEK PEKERJAAN:'
    worksheet.getCell(`B${currentRow}`).value = weeklyReport.proyekPekerjaan || weeklyReport.project?.pekerjaan || ''

    // Add space before table headers
    currentRow += 2

    // Table headers - First row
    const headerRow1 = currentRow
    worksheet.mergeCells(`A${headerRow1}:A${headerRow1 + 1}`) // NO
    worksheet.mergeCells(`B${headerRow1}:B${headerRow1 + 1}`) // URAIAN
    worksheet.mergeCells(`C${headerRow1}:C${headerRow1 + 1}`) // SAT
    worksheet.mergeCells(`D${headerRow1}:D${headerRow1 + 1}`) // VOLUME
    worksheet.mergeCells(`E${headerRow1}:E${headerRow1 + 1}`) // BOBOT
    worksheet.mergeCells(`F${headerRow1}:J${headerRow1}`)     // KEMAJUAN PEKERJAAN
    worksheet.mergeCells(`K${headerRow1}:P${headerRow1}`)     // % TERHADAP

    const headerCells1 = ['NO', 'URAIAN', 'SAT', 'VOLUME', 'BOBOT (%)', 'KEMAJUAN PEKERJAAN', '% TERHADAP']
    const headerPositions1 = ['A', 'B', 'C', 'D', 'E', 'F', 'K']
    
    headerCells1.forEach((header, index) => {
      const cell = worksheet.getCell(`${headerPositions1[index]}${headerRow1}`)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF374151' } // gray-700
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Table headers - Second row
    const headerRow2 = headerRow1 + 1
    const subHeaders = [
      'REALISASI s/d MINGGU LALU',
      'TARGET MINGGU INI',
      'REALISASI MINGGU INI',
      'STATUS',
      'KUMULATIF s/d MINGGU INI',
      'REALISASI s/d MINGGU LALU',
      'ITEM PEKERJAAN',
      'GRAFIK PEMENUHAN PROGRESS (%)',
      'RENCANA KUMULATIF PEKERJAAN',
      'STATUS KUMULATIF',
      'SELURUH PEKERJAAN'
    ]
    const subHeaderPositions = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
    
    subHeaders.forEach((subHeader, index) => {
      const cell = worksheet.getCell(`${subHeaderPositions[index]}${headerRow2}`)
      cell.value = subHeader
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' } // gray-600
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Data rows
    currentRow = headerRow2 + 1
    
    // Group activities by parent for proper merging
    type WeeklyReportActivityType = typeof weeklyReport.activities[0]
    const mainActivities = weeklyReport.activities.filter((a: WeeklyReportActivityType) => a.no > 0)
    const subActivities = weeklyReport.activities.filter((a: WeeklyReportActivityType) => a.no === 0)
    
    // Process activities in order
    for (const mainActivity of mainActivities) {
      // Main activity row (section header)
      const mainRow = worksheet.getRow(currentRow)
      mainRow.getCell(1).value = mainActivity.no
      mainRow.getCell(2).value = mainActivity.uraian
      mainRow.getCell(3).value = ''
      mainRow.getCell(4).value = ''
      mainRow.getCell(5).value = ''
      
      // Style main activity row
      for (let col = 1; col <= 16; col++) {
        const cell = mainRow.getCell(col)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' } // gray-50
        }
        cell.font = { bold: true }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
      
      currentRow++
      
      // Sub-activities for this main activity
      const relatedSubActivities = subActivities.filter((sub: WeeklyReportActivityType) => 
        sub.parentActivityId === mainActivity.id
      )
      
      for (const subActivity of relatedSubActivities) {
        // First row of sub-activity (KEMAJUAN PEKERJAAN data)
        const subRow1 = worksheet.getRow(currentRow)
        const subRow2 = worksheet.getRow(currentRow + 1)
        
        // Merge first 5 columns across 2 rows
        worksheet.mergeCells(`A${currentRow}:A${currentRow + 1}`) // NO
        worksheet.mergeCells(`B${currentRow}:B${currentRow + 1}`) // URAIAN
        worksheet.mergeCells(`C${currentRow}:C${currentRow + 1}`) // SAT
        worksheet.mergeCells(`D${currentRow}:D${currentRow + 1}`) // VOLUME
        worksheet.mergeCells(`E${currentRow}:E${currentRow + 1}`) // BOBOT
        
        // Fill merged cells
        subRow1.getCell(1).value = 'SUB'
        subRow1.getCell(2).value = subActivity.uraian
        subRow1.getCell(3).value = subActivity.sat || ''
        subRow1.getCell(4).value = subActivity.volume || ''
        subRow1.getCell(5).value = subActivity.bobot ? subActivity.bobot.toFixed(3) : ''
        
        // First row - KEMAJUAN PEKERJAAN
        subRow1.getCell(6).value = subActivity.realisasiMinggulalu_volume || 0
        subRow1.getCell(7).value = subActivity.targetMingguIni || 0
        subRow1.getCell(8).value = subActivity.realisasiMingguIni || 0
        subRow1.getCell(9).value = subActivity.status || ''
        subRow1.getCell(10).value = subActivity.kumulatifMingguIni_volume || 0
        
        // Second row - % TERHADAP
        subRow2.getCell(6).value = subActivity.realisasiMinggulalu_bobot || 0
        subRow2.getCell(7).value = subActivity.persentaseItemPekerjaan ? `${subActivity.persentaseItemPekerjaan.toFixed(1)}%` : ''
        subRow2.getCell(8).value = subActivity.persentaseGrafikProgress ? `${subActivity.persentaseGrafikProgress.toFixed(1)}%` : ''
        subRow2.getCell(9).value = subActivity.persentaseRencanaKumulatif ? `${subActivity.persentaseRencanaKumulatif.toFixed(1)}%` : ''
        subRow2.getCell(10).value = subActivity.statusKumulatif || ''
        subRow2.getCell(11).value = subActivity.persentaseSeluruhPekerjaan ? `${subActivity.persentaseSeluruhPekerjaan.toFixed(1)}%` : ''
        
        // Style sub-activity rows
        for (let rowNum = currentRow; rowNum <= currentRow + 1; rowNum++) {
          const row = worksheet.getRow(rowNum)
          for (let col = 1; col <= 16; col++) {
            const cell = row.getCell(col)
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
            
            // Status cell coloring
            if ((col === 9 || col === 10) && cell.value) {
              const value = cell.value.toString()
              if (value.includes('Tercapai')) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFDCFCE7' } // green-100
                }
                cell.font = { color: { argb: 'FF166534' } } // green-800
              } else if (value.includes('Tidak Tercapai')) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFECACA' } // red-100
                }
                cell.font = { color: { argb: 'FF991B1B' } } // red-800
              }
            }
          }
        }
        
        currentRow += 2
      }
    }

    // Set response headers for file download
    const filename = `Laporan_Mingguan_Minggu_${weeklyReport.weekNumber}_${weeklyReport.project?.pekerjaan?.replace(/[^a-zA-Z0-9]/g, '_') || 'Project'}.xlsx`
    
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
    
  } catch (error) {
    // Log error for debugging but don't expose details to client
    return NextResponse.json(
      { success: false, error: 'Failed to export weekly report' },
      { status: 500 }
    )
  }
}

// Helper functions
function numberToWords(num: number): string {
  const words = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh']
  return words[num] || num.toString()
}

function formatDate(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}
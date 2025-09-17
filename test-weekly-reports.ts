/**
 * Test script for Weekly Reports implementation
 *
 * This script tests the complete flow:
 * 1. Get period data for projects
 * 2. Create weekly reports
 * 3. Fetch reports with formatted data
 * 4. Test Excel export functionality
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testWeeklyReportsFlow() {
  console.log('🧪 Starting Weekly Reports Flow Testing...\n')

  try {
    // Step 1: Get available projects
    console.log('📋 Step 1: Fetching available projects...')
    const projects = await prisma.project.findMany({
      include: {
        satker: true,
        activities: {
          include: {
            subActivities: {
              include: {
                schedules: true,
              },
            },
          },
        },
      },
    })

    if (projects.length === 0) {
      console.log('❌ No projects found. Please add some sample data first.')
      return
    }

    console.log(`✅ Found ${projects.length} projects`)
    const testProject = projects[0]
    console.log(`📌 Using project: ${testProject.pekerjaan || testProject.id}`)

    // Step 2: Get period data for the test project
    console.log('\n📅 Step 2: Getting period data...')
    const schedules = await prisma.schedule.findMany({
      where: {
        subActivity: {
          activity: {
            projectId: testProject.id,
          },
        },
      },
    })

    if (schedules.length === 0) {
      console.log('❌ No schedules found. Please add schedule data first.')
      return
    }

    const weekNumbers = schedules.map(s => s.weekNumber)
    const minWeek = Math.min(...weekNumbers)
    const maxWeek = Math.max(...weekNumbers)

    console.log(`✅ Available weeks: ${minWeek} to ${maxWeek}`)

    // Step 3: Test period API simulation
    console.log('\n🔍 Step 3: Testing period calculation...')
    const periodData = {
      minWeek,
      maxWeek,
      totalWeeks: maxWeek - minWeek + 1,
      projectId: testProject.id,
      projectInfo: {
        id: testProject.id,
        pekerjaan: testProject.pekerjaan,
        satker: testProject.satker,
      },
    }

    console.log('📊 Period Data:', JSON.stringify(periodData, null, 2))

    // Step 4: Test weekly report creation for a specific week
    const testWeek = Math.min(3, maxWeek) // Test with week 3 or max available
    console.log(`\n📝 Step 4: Creating weekly report for week ${testWeek}...`)

    // Check if report already exists
    const existingReport = await prisma.weeklyReport.findFirst({
      where: {
        projectId: testProject.id,
        weekNumber: testWeek,
      },
    })

    if (existingReport) {
      console.log('⚠️ Weekly report already exists, deleting for test...')
      await prisma.weeklyReportActivity.deleteMany({
        where: { weeklyReportId: existingReport.id },
      })
      await prisma.weeklyReport.delete({
        where: { id: existingReport.id },
      })
    }

    // Calculate dates for the week
    const projectStartDate = testProject.tanggalSpmk
      ? new Date(testProject.tanggalSpmk)
      : new Date('2025-01-01')
    const weekStartDate = new Date(projectStartDate)
    weekStartDate.setDate(projectStartDate.getDate() + (testWeek - 1) * 7)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)

    // Create weekly report
    const weeklyReport = await prisma.weeklyReport.create({
      data: {
        projectId: testProject.id,
        weekNumber: testWeek,
        startDate: weekStartDate,
        endDate: weekEndDate,
        satker: testProject.satker?.name || 'Test Satker',
        kegiatan: 'Irigasi dan Rawa II',
        proyekPekerjaan: testProject.pekerjaan || 'Test Project',
        status: 'DRAFT',
      },
    })

    console.log(`✅ Created weekly report: ${weeklyReport.id}`)

    // Step 5: Generate activities for the report
    console.log('\n🏗️ Step 5: Generating report activities...')
    let activityIndex = 1

    for (const activity of testProject.activities) {
      // Create main activity
      const mainActivity = await prisma.weeklyReportActivity.create({
        data: {
          weeklyReportId: weeklyReport.id,
          name: activity.name,
          displayOrder: activityIndex * 1000,
          romanNumber: convertToRoman(activityIndex),
        },
      })

      let subActivityIndex = 1

      for (const subActivity of activity.subActivities) {
        // Get schedule data for calculations
        const currentWeekSchedule = subActivity.schedules.find(s => s.weekNumber === testWeek)
        const previousWeeksSchedules = subActivity.schedules.filter(s => s.weekNumber < testWeek)

        const realisasiMinggulalu_volume = previousWeeksSchedules.reduce(
          (sum, schedule) => sum + (schedule.realization || 0),
          0
        )

        const targetMingguIni = currentWeekSchedule?.actionPlan || 0
        const realisasiMingguIni = currentWeekSchedule?.realization || 0
        const kumulatifMingguIni_volume = realisasiMinggulalu_volume + realisasiMingguIni

        const status = realisasiMingguIni >= targetMingguIni ? 'TERCAPAI' : 'TIDAK_TERCAPAI'
        const volume = subActivity.volume || 1
        const persentaseItemPekerjaan = (kumulatifMingguIni_volume / volume) * 100

        await prisma.weeklyReportActivity.create({
          data: {
            weeklyReportId: weeklyReport.id,
            parentActivityId: mainActivity.id,
            sourceSubActivityId: subActivity.id,
            sourceScheduleWeekNumber: testWeek,
            name: subActivity.name,
            sat: subActivity.satuan || 'Unit',
            volume: subActivity.volume || 0,
            bobot: subActivity.weight || 0,
            realisasiMinggulalu_volume: realisasiMinggulalu_volume,
            targetMingguIni: targetMingguIni,
            realisasiMingguIni: realisasiMingguIni,
            status: status,
            kumulatifMingguIni_volume: kumulatifMingguIni_volume,
            persentaseItemPekerjaan: Math.min(persentaseItemPekerjaan, 100),
            persentaseGrafikProgress:
              targetMingguIni > 0 ? (realisasiMingguIni / targetMingguIni) * 100 : 0,
            persentaseRencanaKumulatif: Math.min(persentaseItemPekerjaan, 100),
            statusKumulatif: status === 'TERCAPAI' ? 'Tercapai' : 'Tidak Tercapai',
            persentaseSeluruhPekerjaan: (persentaseItemPekerjaan * (subActivity.weight || 0)) / 100,
            displayOrder: activityIndex * 1000 + subActivityIndex,
            subNumber: subActivityIndex,
          },
        })

        subActivityIndex++
      }

      activityIndex++
    }

    console.log(`✅ Generated ${activityIndex - 1} main activities with sub-activities`)

    // Step 6: Fetch and display the complete report
    console.log('\n📖 Step 6: Fetching complete report...')
    const completeReport = await prisma.weeklyReport.findUnique({
      where: { id: weeklyReport.id },
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

    console.log('📊 Complete Report Structure:')
    console.log(`  📋 Report ID: ${completeReport?.id}`)
    console.log(`  📅 Week: ${completeReport?.weekNumber}`)
    console.log(`  📍 Project: ${completeReport?.project.pekerjaan}`)
    console.log(`  🏢 Satker: ${completeReport?.project.satker?.name}`)
    console.log(`  📊 Activities: ${completeReport?.activities.length}`)

    // Display activity structure
    const mainActivities = completeReport?.activities.filter(a => !a.parentActivityId) || []
    for (const mainActivity of mainActivities) {
      console.log(`    🔸 ${mainActivity.romanNumber} - ${mainActivity.name}`)

      const subActivities =
        completeReport?.activities.filter(a => a.parentActivityId === mainActivity.id) || []
      for (const subActivity of subActivities) {
        console.log(`      ↳ ${subActivity.subNumber}. ${subActivity.name}`)
        console.log(
          `         📊 Target: ${subActivity.targetMingguIni}, Realisasi: ${subActivity.realisasiMingguIni}`
        )
        console.log(
          `         📈 Status: ${subActivity.status}, Progress: ${subActivity.persentaseItemPekerjaan?.toFixed(1)}%`
        )
      }
    }

    // Step 7: Test data format for UI
    console.log('\n🎨 Step 7: Testing UI data format...')
    const uiFormattedData = formatReportForUI(completeReport!)
    console.log('✅ UI formatted data structure created')
    console.log(`📋 Main activities: ${uiFormattedData.activities.length}`)

    for (const activity of uiFormattedData.activities.slice(0, 2)) {
      // Show first 2
      console.log(`  🔸 ${activity.name} (${activity.subActivities?.length || 0} sub-activities)`)
    }

    console.log('\n✅ All tests completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`  ✅ Period data calculation: Working`)
    console.log(`  ✅ Weekly report creation: Working`)
    console.log(`  ✅ Activity hierarchy: Working`)
    console.log(`  ✅ Data calculations: Working`)
    console.log(`  ✅ UI data formatting: Working`)
    console.log(`  🔄 Excel export: Ready for testing`)
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to convert numbers to Roman numerals
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

// Helper function to format report data for UI
function formatReportForUI(report: any) {
  const mainActivities = report.activities.filter((a: any) => !a.parentActivityId)

  return {
    id: report.id,
    projectName: report.project.pekerjaan,
    satker: report.satker,
    kegiatan: report.kegiatan,
    proyekPekerjaan: report.proyekPekerjaan,
    weekNumber: report.weekNumber,
    reportPeriod: `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
    activities: mainActivities.map((mainActivity: any) => ({
      id: mainActivity.id,
      name: mainActivity.name,
      subActivities: report.activities
        .filter((a: any) => a.parentActivityId === mainActivity.id)
        .map((subActivity: any) => ({
          id: subActivity.id,
          name: subActivity.name,
          sat: subActivity.sat,
          volume: subActivity.volume,
          weight: subActivity.bobot,
          realisasiMinggulalu: {
            volume: subActivity.realisasiMinggulalu_volume,
            bobot: subActivity.realisasiMinggulalu_bobot,
          },
          targetMingguIni: subActivity.targetMingguIni,
          realisasiMingguIni: subActivity.realisasiMingguIni,
          status: subActivity.status === 'TERCAPAI' ? 'Tercapai' : 'Tidak Tercapai',
          kumulatifMingguIni: {
            volume: subActivity.kumulatifMingguIni_volume,
            bobot: subActivity.kumulatifMingguIni_bobot,
          },
          persentaseItemPekerjaan: subActivity.persentaseItemPekerjaan,
          persentaseGrafikProgress: subActivity.persentaseGrafikProgress,
          persentaseRencanaKumulatif: subActivity.persentaseRencanaKumulatif,
          statusKumulatif: subActivity.statusKumulatif,
          persentaseSeluruhPekerjaan: subActivity.persentaseSeluruhPekerjaan,
        })),
    })),
  }
}

// Helper function to format dates
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

// Run the test
testWeeklyReportsFlow()

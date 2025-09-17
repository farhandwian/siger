/**
 * API Test Script for Weekly Reports
 * Tests the actual API endpoints
 */

const BASE_URL = 'http://localhost:3000'

async function testWeeklyReportsAPI() {
  console.log('🚀 Testing Weekly Reports API Endpoints...\n')

  try {
    // Test 1: Get periods data
    console.log('📅 Test 1: Testing /api/reports/periods')
    const periodsResponse = await fetch(`${BASE_URL}/api/reports/periods`)
    const periodsData = await periodsResponse.json()

    console.log(`Status: ${periodsResponse.status}`)
    console.log('Response:', JSON.stringify(periodsData, null, 2))

    // Test 2: Get periods for specific project
    console.log('\n📅 Test 2: Testing /api/reports/periods with projectId')
    const periodsWithProjectResponse = await fetch(`${BASE_URL}/api/reports/periods?projectId=1`)
    const periodsWithProjectData = await periodsWithProjectResponse.json()

    console.log(`Status: ${periodsWithProjectResponse.status}`)
    console.log('Response:', JSON.stringify(periodsWithProjectData, null, 2))

    // Test 3: Create weekly report
    console.log('\n📝 Test 3: Testing POST /api/reports/weekly')
    const createReportResponse = await fetch(`${BASE_URL}/api/reports/weekly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: '1',
        weekNumber: 5,
      }),
    })
    const createReportData = await createReportResponse.json()

    console.log(`Status: ${createReportResponse.status}`)
    console.log('Response:', JSON.stringify(createReportData, null, 2))

    // Test 4: Get weekly reports
    console.log('\n📖 Test 4: Testing GET /api/reports/weekly')
    const getReportsResponse = await fetch(`${BASE_URL}/api/reports/weekly`)
    const getReportsData = await getReportsResponse.json()

    console.log(`Status: ${getReportsResponse.status}`)
    console.log(`Found ${getReportsData.data?.length || 0} reports`)

    if (getReportsData.data && getReportsData.data.length > 0) {
      const firstReport = getReportsData.data[0]
      console.log(
        `First report: Week ${firstReport.weekNumber} for project ${firstReport.project?.pekerjaan}`
      )

      // Test 5: Excel export (if we have a report)
      console.log('\n📊 Test 5: Testing Excel export')
      const exportResponse = await fetch(`${BASE_URL}/api/reports/weekly/${firstReport.id}/export`)

      console.log(`Export Status: ${exportResponse.status}`)
      console.log(`Content-Type: ${exportResponse.headers.get('Content-Type')}`)

      if (exportResponse.ok) {
        console.log('✅ Excel export working - file ready for download')
      } else {
        const exportError = await exportResponse.text()
        console.log('❌ Excel export failed:', exportError)
      }
    }

    console.log('\n✅ API Tests Summary:')
    console.log(`  📅 Periods API: ${periodsResponse.ok ? '✅' : '❌'}`)
    console.log(`  📅 Periods with Project: ${periodsWithProjectResponse.ok ? '✅' : '❌'}`)
    console.log(`  📝 Create Report: ${createReportResponse.ok ? '✅' : '❌'}`)
    console.log(`  📖 Get Reports: ${getReportsResponse.ok ? '✅' : '❌'}`)
  } catch (error) {
    console.error('❌ API Test failed:', error)
  }
}

testWeeklyReportsAPI()

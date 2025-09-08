// Mobile API Testing Suite
// Run this file to test all mobile-related APIs

const BASE_URL = 'http://localhost:3000/api'

async function testFullProjectsAPI() {
  console.log('\n🔍 Testing GET /api/full-projects...')

  try {
    const response = await fetch(`${BASE_URL}/full-projects?page=1&limit=5`)
    const data = await response.json()

    if (data.success) {
      console.log('✅ Full projects API works!')
      console.log(`📊 Found ${data.data.length} projects`)
      console.log(`📄 Pagination: Page ${data.pagination.page} of ${data.pagination.totalPages}`)

      // Check if projects have activities
      const hasActivities = data.data.some(
        project => project.activities && project.activities.length > 0
      )
      if (hasActivities) {
        console.log('✅ Projects include activities and sub-activities')
      } else {
        console.log('⚠️  No activities found in projects')
      }
    } else {
      console.log('❌ Full projects API failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Full projects API error:', error.message)
  }
}

async function testLatestDailyActivitiesAPI() {
  console.log('\n🔍 Testing GET /api/latest-daily-sub-activities...')

  try {
    const response = await fetch(`${BASE_URL}/latest-daily-sub-activities`)
    const data = await response.json()

    if (data.success) {
      console.log('✅ Latest daily activities API works!')
      console.log(`📅 Latest date: ${data.latestDate || 'No data'}`)
      console.log(`📊 Found ${data.data.length} daily activities`)
    } else {
      console.log('❌ Latest daily activities API failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Latest daily activities API error:', error.message)
  }
}

async function testDailyUpdateAPI() {
  console.log('\n🔍 Testing PUT /api/daily-sub-activities-update...')

  // First, get a real sub-activity ID from the database
  try {
    const projectsResponse = await fetch(`${BASE_URL}/full-projects?limit=1`)
    const projectsData = await projectsResponse.json()

    if (!projectsData.success || !projectsData.data.length) {
      console.log('❌ No projects found for testing update API')
      return
    }

    const project = projectsData.data[0]
    const activity = project.activities?.[0]
    const subActivity = activity?.subActivities?.[0]

    if (!subActivity) {
      console.log('❌ No sub-activities found for testing update API')
      return
    }

    console.log(`📝 Testing with sub-activity: ${subActivity.name} (ID: ${subActivity.id})`)

    const testData = {
      sub_activities_id: subActivity.id,
      koordinat: {
        latitude: -6.2088,
        longitude: 106.8456,
      },
      catatan_kegiatan: `Test kegiatan dari mobile - ${new Date().toISOString()}`,
      tanggal_progres: new Date().toISOString().split('T')[0], // Today's date
      progres_realisasi_per_hari: 12.5,
      files: [
        {
          file: 'test-image.jpg',
          path: `/uploads/${new Date().toISOString().split('T')[0]}/test-image.jpg`,
        },
      ],
    }

    const response = await fetch(`${BASE_URL}/daily-sub-activities-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    const data = await response.json()

    if (data.success) {
      console.log('✅ Daily update API works!')
      console.log('📝 Progress updated successfully')
      console.log(`📊 Daily progress: ${testData.progres_realisasi_per_hari}%`)
    } else {
      console.log('❌ Daily update API failed:', data.error)
      if (data.details) {
        console.log('📋 Validation errors:', data.details)
      }
    }
  } catch (error) {
    console.log('❌ Daily update API error:', error.message)
  }
}

async function testAllAPIs() {
  console.log('🚀 Starting Mobile API Tests...')
  console.log('='.repeat(50))

  await testFullProjectsAPI()
  await testLatestDailyActivitiesAPI()
  await testDailyUpdateAPI()

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Mobile API Testing Complete!')

  // Test the latest activities again to see if our update worked
  console.log('\n🔄 Re-testing latest activities to verify update...')
  await testLatestDailyActivitiesAPI()
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAllAPIs().catch(console.error)
}

module.exports = {
  testFullProjectsAPI,
  testLatestDailyActivitiesAPI,
  testDailyUpdateAPI,
  testAllAPIs,
}

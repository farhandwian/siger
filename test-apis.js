// Test script for the new APIs
async function testAPIs() {
  const baseURL = 'http://localhost:3000/api'

  console.log('Testing /api/full-projects...')
  try {
    const response = await fetch(`${baseURL}/full-projects`)
    const data = await response.json()
    console.log('Full projects response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error testing full-projects:', error)
  }

  // Test script for the new APIs
  const BASE_URL = 'http://localhost:3000/api'

  async function testAPI(endpoint, method = 'GET', body = null) {
    try {
      console.log(`
🧪 Testing ${method} ${endpoint}`)
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, options)
      const data = await response.json()

      console.log(`Status: ${response.status}`)
      console.log('Response:', JSON.stringify(data, null, 2))

      return { response, data }
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error.message)
      return { error }
    }
  }

  async function runTests() {
    console.log('🚀 Starting API tests...')

    // Test 1: GET /api/full-projects
    await testAPI('/full-projects')

    // Test 2: GET /api/full-projects with pagination
    await testAPI('/full-projects?page=1&limit=2')

    // Test 3: GET /api/full-projects with search
    await testAPI('/full-projects?search=Irigasi')

    // Test 4: GET /api/latest-daily-sub-activities (should be empty initially)
    await testAPI('/latest-daily-sub-activities')

    // Test 5: PUT /api/daily-sub-activities-update (we'll need a valid sub_activities_id)
    // First, let's get a project with activities
    const { data: fullProjects } = await testAPI('/full-projects?limit=1')

    if (fullProjects?.success && fullProjects.data?.[0]?.activities?.[0]?.subActivities?.[0]) {
      const subActivityId = fullProjects.data[0].activities[0].subActivities[0].id

      const updatePayload = {
        sub_activities_id: subActivityId,
        koordinat: {
          latitude: -6.2088,
          longitude: 106.8456,
        },
        catatan_kegiatan: 'Test kegiatan dari mobile',
        tanggal_progres: '2025-09-08',
        progres_realisasi_per_hari: 15.5,
        files: [
          {
            file: 'test-image.jpg',
            path: '/uploads/test-image.jpg',
          },
          {
            file: 'test_doc_1.pdf',
            path: '/uploads/daily/test_doc_1.pdf',
          },
        ],
      }

      await testAPI('/daily-sub-activities-update', 'PUT', updatePayload)

      // Test 6: Check latest daily activities after adding data
      await testAPI('/latest-daily-sub-activities')
    } else {
      console.log('⚠️  No sub activities found to test daily update')
    }

    console.log('✅ API tests completed!')
  }

  // Run the tests
  runTests().catch(console.error)
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAPIs }
}

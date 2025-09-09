const API_BASE_URL = 'http://localhost:3000/api'

async function testDailySubActivitiesListAPI() {
  console.log('🚀 Testing Daily Sub Activities List API...\n')

  const tests = [
    {
      name: 'Basic request (default parameters)',
      url: `${API_BASE_URL}/daily-sub-activities/list`,
    },
    {
      name: 'With pagination',
      url: `${API_BASE_URL}/daily-sub-activities/list?page=1&limit=5`,
    },
    {
      name: 'With search',
      url: `${API_BASE_URL}/daily-sub-activities/list?search=galian&limit=10`,
    },
    {
      name: 'With sorting by creation date',
      url: `${API_BASE_URL}/daily-sub-activities/list?sortBy=createdAt&sortOrder=asc&limit=5`,
    },
    {
      name: 'With sorting by progress date',
      url: `${API_BASE_URL}/daily-sub-activities/list?sortBy=tanggalProgres&sortOrder=desc&limit=5`,
    },
    {
      name: 'With project filter (if you have a project ID)',
      url: `${API_BASE_URL}/daily-sub-activities/list?projectId=YOUR_PROJECT_ID&limit=5`,
      skip: true, // Skip if no project ID available
    },
    {
      name: 'With date range filter',
      url: `${API_BASE_URL}/daily-sub-activities/list?startDate=2024-01-01&endDate=2024-12-31&limit=5`,
    },
    {
      name: 'Complex query with multiple filters',
      url: `${API_BASE_URL}/daily-sub-activities/list?search=galian&sortBy=updatedAt&sortOrder=desc&page=1&limit=10&startDate=2024-01-01`,
    },
    {
      name: 'Invalid page number (should return validation error)',
      url: `${API_BASE_URL}/daily-sub-activities/list?page=0`,
      expectError: true,
    },
    {
      name: 'Invalid limit (should return validation error)',
      url: `${API_BASE_URL}/daily-sub-activities/list?limit=101`,
      expectError: true,
    },
    {
      name: 'Invalid sort field (should return validation error)',
      url: `${API_BASE_URL}/daily-sub-activities/list?sortBy=invalidField`,
      expectError: true,
    },
  ]

  for (const test of tests) {
    if (test.skip) {
      console.log(`⏭️  Skipping: ${test.name}`)
      continue
    }

    console.log(`🧪 Testing: ${test.name}`)
    console.log(`📍 URL: ${test.url}`)

    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (test.expectError) {
        if (!response.ok && data.success === false) {
          console.log(`✅ Expected error received:`)
          console.log(`   Status: ${response.status}`)
          console.log(`   Error: ${data.error}`)
          console.log(`   Message: ${data.message}`)
        } else {
          console.log(`❌ Expected error but got success response`)
          console.log(`   Status: ${response.status}`)
          console.log(`   Response:`, JSON.stringify(data, null, 2))
        }
      } else {
        if (response.ok && data.success === true) {
          console.log(`✅ Success:`)
          console.log(`   Status: ${response.status}`)
          console.log(`   Total items: ${data.pagination?.total || 0}`)
          console.log(`   Current page: ${data.pagination?.page || 1}`)
          console.log(`   Items per page: ${data.pagination?.limit || 10}`)
          console.log(`   Data count: ${data.data?.length || 0}`)

          if (data.data && data.data.length > 0) {
            const firstItem = data.data[0]
            console.log(`   First item ID: ${firstItem.id}`)
            console.log(`   Sub Activity: ${firstItem.subActivity?.name || 'N/A'}`)
            console.log(`   Progress Date: ${firstItem.tanggalProgres}`)
            console.log(`   Daily Progress: ${firstItem.progresRealisasiPerHari}%`)
          }

          if (data.filters) {
            console.log(`   Applied filters:`, JSON.stringify(data.filters, null, 2))
          }
        } else {
          console.log(`❌ Unexpected response:`)
          console.log(`   Status: ${response.status}`)
          console.log(`   Response:`, JSON.stringify(data, null, 2))
        }
      }
    } catch (error) {
      console.log(`❌ Request failed:`)
      console.log(`   Error: ${error.message}`)
    }

    console.log('') // Empty line for readability
  }

  // Test pagination functionality
  console.log('🔄 Testing pagination flow...')
  try {
    const firstPageResponse = await fetch(
      `${API_BASE_URL}/daily-sub-activities/list?page=1&limit=5`
    )
    const firstPageData = await firstPageResponse.json()

    if (firstPageData.success && firstPageData.pagination.totalPages > 1) {
      console.log(`✅ First page loaded, testing second page...`)

      const secondPageResponse = await fetch(
        `${API_BASE_URL}/daily-sub-activities/list?page=2&limit=5`
      )
      const secondPageData = await secondPageResponse.json()

      if (secondPageData.success) {
        console.log(`✅ Second page loaded successfully`)
        console.log(`   Page 1 items: ${firstPageData.data.length}`)
        console.log(`   Page 2 items: ${secondPageData.data.length}`)

        // Check if items are different
        const firstPageIds = firstPageData.data.map(item => item.id)
        const secondPageIds = secondPageData.data.map(item => item.id)
        const hasOverlap = firstPageIds.some(id => secondPageIds.includes(id))

        if (!hasOverlap) {
          console.log(`✅ No overlap between pages - pagination working correctly`)
        } else {
          console.log(`⚠️  Found overlapping items between pages`)
        }
      }
    } else {
      console.log(`ℹ️  Only one page available or no data`)
    }
  } catch (error) {
    console.log(`❌ Pagination test failed: ${error.message}`)
  }

  console.log('\n🏁 Daily Sub Activities List API testing completed!')
}

// Run the tests
testDailySubActivitiesListAPI().catch(console.error)

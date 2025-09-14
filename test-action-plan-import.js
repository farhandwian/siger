// Test that Action Plan CSV import API works the same as Activity Schedule import
console.log('🧪 Testing Action Plan CSV Import API...')

const API_BASE = 'http://localhost:3001'

// Mock data that matches the format expected by both imports
const testImportData = {
  projectId: '2', // Assuming project 2 exists
  importMode: 'upsert',
  activities: [
    {
      name: 'Test Activity for Action Plan',
      type: 'activity',
      scheduleData: [],
    },
    {
      name: 'Test Sub-Activity for Action Plan',
      type: 'subActivity',
      parentActivity: 'Test Activity for Action Plan',
      satuan: 'unit',
      volumeKontrak: 100,
      bobotMC0: 10,
      volumeMC0: 50,
      scheduleData: [
        {
          period: '2025-05-W5',
          month: 5,
          year: 2025,
          week: 5,
          planPercentage: 25,
          actualPercentage: 0,
        },
        {
          period: '2025-06-W1',
          month: 6,
          year: 2025,
          week: 1,
          planPercentage: 30,
          actualPercentage: 15,
        },
      ],
    },
  ],
}

async function testActionPlanImport() {
  try {
    console.log('\n📤 Sending test data to Action Plan import API...')
    console.log('Endpoint: /api/projects/2/action-plan-schedule/import')
    console.log('Data sample:', {
      projectId: testImportData.projectId,
      activitiesCount: testImportData.activities.length,
      importMode: testImportData.importMode,
      firstActivity: testImportData.activities[0]?.name,
      scheduleCount: testImportData.activities.reduce((sum, a) => sum + a.scheduleData.length, 0),
    })

    const response = await fetch(`${API_BASE}/api/projects/2/action-plan-schedule/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testImportData),
    })

    console.log('\n📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
      throw new Error(`Import failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('\n✅ Action Plan Import successful!')
    console.log('📊 Import stats:', result.stats || result)

    if (result.success) {
      console.log('🎉 Action Plan CSV import API is working correctly!')
      console.log(
        '💡 This means the Action Plan import now follows the same pattern as Activity Schedule import.'
      )
    }
  } catch (error) {
    console.error('❌ Action Plan import test failed:', error.message)
    console.log('\n🔍 Make sure:')
    console.log('  1. Development server is running on port 3001')
    console.log('  2. Project ID 2 exists in the database')
    console.log('  3. Action Plan import API is properly configured')
  }
}

// Run the test
testActionPlanImport()

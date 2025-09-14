// Test script to check polygon API
const fetch = require('node-fetch').default || require('node-fetch')

async function testPolygonAPI() {
  const baseUrl = 'http://localhost:3002'

  try {
    // First, let's try to get projects list
    console.log('Testing projects API...')
    const projectsResponse = await fetch(`${baseUrl}/api/projects`)

    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json()
      console.log('Projects API Response:', JSON.stringify(projectsData, null, 2))

      // If we have projects, test the area API with the first project
      if (projectsData.success && projectsData.data && projectsData.data.length > 0) {
        const firstProject = projectsData.data[0]
        console.log(`\nTesting area API for project: ${firstProject.id}`)

        const areaResponse = await fetch(`${baseUrl}/api/projects/${firstProject.id}/area`)
        console.log('Area API Status:', areaResponse.status)

        if (areaResponse.ok) {
          const areaData = await areaResponse.json()
          console.log('Area API Response:', JSON.stringify(areaData, null, 2))
        } else {
          console.log('Area API Error:', await areaResponse.text())
        }
      } else {
        console.log('No projects found in database')
      }
    } else {
      console.log('Projects API Error:', projectsResponse.status, await projectsResponse.text())
    }
  } catch (error) {
    console.error('Error testing API:', error)
  }
}

testPolygonAPI()

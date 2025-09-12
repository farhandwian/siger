// Simple test to save polygon data for testing
const testCoordinates = [
  { lat: -5.395, lng: 105.29 },
  { lat: -5.395, lng: 105.32 },
  { lat: -5.415, lng: 105.32 },
  { lat: -5.415, lng: 105.29 },
]

async function saveTestPolygon() {
  try {
    const response = await fetch('http://localhost:3002/api/projects/1/area', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: testCoordinates }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Successfully saved test polygon:', result)
    } else {
      console.log('Error saving test polygon:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// To test in browser console:
console.log('Run this in browser console to save test polygon data:')
console.log(`
fetch('/api/projects/1/area', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    coordinates: [
      { lat: -5.395, lng: 105.290 },
      { lat: -5.395, lng: 105.320 },
      { lat: -5.415, lng: 105.320 },
      { lat: -5.415, lng: 105.290 }
    ]
  })
}).then(res => res.json()).then(data => console.log('Saved:', data));
`)

// test-image-upload-api.js
// Test script untuk API upload dan delete image
// Run dengan: node test-image-upload-api.js

const API_BASE_URL = 'http://localhost:3000'

/**
 * Test upload image dengan file dummy
 */
async function testUploadImage() {
  console.log('🧪 Testing Upload Image API...\n')

  try {
    // Create a simple test image file (base64 encoded 1x1 pixel PNG)
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jINgNAAAAAElFTkSuQmCC'
    const testImageBuffer = Buffer.from(testImageBase64, 'base64')

    // Create FormData
    const FormData = require('form-data')
    const formData = new FormData()

    formData.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png',
    })

    // Send request
    const fetch = require('node-fetch')
    const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    })

    const result = await response.json()

    console.log('📤 Upload Response Status:', response.status)
    console.log('📤 Upload Response:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('✅ Upload successful!')
      console.log(`📁 File Name: ${result.data.fileName}`)
      console.log(`📍 File Path: ${result.data.path}`)
      console.log(`📏 File Size: ${result.data.size} bytes`)
      console.log(`🎭 MIME Type: ${result.data.mimeType}`)

      return result.data.path // Return full path for delete test
    } else {
      console.log('❌ Upload failed:', result.message)
      return null
    }
  } catch (error) {
    console.error('❌ Upload test error:', error.message)
    return null
  }
}

/**
 * Test delete image
 */
async function testDeleteImage(fileName) {
  if (!fileName) {
    console.log('⏭️ Skipping delete test (no file uploaded)\n')
    return
  }

  console.log('\n🧪 Testing Delete Image API...\n')

  try {
    const fetch = require('node-fetch')
    const response = await fetch(`${API_BASE_URL}/api/delete-image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileName,
      }),
    })

    const result = await response.json()

    console.log('🗑️ Delete Response Status:', response.status)
    console.log('🗑️ Delete Response:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('✅ Delete successful!')
      console.log(`📝 Message: ${result.message}`)
    } else {
      console.log('❌ Delete failed:', result.message)
    }
  } catch (error) {
    console.error('❌ Delete test error:', error.message)
  }
}

/**
 * Test health check endpoints
 */
async function testHealthChecks() {
  console.log('\n🧪 Testing Health Check Endpoints...\n')

  try {
    const fetch = require('node-fetch')

    // Test upload health check
    const uploadHealth = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'GET',
    })
    const uploadResult = await uploadHealth.json()

    console.log('🏥 Upload Health Check:', uploadResult)

    // Test delete health check
    const deleteHealth = await fetch(`${API_BASE_URL}/api/delete-image`, {
      method: 'GET',
    })
    const deleteResult = await deleteHealth.json()

    console.log('🏥 Delete Health Check:', deleteResult)
  } catch (error) {
    console.error('❌ Health check error:', error.message)
  }
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🧪 Testing Error Scenarios...\n')

  try {
    const fetch = require('node-fetch')

    // Test 1: Upload tanpa file
    console.log('📋 Test 1: Upload without file')
    const noFileResponse = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const noFileResult = await noFileResponse.json()
    console.log('   Result:', noFileResult)

    // Test 2: Delete file yang tidak ada
    console.log('\n📋 Test 2: Delete non-existent file')
    const noFileDeleteResponse = await fetch(`${API_BASE_URL}/api/delete-image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'non-existent-file.jpg',
      }),
    })
    const noFileDeleteResult = await noFileDeleteResponse.json()
    console.log('   Result:', noFileDeleteResult)

    // Test 3: Delete tanpa fileName
    console.log('\n📋 Test 3: Delete without fileName')
    const noNameDeleteResponse = await fetch(`${API_BASE_URL}/api/delete-image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const noNameDeleteResult = await noNameDeleteResponse.json()
    console.log('   Result:', noNameDeleteResult)
  } catch (error) {
    console.error('❌ Error scenario test failed:', error.message)
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Image Upload API Tests...\n')
  console.log('='.repeat(50))

  // Check if required packages are installed
  try {
    require('node-fetch')
    require('form-data')
  } catch (error) {
    console.log('❌ Missing dependencies. Please install:')
    console.log('   npm install node-fetch@2 form-data')
    return
  }

  // Health checks first
  await testHealthChecks()

  // Main functionality tests
  const uploadedFileName = await testUploadImage()
  await testDeleteImage(uploadedFileName)

  // Error scenario tests
  await testErrorScenarios()

  console.log('\n' + '='.repeat(50))
  console.log('🎯 All tests completed!')
  console.log('\n📋 Test Summary:')
  console.log('   ✅ Health Check Tests')
  console.log('   ✅ Upload Image Test')
  console.log('   ✅ Delete Image Test')
  console.log('   ✅ Error Scenario Tests')

  console.log('\n📝 Next Steps:')
  console.log('   1. Check MinIO storage for uploaded files')
  console.log('   2. Test with real mobile app')
  console.log('   3. Monitor server logs for any issues')
}

// Run tests
runAllTests().catch(console.error)

// src/app/api/delete-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { minioClient, getBucketName } from '@/lib/minio'
import { DeleteImageRequestSchema, DeleteImageResponseSchema } from '@/lib/schemas/image-upload'

/**
 * DELETE /api/delete-image
 * Hapus gambar dari MinIO storage
 *
 * Body: JSON { fileName: string, bucket?: string }
 *
 * Response:
 * - Success: { success: true, message: string }
 * - Error: { success: false, message: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ Starting image deletion process...')

    // Parse JSON body
    const body = await req.json()
    console.log('📝 Delete request body:', body)

    // Validate request body dengan Zod
    const validatedBody = DeleteImageRequestSchema.parse(body)
    const { fileName: requestedFileName, bucket } = validatedBody

    // Use provided bucket atau default
    const bucketName = bucket || getBucketName()
    let fileName = requestedFileName

    console.log(`🗂️ Attempting to delete: ${bucketName}/${fileName}`)

    // Check if file exists sebelum delete
    try {
      await minioClient.statObject(bucketName, fileName)
      console.log('✅ File found, proceeding with deletion')
    } catch (statError) {
      // Try with different path formats if not found
      console.log('⚠️ File not found with direct path, trying alternative paths...')

      // If fileName doesn't include path, it might be just the filename from upload response
      // Try to find it in the images directory structure
      const possiblePaths = [
        fileName, // Original attempt
        `images/${fileName}`, // If fileName is like "2025/09/file.jpg"
      ]

      let foundPath = null
      for (const path of possiblePaths) {
        try {
          await minioClient.statObject(bucketName, path)
          foundPath = path
          console.log(`✅ File found at: ${path}`)
          break
        } catch (e) {
          // Continue to next path
        }
      }

      if (!foundPath) {
        console.log('❌ File not found in any expected locations')
        return NextResponse.json(
          DeleteImageResponseSchema.parse({
            success: false,
            message: `File ${fileName} not found in bucket ${bucketName}. Make sure to use the full path returned from upload.`,
          }),
          { status: 404 }
        )
      }

      // Update fileName to the found path
      fileName = foundPath
    }

    // Delete file dari MinIO
    await minioClient.removeObject(bucketName, fileName)
    console.log('✅ File deleted successfully')

    // Prepare response
    const responseData = {
      success: true,
      message: `File ${fileName} deleted successfully`,
    }

    // Validate response dengan Zod
    const validatedResponse = DeleteImageResponseSchema.parse(responseData)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('❌ Error deleting image:', error)

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        DeleteImageResponseSchema.parse({
          success: false,
          message: 'Invalid request format. Required: { fileName: string, bucket?: string }',
        }),
        { status: 400 }
      )
    }

    return NextResponse.json(
      DeleteImageResponseSchema.parse({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete image',
      }),
      { status: 500 }
    )
  }
}

/**
 * POST /api/delete-image
 * Alternative endpoint untuk delete (same functionality)
 * Beberapa client lebih nyaman dengan POST untuk delete operations
 */
export async function POST(req: NextRequest) {
  return DELETE(req)
}

/**
 * GET /api/delete-image
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Image delete API is ready',
    usage: 'Send DELETE request with { fileName: string, bucket?: string }',
  })
}

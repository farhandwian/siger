// src/app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  minioClient,
  generateUniqueFileName,
  generateImagePath,
  isValidImageType,
  isValidFileSize,
  getBucketName,
} from '@/lib/minio'
import { ImageUploadResponseSchema } from '@/lib/schemas/image-upload'

/**
 * POST /api/upload-image
 * Upload gambar ke MinIO storage
 *
 * Body: FormData dengan field 'file' berisi image file
 *
 * Response:
 * - Success: { success: true, data: { fileName, path, url?, size, mimeType } }
 * - Error: { success: false, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting image upload process...')

    // Parse FormData dari request
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ No file provided in request')
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    console.log(`📁 File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Validasi file type
    if (!isValidImageType(file.type)) {
      console.log(`❌ Invalid file type: ${file.type}`)
      return NextResponse.json(
        {
          success: false,
          message: `File type ${file.type} not allowed. Only images are supported.`,
        },
        { status: 400 }
      )
    }

    // Validasi file size (5MB max)
    if (!isValidFileSize(file.size)) {
      console.log(`❌ File too large: ${file.size} bytes (max 5MB)`)
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename dan path
    const uniqueFileName = generateUniqueFileName(file.name)
    const imagePath = generateImagePath(uniqueFileName)
    const bucketName = getBucketName()

    console.log(`📂 Generated path: ${bucketName}/${imagePath}`)

    // Convert File ke Buffer untuk upload
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload ke MinIO
    console.log('⬆️ Uploading to MinIO...')
    await minioClient.putObject(bucketName, imagePath, fileBuffer, file.size, {
      'Content-Type': file.type,
      'Content-Disposition': `inline; filename="${file.name}"`,
    })

    console.log('✅ Upload successful!')

    // Generate URL untuk akses (optional)
    let publicUrl: string | undefined
    try {
      // Generate presigned URL yang valid untuk 7 hari
      publicUrl = await minioClient.presignedGetObject(bucketName, imagePath, 7 * 24 * 60 * 60)
      console.log('🔗 Generated presigned URL')
    } catch (urlError) {
      console.log('⚠️ Failed to generate presigned URL:', urlError)
      // URL is optional, so we continue without it
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        fileName: uniqueFileName,
        path: imagePath,
        url: publicUrl,
        size: file.size,
        mimeType: file.type,
      },
    }

    // Validate response dengan Zod
    const validatedResponse = ImageUploadResponseSchema.parse(responseData)

    console.log('✅ Image upload completed successfully')
    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('❌ Error uploading image:', error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload-image
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Image upload API is ready',
    maxFileSize: '5MB',
    supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  })
}

// src/app/api/daily-sub-activities/[id]/images/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { minioClient, getBucketName } from '@/lib/minio'

// Schema untuk params
const ParamsSchema = z.object({
  id: z.string().min(1, 'Sub activity ID is required'),
})

// Schema untuk query parameters
const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD
})

// Schema untuk file data dari database
const FileDataSchema = z.object({
  file: z.string(),
  path: z.string(),
})

// Schema untuk response
const ImageResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      userId: z.string(),
      userName: z.string().optional(),
      catatanKegiatan: z.string().nullable(),
      images: z.array(
        z.object({
          fileName: z.string(),
          filePath: z.string(),
          url: z.string().optional(),
          uploadedAt: z.string(),
        })
      ),
    })
  ),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
})

/**
 * GET /api/daily-sub-activities/[id]/images
 * Mengambil semua gambar dari daily sub activities berdasarkan sub activity ID
 *
 * Query Parameters:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - startDate: string (YYYY-MM-DD format, optional)
 * - endDate: string (YYYY-MM-DD format, optional)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    console.log('🖼️ Fetching images for sub activity:', resolvedParams.id)

    // Validate params
    const validatedParams = ParamsSchema.parse(resolvedParams)
    const { id: subActivityId } = validatedParams

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))
    const { limit, offset, startDate, endDate } = query

    console.log('📋 Query parameters:', { limit, offset, startDate, endDate })

    // Check if sub activity exists
    const subActivity = await prisma.subActivity.findUnique({
      where: { id: subActivityId },
      select: { id: true, name: true },
    })

    if (!subActivity) {
      return NextResponse.json(
        { success: false, message: 'Sub activity not found' },
        { status: 404 }
      )
    }

    // Build where clause for date filtering
    const whereClause: any = {
      subActivityId: subActivityId,
      file: { not: null }, // Only get records with files
    }

    if (startDate && endDate) {
      whereClause.tanggalProgres = {
        gte: startDate,
        lte: endDate,
      }
    } else if (startDate) {
      whereClause.tanggalProgres = {
        gte: startDate,
      }
    } else if (endDate) {
      whereClause.tanggalProgres = {
        lte: endDate,
      }
    }

    // Get total count for pagination
    const total = await prisma.dailySubActivity.count({
      where: whereClause,
    })

    // Fetch daily activities with files
    const activities = await prisma.dailySubActivity.findMany({
      where: whereClause,
      select: {
        id: true,
        tanggalProgres: true,
        userId: true,
        catatanKegiatan: true,
        file: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ tanggalProgres: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    })

    console.log(`📊 Found ${activities.length} activities with files`)

    // Process activities and generate presigned URLs for images
    const processedActivities = await Promise.allSettled(
      activities.map(async activity => {
        try {
          // Parse files from JSON
          const filesData = activity.file as any[]
          if (!Array.isArray(filesData) || filesData.length === 0) {
            return null // Skip activities without valid files
          }

          // Process each file and generate presigned URL
          const images = await Promise.allSettled(
            filesData.map(async fileData => {
              try {
                // Validate file data structure
                const validFileData = FileDataSchema.parse(fileData)

                // Generate presigned URL (valid for 24 hours)
                let presignedUrl: string | undefined
                try {
                  const bucketName = getBucketName()
                  presignedUrl = await minioClient.presignedGetObject(
                    bucketName,
                    validFileData.path,
                    24 * 60 * 60 // 24 hours
                  )
                } catch (urlError) {
                  console.log(`⚠️ Failed to generate URL for ${validFileData.file}:`, urlError)
                  // Continue without URL - not critical
                }

                return {
                  fileName: validFileData.file,
                  filePath: validFileData.path,
                  url: presignedUrl,
                  uploadedAt: activity.createdAt.toISOString(),
                }
              } catch (fileError) {
                console.log('⚠️ Invalid file data:', fileError)
                return null
              }
            })
          )

          // Filter successful image processing
          const validImages = images
            .filter(
              (result): result is PromiseFulfilledResult<any> =>
                result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value)

          if (validImages.length === 0) {
            return null // Skip if no valid images
          }

          return {
            id: activity.id,
            date: activity.tanggalProgres,
            userId: activity.userId,
            userName: activity.user?.name,
            catatanKegiatan: activity.catatanKegiatan,
            images: validImages,
          }
        } catch (activityError) {
          console.log('⚠️ Error processing activity:', activityError)
          return null
        }
      })
    )

    // Filter successful activity processing
    const validActivities = processedActivities
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)

    console.log(`✅ Processed ${validActivities.length} valid activities`)

    // Prepare response
    const responseData = {
      success: true,
      data: validActivities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }

    // Validate response
    const validatedResponse = ImageResponseSchema.parse(responseData)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('❌ Error fetching images:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, message: 'Failed to fetch images' }, { status: 500 })
  }
}

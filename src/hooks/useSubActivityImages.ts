// src/hooks/useSubActivityImages.ts
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// Types untuk images
interface ActivityImage {
  fileName: string
  filePath: string
  url?: string
  uploadedAt: string
}

interface ActivityWithImages {
  id: string
  date: string
  userId: string
  userName?: string
  catatanKegiatan: string | null
  images: ActivityImage[]
}

interface ImagesResponse {
  success: boolean
  data: ActivityWithImages[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface UseSubActivityImagesOptions {
  subActivityId: string
  limit?: number
  offset?: number
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  enabled?: boolean
}

/**
 * Hook untuk mengambil gambar dari daily sub activities
 */
export function useSubActivityImages({
  subActivityId,
  limit = 20,
  offset = 0,
  startDate,
  endDate,
  enabled = true,
}: UseSubActivityImagesOptions) {
  return useQuery({
    queryKey: ['sub-activity-images', subActivityId, { limit, offset, startDate, endDate }],
    queryFn: async (): Promise<ImagesResponse> => {
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(
        `/api/daily-sub-activities/${subActivityId}/images?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch images')
      }

      return data
    },
    enabled: enabled && !!subActivityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  })
}

/**
 * Hook untuk mengambil semua gambar tanpa pagination (untuk gallery view)
 */
export function useAllSubActivityImages(
  subActivityId: string,
  dateRange?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: ['all-sub-activity-images', subActivityId, dateRange],
    queryFn: async (): Promise<ActivityImage[]> => {
      const params = new URLSearchParams({
        limit: '1000', // Large number to get all images
        offset: '0',
      })

      if (dateRange?.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(
        `/api/daily-sub-activities/${subActivityId}/images?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch images')
      }

      // Flatten all images from all activities
      const allImages: ActivityImage[] = []
      data.data.forEach((activity: ActivityWithImages) => {
        allImages.push(...activity.images)
      })

      return allImages
    },
    enabled: !!subActivityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export type { ActivityImage, ActivityWithImages, ImagesResponse }

import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// Schema for the API response
const CoordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

const FileSchema = z.object({
  file: z.string().optional(),
  path: z.string(),
  filename: z.string().optional(),
})

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: z.string(),
})

const ProjectSchema = z.object({
  id: z.string(),
  pekerjaan: z.string(),
  penyediaJasa: z.string(),
})

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  project: ProjectSchema,
})

const SubActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  satuan: z.string(),
  volumeKontrak: z.number(),
  weight: z.number(),
  activity: ActivitySchema,
})

const DailySubActivitySchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  userId: z.string(),
  koordinat: CoordinateSchema.nullable(),
  catatanKegiatan: z.string().nullable(),
  file: z.array(FileSchema).nullable(),
  progresRealisasiPerHari: z.number(),
  tanggalProgres: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: UserSchema,
  subActivity: SubActivitySchema,
})

const LatestDailySubActivitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(DailySubActivitySchema),
  latestDate: z.string().nullable(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export type LatestDailySubActivity = z.infer<typeof DailySubActivitySchema>
export type LatestDailySubActivitiesResponse = z.infer<
  typeof LatestDailySubActivitiesResponseSchema
>

interface UseLatestDailySubActivitiesParams {
  projectId?: string
  page?: number
  limit?: number
}

export function useLatestDailySubActivities({
  projectId,
  page = 1,
  limit = 100,
}: UseLatestDailySubActivitiesParams = {}) {
  return useQuery({
    queryKey: ['latest-daily-sub-activities', projectId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (projectId) {
        params.append('projectId', projectId)
      }

      const response = await fetch(`/api/latest-daily-sub-activities?${params}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch latest daily sub activities`)
      }

      const json = await response.json()
      return LatestDailySubActivitiesResponseSchema.parse(json)
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

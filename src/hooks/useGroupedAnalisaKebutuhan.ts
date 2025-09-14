import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// Schema for the grouped data structure (flexible categories)
const GroupedAnalisaKebutuhanSchema = z.object({
  success: z.literal(true),
  data: z.object({
    Kegiatan: z.array(
      z.object({
        name: z.string(),
        subActivities: z.array(
          z.object({
            name: z.string(),
            Target: z.string(),
            // Flexible categories - can be any user-defined category name
            categories: z
              .record(
                z.string(),
                z.array(
                  z.object({
                    name: z.string(), // Item/role name (unified naming)
                    jumlah: z.string(),
                    stokHarian: z.string(),
                    terpasang: z.string(),
                    totalStokHariIni: z.string(),
                  })
                )
              )
              .optional(),
          })
        ),
      })
    ),
  }),
})

export type GroupedAnalisaKebutuhanData = z.infer<typeof GroupedAnalisaKebutuhanSchema>['data']

interface UseGroupedAnalisaKebutuhanOptions {
  projectId?: string
  tanggal?: string // Format: YYYY-MM-DD
  enabled?: boolean
}

/**
 * Hook to fetch grouped analisa kebutuhan data for the table
 */
export function useGroupedAnalisaKebutuhan({
  projectId,
  tanggal,
  enabled = true,
}: UseGroupedAnalisaKebutuhanOptions = {}) {
  return useQuery({
    queryKey: ['analisa-kebutuhan-grouped', { projectId, tanggal }],
    queryFn: async (): Promise<GroupedAnalisaKebutuhanData> => {
      // Build query parameters
      const params = new URLSearchParams()
      if (projectId) params.set('projectId', projectId)
      if (tanggal) params.set('tanggal', tanggal)

      const url = `/api/analisa-kebutuhan/grouped?${params.toString()}`

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      const validatedData = GroupedAnalisaKebutuhanSchema.parse(json)

      return validatedData.data
    },
    enabled,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * React Query hooks for Resource Flow functionality
 * Manages analisa kebutuhan data and resource flow schedules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

// Types for AnalisaKebutuhan (similar to Material but with different structure)
export interface AnalisaKebutuhan {
  id: string
  subActivityId: string
  kebutuhanId: string
  koefisien: number
  hasil: number | null
  satuanHasil: string | null
  hasilAnalisaKebutuhan: number | null
  satuanHasilAnalisaKebutuhan: string | null
  stokHarian: number | null
  terpasang: number | null
  totalSisaStokHariIni: number | null
  createdAt: string
  updatedAt: string

  // Relations
  subActivity: {
    id: string
    name: string
    activity: {
      id: string
      name: string
    }
  }
  kebutuhan: {
    id: string
    nama: string
    kategoriKebutuhan: {
      id: string
      nama: string
    }
  }
  resourceFlowSchedules: ResourceFlowSchedule[]
}

// Resource Flow Schedule types
export interface ResourceFlowSchedule {
  id: string
  analisaKebutuhanId: string
  tanggal: string
  realisasi: number | null
  file: unknown | null
  createdAt: string
  updatedAt: string
}

// Request/Response types
export interface CreateResourceFlowScheduleData {
  analisaKebutuhanId: string
  tanggal: string
  realisasi?: number
  file?: unknown
}

export interface UpdateResourceFlowScheduleData {
  realisasi?: number
  file?: unknown
}

// Response schemas for validation
const AnalisaKebutuhanResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.any()), // Will be properly typed
})

/**
 * Hook to fetch analisa kebutuhan data for a project with sub-activity grouping
 */
export const useResourceFlowData = (projectId: string) => {
  return useQuery({
    queryKey: ['resource-flow', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/resource-flow?projectId=${projectId}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const json = await response.json()
      return AnalisaKebutuhanResponseSchema.parse(json).data as AnalisaKebutuhan[]
    },
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to get activities and sub-activities for dropdown selection
 */
export const useActivitiesForResourceFlow = (projectId: string) => {
  return useQuery({
    queryKey: ['activities-for-resource-flow', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/activities`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const json = await response.json()

      // Transform the data to include analisa_kebutuhan for each sub-activity
      // We need to fetch analisa kebutuhan data and group it by sub-activity
      const activitiesWithAnalisa = await Promise.all(
        json.data.map(async (activity: any) => {
          const subActivitiesWithAnalisa = await Promise.all(
            activity.subActivities.map(async (subActivity: any) => {
              // Fetch analisa kebutuhan for this sub-activity
              const analisaResponse = await fetch(
                `/api/analisa-kebutuhan?subActivityId=${subActivity.id}`
              )
              if (analisaResponse.ok) {
                const analisaData = await analisaResponse.json()
                return {
                  ...subActivity,
                  analisa_kebutuhan: analisaData.data || [],
                }
              }
              return {
                ...subActivity,
                analisa_kebutuhan: [],
              }
            })
          )

          return {
            id: activity.id,
            nama: activity.name, // Map 'name' to 'nama' to match expected interface
            sub_activities: subActivitiesWithAnalisa.map((sa: any) => ({
              id: sa.id,
              nama: sa.name, // Map 'name' to 'nama' to match expected interface
              analisa_kebutuhan: sa.analisa_kebutuhan,
            })),
          }
        })
      )

      return activitiesWithAnalisa
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

/**
 * Hook to create or update resource flow schedule entries
 */
export const useCreateResourceFlowSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateResourceFlowScheduleData) => {
      const response = await fetch('/api/resource-flow/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-flow'] })
    },
  })
}

/**
 * Hook to update resource flow schedule entries
 */
export const useUpdateResourceFlowSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResourceFlowScheduleData }) => {
      const response = await fetch(`/api/resource-flow/schedules?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-flow'] })
    },
  })
}

/**
 * Auto-save hook for resource flow schedule fields
 */
export const useAutoSaveResourceFlowSchedule = (
  scheduleId: string,
  fieldName: keyof UpdateResourceFlowScheduleData
) => {
  const updateSchedule = useUpdateResourceFlowSchedule()

  const saveField = async (value: number) => {
    try {
      const data = { [fieldName]: value } as UpdateResourceFlowScheduleData
      await updateSchedule.mutateAsync({ id: scheduleId, data })
    } catch (error) {
      console.error(`Failed to save ${fieldName}:`, error)
    }
  }

  return {
    saveField,
    isLoading: updateSchedule.isPending,
    error: updateSchedule.error,
  }
}

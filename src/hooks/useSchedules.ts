// Unified Schedule Hooks - For plan, action plan, and realization schedules
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Schedule, 
  ScheduleWithRelations, 
  CreateScheduleSchema, 
  UpdateScheduleSchema,
  BulkScheduleUpdateSchema
} from '@/lib/schemas/schedule'
import { z } from 'zod'

// Query parameters for filtering schedules
interface ScheduleFilters {
  projectId?: string
  subActivityId?: string
  weekNumber?: number
}

// Hook to fetch schedules with optional filters
export function useSchedules(filters: ScheduleFilters = {}) {
  return useQuery({
    queryKey: ['schedules', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const url = `/api/schedules${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as ScheduleWithRelations[]
    },
    staleTime: 30000,
  })
}

// Hook to fetch a specific schedule by ID
export function useSchedule(id: string) {
  return useQuery({
    queryKey: ['schedules', id],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${id}`, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as Schedule
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

// Hook to create a new schedule
export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateScheduleSchema>) => {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create schedule')
      }

      const json = await response.json()
      return json.data as Schedule
    },
    onSuccess: () => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Hook to update a schedule with optimistic updates
export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof UpdateScheduleSchema> }) => {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update schedule')
      }

      const json = await response.json()
      return json.data as Schedule
    },

    // Optimistic update - immediately update cache without waiting for server
    onMutate: async (variables) => {
      const { id, data } = variables

      // Cancel outgoing refetches for schedules
      await queryClient.cancelQueries({ queryKey: ['schedules'] })

      // Snapshot the previous value  
      const previousSchedules = queryClient.getQueryData(['schedules'])

      // Optimistically update specific schedule in all relevant caches
      queryClient.setQueriesData(
        { queryKey: ['schedules'], exact: false },
        (oldData: ScheduleWithRelations[] | undefined) => {
          if (!oldData || !Array.isArray(oldData)) return oldData

          return oldData.map((schedule: ScheduleWithRelations) => {
            if (schedule.id === id) {
              return {
                ...schedule,
                ...data,
                updatedAt: new Date(),
              }
            }
            return schedule
          })
        }
      )

      // Return context for potential rollback
      return { previousSchedules }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['schedules'], context.previousSchedules)
      }
    },

    // Optional: Sync with server occasionally instead of always invalidating
    onSettled: () => {
      // Only invalidate specific schedule queries when needed for server sync
      // queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Hook to upsert a schedule (create or update)
export function useUpsertSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateScheduleSchema>) => {
      const response = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upsert schedule')
      }

      const json = await response.json()
      return json.data as Schedule
    },
    onSuccess: () => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Hook to delete a schedule
export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete schedule')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Hook for bulk schedule operations
export function useBulkUpdateSchedules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof BulkScheduleUpdateSchema>) => {
      const response = await fetch('/api/schedules/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk update schedules')
      }

      const json = await response.json()
      return json.data
    },
    onSuccess: () => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Hook for bulk schedule deletion
export function useBulkDeleteSchedules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subActivityId, weekNumbers }: { subActivityId: string; weekNumbers: number[] }) => {
      const response = await fetch('/api/schedules/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subActivityId, weekNumbers }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk delete schedules')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// Utility hook to get schedules organized by type
export function useSchedulesByType(filters: ScheduleFilters = {}) {
  const { data: schedules, ...rest } = useSchedules(filters)

  const organizedSchedules = schedules?.reduce((acc, schedule) => {
    const key = `${schedule.subActivityId}-${schedule.weekNumber}`
    acc[key] = {
      ...schedule,
      // For backward compatibility with existing components
      planPercentage: schedule.plan,
      actionPlanPercentage: schedule.actionPlan,
      realizationPercentage: schedule.realization,
    }
    return acc
  }, {} as Record<string, Schedule & { planPercentage?: number | null; actionPlanPercentage?: number | null; realizationPercentage?: number | null }>)

  return {
    data: organizedSchedules,
    schedules,
    ...rest
  }
}
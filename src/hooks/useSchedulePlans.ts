// Schedule Plan Hooks - For planned schedules
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SchedulePlanWithRelations, SchedulePlan, CreateSchedulePlanSchema } from '@/lib/schemas'
import { z } from 'zod'

// Query parameters for filtering schedule plans
interface SchedulePlanFilters {
  projectId?: string
  subActivityId?: string
  weekNumber?: number
}

// Hook to fetch schedule plans with optional filters
export function useSchedulePlans(filters: SchedulePlanFilters = {}) {
  return useQuery({
    queryKey: ['schedule-plans', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const url = `/api/schedule-plans${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as SchedulePlanWithRelations[]
    },
    staleTime: 30000,
  })
}

// Hook to create a new schedule plan
export function useCreateSchedulePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateSchedulePlanSchema>) => {
      const response = await fetch('/api/schedule-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create schedule plan')
      }

      const json = await response.json()
      return json.data as SchedulePlan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-plans'] })
    },
  })
}

// Hook to update a schedule plan
export function useUpdateSchedulePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof CreateSchedulePlanSchema>> }) => {
      const response = await fetch(`/api/schedule-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update schedule plan')
      }

      const json = await response.json()
      return json.data as SchedulePlan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-plans'] })
    },
  })
}

// Hook for bulk schedule plan operations
export function useBulkSchedulePlans() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: z.infer<typeof CreateSchedulePlanSchema>[]) => {
      const response = await fetch('/api/schedule-plans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process bulk schedule plans')
      }

      const json = await response.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-plans'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-plans-s-curve'] })
    },
  })
}

// Simplified Action Plan Schedules Hook - Updated for new Prisma schema
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ActionPlanWithRelations,
  CreateActionPlanSchema,
  UpdateActionPlanSchema,
} from '@/lib/schemas/action-plan-schedule'
import { z } from 'zod'

// Query parameters for filtering action plan schedules
interface ActionPlanFilters {
  projectId?: string
  subActivityId?: string
  year?: number
  month?: number
}

// Hook to fetch action plan schedules with optional filters
export function useActionPlans(filters: ActionPlanFilters = {}) {
  return useQuery({
    queryKey: ['action-plan-schedules', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const url = `/api/action-plan-schedules${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as ActionPlanWithRelations[]
    },
    staleTime: 30000, // 30 seconds
  })
}

// Hook to fetch a single action plan schedule
export function useActionPlan(id: string) {
  return useQuery({
    queryKey: ['action-plan-schedule', id],
    queryFn: async () => {
      const response = await fetch(`/api/action-plan-schedules/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as ActionPlanWithRelations
    },
    enabled: !!id,
  })
}

// Hook to create a new action plan schedule
export function useCreateActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateActionPlanSchema>) => {
      const response = await fetch('/api/action-plan-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create action plan schedule')
      }

      const json = await response.json()
      return json.data as ActionPlanWithRelations
    },
    onSuccess: (newSchedule) => {
      // Invalidate and refetch action plan schedules queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })
      
      // Add the new schedule to the cache
      queryClient.setQueryData(['action-plan-schedule', newSchedule.id], newSchedule)

      // Invalidate project-specific queries if available
      if (newSchedule.subActivity?.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-schedules', { projectId: newSchedule.subActivity.activity.projectId }],
        })
      }
    },
  })
}

// Hook to update an action plan schedule
export function useUpdateActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof UpdateActionPlanSchema> }) => {
      const response = await fetch(`/api/action-plan-schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update action plan schedule')
      }

      const json = await response.json()
      return json.data as ActionPlanWithRelations
    },
    onSuccess: (updatedSchedule) => {
      // Update the specific schedule in cache
      queryClient.setQueryData(['action-plan-schedule', updatedSchedule.id], updatedSchedule)
      
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })

      // Invalidate project-specific queries if available
      if (updatedSchedule.subActivity?.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-schedules', { projectId: updatedSchedule.subActivity.activity.projectId }],
        })
      }
    },
  })
}

// Hook to delete an action plan schedule
export function useDeleteActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/action-plan-schedules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete action plan schedule')
      }

      return { id }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['action-plan-schedule', deletedId] })
      
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })
    },
  })
}

// Hook for bulk operations (if needed)
export function useBulkCreateActionPlans() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schedules: z.infer<typeof CreateActionPlanSchema>[]) => {
      const results = []
      
      for (const schedule of schedules) {
        const response = await fetch('/api/action-plan-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule),
        })

        if (response.ok) {
          const json = await response.json()
          results.push(json.data)
        }
      }
      
      return results
    },
    onSuccess: () => {
      // Invalidate all action plan queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })
    },
  })
}

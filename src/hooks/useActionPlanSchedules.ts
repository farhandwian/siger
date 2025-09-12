// React Query hooks for Action Plan Schedules
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ActionPlanSchedule,
  ActionPlanScheduleWithRelations,
  ActionPlanScheduleResponseSchema,
  SingleActionPlanScheduleResponseSchema,
  CreateActionPlanScheduleSchema,
  UpdateActionPlanScheduleSchema,
} from '@/lib/schemas/action-plan-schedule'

// Query parameters for filtering action plan schedules
interface ActionPlanScheduleFilters {
  projectId?: string
  activityId?: string
  subActivityId?: string
  year?: number
  month?: number
}

// Hook to fetch action plan schedules with optional filters
export function useActionPlanSchedules(filters: ActionPlanScheduleFilters = {}) {
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
      return ActionPlanScheduleResponseSchema.parse(json).data
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook to fetch a single action plan schedule by ID
export function useActionPlanSchedule(id: string) {
  return useQuery({
    queryKey: ['action-plan-schedule', id],
    queryFn: async () => {
      const response = await fetch(`/api/action-plan-schedules/${id}`, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return SingleActionPlanScheduleResponseSchema.parse(json).data
    },
    enabled: !!id,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook to create a new action plan schedule
export function useCreateActionPlanSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateActionPlanScheduleSchema>) => {
      const validatedData = CreateActionPlanScheduleSchema.parse(data)

      const response = await fetch('/api/action-plan-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return SingleActionPlanScheduleResponseSchema.parse(json).data
    },
    onSuccess: newSchedule => {
      // Invalidate and refetch action plan schedules queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })

      // Add the new schedule to the cache
      queryClient.setQueryData(['action-plan-schedule', newSchedule.id], newSchedule)

      // If the schedule belongs to a specific project, invalidate project-specific queries
      if (newSchedule.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-schedules', { projectId: newSchedule.activity.projectId }],
        })
      }

      if (newSchedule.subActivity?.activityId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-schedules', { activityId: newSchedule.subActivity.activityId }],
        })
      }
    },
  })
}

// Hook to update an existing action plan schedule
export function useUpdateActionPlanSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: z.infer<typeof UpdateActionPlanScheduleSchema>
    }) => {
      const validatedData = UpdateActionPlanScheduleSchema.parse(data)

      const response = await fetch(`/api/action-plan-schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return SingleActionPlanScheduleResponseSchema.parse(json).data
    },
    onSuccess: (updatedSchedule, { id }) => {
      // Invalidate and refetch action plan schedules queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })

      // Update the specific schedule in the cache
      queryClient.setQueryData(['action-plan-schedule', id], updatedSchedule)

      // If the schedule belongs to a specific project, invalidate project-specific queries
      if (updatedSchedule.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-schedules', { projectId: updatedSchedule.activity.projectId }],
        })
      }

      if (updatedSchedule.subActivity?.activityId) {
        queryClient.invalidateQueries({
          queryKey: [
            'action-plan-schedules',
            { activityId: updatedSchedule.subActivity.activityId },
          ],
        })
      }
    },
  })
}

// Hook to delete an action plan schedule
export function useDeleteActionPlanSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/action-plan-schedules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    },
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch action plan schedules queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })

      // Remove the deleted schedule from the cache
      queryClient.removeQueries({ queryKey: ['action-plan-schedule', deletedId] })
    },
  })
}

// Hook to bulk create action plan schedules
export function useBulkCreateActionPlanSchedules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schedules: z.infer<typeof CreateActionPlanScheduleSchema>[]) => {
      const results = await Promise.allSettled(
        schedules.map(async schedule => {
          const validatedData = CreateActionPlanScheduleSchema.parse(schedule)

          const response = await fetch('/api/action-plan-schedules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }

          const json = await response.json()
          return SingleActionPlanScheduleResponseSchema.parse(json).data
        })
      )

      const successful: ActionPlanScheduleWithRelations[] = []
      const failed: { schedule: z.infer<typeof CreateActionPlanScheduleSchema>; error: string }[] =
        []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value)
        } else {
          failed.push({
            schedule: schedules[index],
            error: result.reason.message || 'Unknown error',
          })
        }
      })

      return { successful, failed }
    },
    onSuccess: () => {
      // Invalidate all action plan schedules queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })
    },
  })
}

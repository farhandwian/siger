// Copy of useActionPlanSchedules.ts with correct hooks
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

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return ActionPlanScheduleResponseSchema.parse(json).data
      } else {
        throw new Error('Expected JSON response but received empty content')
      }
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

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return SingleActionPlanScheduleResponseSchema.parse(json).data
      } else {
        throw new Error('Expected JSON response but received empty content')
      }
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
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()

            // Handle the specific case of duplicate schedule creation
            if (response.status === 409 && errorData.error?.includes('already exists')) {
              throw new Error('DUPLICATE_SCHEDULE')
            }

            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          } catch (jsonError) {
            // If JSON parsing fails, check for specific status codes
            if (response.status === 409) {
              throw new Error('DUPLICATE_SCHEDULE')
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } else {
          // Handle non-JSON error responses
          if (response.status === 409) {
            throw new Error('DUPLICATE_SCHEDULE')
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return SingleActionPlanScheduleResponseSchema.parse(json).data
      } else {
        // If no JSON content, this is unexpected for a create operation
        throw new Error('Expected JSON response but received empty content')
      }
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
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          } catch (jsonError) {
            // If JSON parsing fails, use status text
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return SingleActionPlanScheduleResponseSchema.parse(json).data
      } else {
        // If no JSON content, return a minimal response structure
        // This handles cases where the server returns 204 No Content or similar
        throw new Error('Expected JSON response but received empty content')
      }
    },
    onSuccess: updatedSchedule => {
      // Update the cache with the new data
      queryClient.setQueryData(['action-plan-schedule', updatedSchedule.id], updatedSchedule)

      // Invalidate and refetch action plan schedules queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })

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

// Hook to upsert (create or update) action plan schedule - handles duplicates gracefully
export function useUpsertActionPlanSchedule() {
  const queryClient = useQueryClient()
  const createMutation = useCreateActionPlanSchedule()
  const updateMutation = useUpdateActionPlanSchedule()

  return useMutation({
    mutationFn: async (
      data: z.infer<typeof CreateActionPlanScheduleSchema> & { existingId?: string }
    ) => {
      const { existingId, ...createData } = data

      if (existingId) {
        // Update existing schedule - only pass the fields that can be updated
        const updateData: z.infer<typeof UpdateActionPlanScheduleSchema> = {}
        if (createData.planPercentage !== undefined) {
          updateData.planPercentage = createData.planPercentage
        }
        if (createData.actualPercentage !== undefined) {
          updateData.actualPercentage = createData.actualPercentage
        }

        return updateMutation.mutateAsync({
          id: existingId,
          data: updateData,
        })
      } else {
        // Try to create new schedule
        console.log('Upsert: Attempting to create new schedule', createData)
        try {
          const result = await createMutation.mutateAsync(createData)
          console.log('Upsert: Successfully created new schedule', result)
          return result
        } catch (error) {
          console.log('Upsert: Create failed with error:', error)
          if (error instanceof Error && error.message === 'DUPLICATE_SCHEDULE') {
            // If duplicate, fetch the existing schedule and update it instead
            console.log('Upsert: Duplicate detected, fetching existing schedule to update...')

            // Directly fetch the conflicting schedule from the API
            const queryParams = new URLSearchParams()
            if (createData.activityId) queryParams.append('activityId', createData.activityId)
            if (createData.subActivityId)
              queryParams.append('subActivityId', createData.subActivityId)
            if (createData.year) queryParams.append('year', createData.year.toString())
            if (createData.month) queryParams.append('month', createData.month.toString())

            console.log('Upsert: Fetching with params:', queryParams.toString())
            const response = await fetch(`/api/action-plan-schedules?${queryParams.toString()}`, {
              cache: 'no-store',
            })

            if (!response.ok) {
              console.error('Upsert: Failed to fetch existing schedules', response.status)
              throw error
            }

            // Check if response has JSON content before parsing
            const contentType = response.headers.get('content-type')
            let schedules: any[] = []
            if (contentType && contentType.includes('application/json')) {
              const result = await response.json()
              schedules = result.data || []
              console.log('Upsert: Fetched schedules:', schedules.length)
            } else {
              console.error('Upsert: Expected JSON response but received empty content')
              throw error
            }

            // Find the exact conflicting schedule
            const existingSchedule = schedules.find((s: any) => {
              if (createData.subActivityId) {
                return (
                  s.subActivityId === createData.subActivityId &&
                  s.month === createData.month &&
                  s.week === createData.week &&
                  s.year === createData.year
                )
              } else {
                return (
                  s.activityId === createData.activityId &&
                  s.month === createData.month &&
                  s.week === createData.week &&
                  s.year === createData.year
                )
              }
            })

            if (existingSchedule) {
              // Update the existing schedule with new data
              console.log('Upsert: Found existing schedule, updating:', existingSchedule.id)
              const updateData: z.infer<typeof UpdateActionPlanScheduleSchema> = {}
              if (createData.planPercentage !== undefined) {
                updateData.planPercentage = createData.planPercentage
              }
              if (createData.actualPercentage !== undefined) {
                updateData.actualPercentage = createData.actualPercentage
              }

              const updateResult = await updateMutation.mutateAsync({
                id: existingSchedule.id,
                data: updateData,
              })
              console.log('Upsert: Successfully updated existing schedule', updateResult)
              return updateResult
            } else {
              // If we can't find it even after fresh fetch, throw the original error
              console.error('Upsert: Could not find existing schedule after duplicate detection')
              throw error
            }
          }
          console.log('Upsert: Re-throwing non-duplicate error')
          throw error
        }
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
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          } catch (jsonError) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      // For delete operations, check if there's JSON content to return
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        // For delete operations, it's common to return no content (204)
        return { success: true }
      }
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
            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorData = await response.json()
                throw new Error(
                  errorData.error || `HTTP ${response.status}: ${response.statusText}`
                )
              } catch (jsonError) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
          }

          // Check if response has JSON content before parsing
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const json = await response.json()
            return SingleActionPlanScheduleResponseSchema.parse(json).data
          } else {
            throw new Error('Expected JSON response but received empty content')
          }
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

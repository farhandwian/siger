// Copy of useActionPlans.ts with correct hooks
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ActionPlan,
  ActionPlanWithRelations,
  ActionPlanResponseSchema,
  SingleActionPlanResponseSchema,
  CreateActionPlanSchema,
  UpdateActionPlanSchema,
} from '@/lib/schemas/action-plan-scheduleplan'

// Query parameters for filtering action plan scheduleplans
interface ActionPlanFilters {
  projectId?: string
  activityId?: string
  subActivityId?: string
  year?: number
  month?: number
}

// Hook to fetch action plan scheduleplans with optional filters
export function useActionPlans(filters: ActionPlanFilters = {}) {
  return useQuery({
    queryKey: ['action-plan-scheduleplans', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const url = `/api/action-plan-scheduleplans${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        const result = ActionPlanResponseSchema.parse(json).data
        return result
      } else {
        throw new Error('Expected JSON response but received empty content')
      }
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook to fetch a single action plan scheduleplan by ID
export function useActionPlan(id: string) {
  return useQuery({
    queryKey: ['action-plan-scheduleplan', id],
    queryFn: async () => {
      const response = await fetch(`/api/action-plan-scheduleplans/${id}`, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return SingleActionPlanResponseSchema.parse(json).data
      } else {
        throw new Error('Expected JSON response but received empty content')
      }
    },
    enabled: !!id,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook to create a new action plan scheduleplan
export function useCreateActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateActionPlanSchema>) => {
      const validatedData = CreateActionPlanSchema.parse(data)

      const response = await fetch('/api/action-plan-scheduleplans', {
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

            // Handle the specific case of duplicate scheduleplan creation
            if (response.status === 409 && errorData.error?.includes('already exists')) {
              throw new Error('DUPLICATE_SCHEDULEPLAN')
            }

            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          } catch (jsonError) {
            // If JSON parsing fails, check for specific status codes
            if (response.status === 409) {
              throw new Error('DUPLICATE_SCHEDULEPLAN')
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } else {
          // Handle non-JSON error responses
          if (response.status === 409) {
            throw new Error('DUPLICATE_SCHEDULEPLAN')
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      // Check if response has JSON content before parsing
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return SingleActionPlanResponseSchema.parse(json).data
      } else {
        // If no JSON content, this is unexpected for a create operation
        throw new Error('Expected JSON response but received empty content')
      }
    },
    onSuccess: newSchedulePlan => {
      // Invalidate and refetch action plan scheduleplans queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-scheduleplans'] })

      // Add the new scheduleplan to the cache
      queryClient.setQueryData(['action-plan-scheduleplan', newSchedulePlan.id], newSchedulePlan)

      // If the scheduleplan belongs to a specific project, invalidate project-specific queries
      if (newSchedulePlan.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-scheduleplans', { projectId: newSchedulePlan.activity.projectId }],
        })
      }

      if (newSchedulePlan.subActivity?.activityId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-scheduleplans', { activityId: newSchedulePlan.subActivity.activityId }],
        })
      }
    },
  })
}

// Hook to update an existing action plan scheduleplan
export function useUpdateActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: z.infer<typeof UpdateActionPlanSchema>
    }) => {
      const validatedData = UpdateActionPlanSchema.parse(data)

      const response = await fetch(`/api/action-plan-scheduleplans/${id}`, {
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
        return SingleActionPlanResponseSchema.parse(json).data
      } else {
        // If no JSON content, return a minimal response structure
        // This handles cases where the server returns 204 No Content or similar
        throw new Error('Expected JSON response but received empty content')
      }
    },
    onSuccess: updatedSchedulePlan => {
      // Update the cache with the new data
      queryClient.setQueryData(['action-plan-scheduleplan', updatedSchedulePlan.id], updatedSchedulePlan)

      // Invalidate and refetch action plan scheduleplans queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-scheduleplans'] })

      // If the scheduleplan belongs to a specific project, invalidate project-specific queries
      if (updatedSchedulePlan.activity?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['action-plan-scheduleplans', { projectId: updatedSchedulePlan.activity.projectId }],
        })
      }

      if (updatedSchedulePlan.subActivity?.activityId) {
        queryClient.invalidateQueries({
          queryKey: [
            'action-plan-scheduleplans',
            { activityId: updatedSchedulePlan.subActivity.activityId },
          ],
        })
      }
    },
  })
}

// Hook to upsert (create or update) action plan scheduleplan - handles duplicates gracefully
export function useUpsertActionPlan() {
  const queryClient = useQueryClient()
  const createMutation = useCreateActionPlan()
  const updateMutation = useUpdateActionPlan()

  return useMutation({
    mutationFn: async (
      data: z.infer<typeof CreateActionPlanSchema> & { existingId?: string }
    ) => {
      const { existingId, ...createData } = data

      if (existingId) {
        // Update existing scheduleplan - only pass the fields that can be updated
        const updateData: z.infer<typeof UpdateActionPlanSchema> = {}
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
        // Try to create new scheduleplan
        console.log('Upsert: Attempting to create new scheduleplan', createData)
        try {
          const result = await createMutation.mutateAsync(createData)
          console.log('Upsert: Successfully created new scheduleplan', result)
          return result
        } catch (error) {
          console.log('Upsert: Create failed with error:', error)
          if (error instanceof Error && error.message === 'DUPLICATE_SCHEDULEPLAN') {
            // If duplicate, fetch the existing scheduleplan and update it instead
            console.log('Upsert: Duplicate detected, fetching existing scheduleplan to update...')

            // Directly fetch the conflicting scheduleplan from the API
            const queryParams = new URLSearchParams()
            if (createData.activityId) queryParams.append('activityId', createData.activityId)
            if (createData.subActivityId)
              queryParams.append('subActivityId', createData.subActivityId)
            if (createData.year) queryParams.append('year', createData.year.toString())
            if (createData.month) queryParams.append('month', createData.month.toString())

            console.log('Upsert: Fetching with params:', queryParams.toString())
            const response = await fetch(`/api/action-plan-scheduleplans?${queryParams.toString()}`, {
              cache: 'no-store',
            })

            if (!response.ok) {
              console.error('Upsert: Failed to fetch existing scheduleplans', response.status)
              throw error
            }

            // Check if response has JSON content before parsing
            const contentType = response.headers.get('content-type')
            let scheduleplans: any[] = []
            if (contentType && contentType.includes('application/json')) {
              const result = await response.json()
              scheduleplans = result.data || []
              console.log('Upsert: Fetched scheduleplans:', scheduleplans.length)
            } else {
              console.error('Upsert: Expected JSON response but received empty content')
              throw error
            }

            // Find the exact conflicting scheduleplan
            const existingSchedulePlan = scheduleplans.find((s: any) => {
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

            if (existingSchedulePlan) {
              // Update the existing scheduleplan with new data
              console.log('Upsert: Found existing scheduleplan, updating:', existingSchedulePlan.id)
              const updateData: z.infer<typeof UpdateActionPlanSchema> = {}
              if (createData.planPercentage !== undefined) {
                updateData.planPercentage = createData.planPercentage
              }
              if (createData.actualPercentage !== undefined) {
                updateData.actualPercentage = createData.actualPercentage
              }

              const updateResult = await updateMutation.mutateAsync({
                id: existingSchedulePlan.id,
                data: updateData,
              })
              console.log('Upsert: Successfully updated existing scheduleplan', updateResult)
              return updateResult
            } else {
              // If we can't find it even after fresh fetch, throw the original error
              console.error('Upsert: Could not find existing scheduleplan after duplicate detection')
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

// Hook to delete an action plan scheduleplan
export function useDeleteActionPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/action-plan-scheduleplans/${id}`, {
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
      // Invalidate and refetch action plan scheduleplans queries
      queryClient.invalidateQueries({ queryKey: ['action-plan-scheduleplans'] })

      // Remove the deleted scheduleplan from the cache
      queryClient.removeQueries({ queryKey: ['action-plan-scheduleplan', deletedId] })
    },
  })
}

// Hook to bulk create action plan scheduleplans
export function useBulkCreateActionPlans() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scheduleplans: z.infer<typeof CreateActionPlanSchema>[]) => {
      const results = await Promise.allSettled(
        scheduleplans.map(async scheduleplan => {
          const validatedData = CreateActionPlanSchema.parse(scheduleplan)

          const response = await fetch('/api/action-plan-scheduleplans', {
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
            return SingleActionPlanResponseSchema.parse(json).data
          } else {
            throw new Error('Expected JSON response but received empty content')
          }
        })
      )

      const successful: ActionPlanWithRelations[] = []
      const failed: { scheduleplan: z.infer<typeof CreateActionPlanSchema>; error: string }[] =
        []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value)
        } else {
          failed.push({
            scheduleplan: scheduleplans[index],
            error: result.reason.message || 'Unknown error',
          })
        }
      })

      return { successful, failed }
    },
    onSuccess: () => {
      // Invalidate all action plan scheduleplans queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['action-plan-scheduleplans'] })
    },
  })
}

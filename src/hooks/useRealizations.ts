// Realization Hooks - For realization tracking
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RealizationWithRelations, Realization, CreateRealizationSchema } from '@/lib/schemas'
import { z } from 'zod'

// Query parameters for filtering realizations
interface RealizationFilters {
  projectId?: string
  subActivityId?: string
  weekNumber?: number
}

// Hook to fetch realizations with optional filters
export function useRealizations(filters: RealizationFilters = {}) {
  return useQuery({
    queryKey: ['realizations', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const url = `/api/realizations${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as RealizationWithRelations[]
    },
    staleTime: 30000,
  })
}

// Hook to create a new realization
export function useCreateRealization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof CreateRealizationSchema>) => {
      const response = await fetch('/api/realizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create realization')
      }

      const json = await response.json()
      return json.data as Realization
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realizations'] })
    },
  })
}

// Hook to update a realization
export function useUpdateRealization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof CreateRealizationSchema>> }) => {
      const response = await fetch(`/api/realizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update realization')
      }

      const json = await response.json()
      return json.data as Realization
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realizations'] })
    },
  })
}

// Hook for bulk realization operations
export function useBulkRealizations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: z.infer<typeof CreateRealizationSchema>[]) => {
      const response = await fetch('/api/realizations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process bulk realizations')
      }

      const json = await response.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realizations'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-plans-s-curve'] })
    },
  })
}

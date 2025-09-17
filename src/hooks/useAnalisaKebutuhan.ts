import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AnalisaKebutuhanQuery,
  AnalisaKebutuhanListResponseSchema,
  AnalisaKebutuhanDetailResponseSchema,
  KategoriKebutuhanListResponseSchema,
  KebutuhanListResponseSchema,
  CreateAnalisaKebutuhanRequest,
  UpdateAnalisaKebutuhanRequest,
  AnalisaKebutuhanWithRelations,
  KategoriKebutuhan,
  KebutuhanWithKategori,
} from '@/lib/schemas/analisa-kebutuhan'

// Base HTTP utility function
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Query Keys Factory
export const analisaKebutuhanKeys = {
  all: ['analisa-kebutuhan'] as const,
  lists: () => [...analisaKebutuhanKeys.all, 'list'] as const,
  list: (filters: Partial<AnalisaKebutuhanQuery>) =>
    [...analisaKebutuhanKeys.lists(), filters] as const,
  details: () => [...analisaKebutuhanKeys.all, 'detail'] as const,
  detail: (id: string) => [...analisaKebutuhanKeys.details(), id] as const,
  categories: () => [...analisaKebutuhanKeys.all, 'categories'] as const,
  kebutuhan: () => [...analisaKebutuhanKeys.all, 'kebutuhan'] as const,
  kebutuhanByCategory: (kategoriId?: string) =>
    [...analisaKebutuhanKeys.kebutuhan(), kategoriId] as const,
}

/**
 * Hook to fetch analisa kebutuhan list with filtering and pagination
 */
export function useAnalisaKebutuhanList(query: Partial<AnalisaKebutuhanQuery> = {}) {
  return useQuery({
    queryKey: analisaKebutuhanKeys.list(query),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })

      const url = `/api/analisa-kebutuhan${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetchJSON<unknown>(url)
      return AnalisaKebutuhanListResponseSchema.parse(response)
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch single analisa kebutuhan by ID
 */
export function useAnalisaKebutuhan(id: string) {
  return useQuery({
    queryKey: analisaKebutuhanKeys.detail(id),
    queryFn: async () => {
      const response = await fetchJSON<unknown>(`/api/analisa-kebutuhan/${id}`)
      return AnalisaKebutuhanDetailResponseSchema.parse(response)
    },
    enabled: !!id,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch categories for dropdown selection
 */
export function useKategoriKebutuhanList() {
  return useQuery({
    queryKey: analisaKebutuhanKeys.categories(),
    queryFn: async () => {
      const response = await fetchJSON<unknown>('/api/analisa-kebutuhan/categories')
      return KategoriKebutuhanListResponseSchema.parse(response)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (categories rarely change)
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch kebutuhan items, optionally filtered by category
 */
export function useKebutuhanList(kategoriId?: string) {
  return useQuery({
    queryKey: analisaKebutuhanKeys.kebutuhanByCategory(kategoriId),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (kategoriId) {
        searchParams.append('kategoriId', kategoriId)
      }

      const url = `/api/analisa-kebutuhan/kebutuhan${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetchJSON<unknown>(url)
      return KebutuhanListResponseSchema.parse(response)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to create new analisa kebutuhan entry
 */
export function useCreateAnalisaKebutuhan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAnalisaKebutuhanRequest) => {
      const response = await fetchJSON<unknown>('/api/analisa-kebutuhan', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return AnalisaKebutuhanDetailResponseSchema.parse(response)
    },
    onSuccess: newData => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: analisaKebutuhanKeys.lists() })

      // Add the new item to the cache
      queryClient.setQueryData(analisaKebutuhanKeys.detail(newData.data.id), newData)
    },
    onError: error => {
      console.error('Failed to create analisa kebutuhan:', error)
    },
  })
}

/**
 * Hook to update existing analisa kebutuhan entry
 */
export function useUpdateAnalisaKebutuhan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAnalisaKebutuhanRequest) => {
      const response = await fetchJSON<unknown>(`/api/analisa-kebutuhan/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return AnalisaKebutuhanDetailResponseSchema.parse(response)
    },
    onSuccess: updatedData => {
      const id = updatedData.data.id

      // Update the specific item in cache
      queryClient.setQueryData(analisaKebutuhanKeys.detail(id), updatedData)

      // Invalidate list queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: analisaKebutuhanKeys.lists() })
    },
    onError: error => {
      console.error('Failed to update analisa kebutuhan:', error)
    },
  })
}

/**
 * Hook to delete analisa kebutuhan entry
 */
export function useDeleteAnalisaKebutuhan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchJSON<{ success: boolean; message: string }>(
        `/api/analisa-kebutuhan/${id}`,
        {
          method: 'DELETE',
        }
      )
      return response
    },
    onSuccess: (_, deletedId) => {
      // Remove the item from cache
      queryClient.removeQueries({ queryKey: analisaKebutuhanKeys.detail(deletedId) })

      // Invalidate list queries to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: analisaKebutuhanKeys.lists() })
    },
    onError: error => {
      console.error('Failed to delete analisa kebutuhan:', error)
    },
  })
}

/**
 * Hook for optimistic updates when editing in a modal
 * Provides both optimistic update and rollback functionality
 */
export function useOptimisticAnalisaKebutuhan() {
  const queryClient = useQueryClient()

  const optimisticUpdate = (id: string, updates: Partial<AnalisaKebutuhanWithRelations>) => {
    queryClient.setQueryData(analisaKebutuhanKeys.detail(id), (old: any) => {
      if (!old) return old
      return {
        ...old,
        data: { ...old.data, ...updates },
      }
    })
  }

  const rollbackUpdate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: analisaKebutuhanKeys.detail(id) })
  }

  return { optimisticUpdate, rollbackUpdate }
}

// Export types for components
export type {
  AnalisaKebutuhanWithRelations,
  KategoriKebutuhan,
  KebutuhanWithKategori,
  CreateAnalisaKebutuhanRequest,
  UpdateAnalisaKebutuhanRequest,
  AnalisaKebutuhanQuery,
}

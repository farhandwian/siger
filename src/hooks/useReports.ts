'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WeeklyReportsResponse,
  ReportQuery,
  ProjectOptionsResponse,
  CreateWeeklyReport,
  WeeklyReport,
  ErrorResponse,
} from '@/lib/schemas/reports'

/**
 * Custom hook for fetching weekly reports with pagination and filtering
 */
export function useReports(params: Partial<ReportQuery> = {}) {
  // Set default values for required parameters
  const queryParams: ReportQuery = {
    page: 1,
    limit: 10,
    ...params,
  }
  return useQuery({
    queryKey: ['reports', queryParams],
    queryFn: async (): Promise<WeeklyReportsResponse> => {
      const searchParams = new URLSearchParams()

      // Add all non-undefined parameters to search params
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/reports?${searchParams.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(errorData.error || 'Failed to fetch reports')
      }

      return response.json()
    },
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

/**
 * Custom hook for fetching project options for dropdowns
 */
export function useProjectOptions() {
  return useQuery({
    queryKey: ['projects', 'options'],
    queryFn: async (): Promise<ProjectOptionsResponse> => {
      const response = await fetch('/api/reports/projects', {
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(errorData.error || 'Failed to fetch project options')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

/**
 * Custom hook for creating new weekly reports
 */
export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: CreateWeeklyReport
    ): Promise<{ success: true; data: WeeklyReport }> => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch reports when a new one is created
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

/**
 * Custom hook for downloading report files
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({ reportId, fileName }: { reportId: string; fileName?: string }) => {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        throw new Error(errorData.error || 'Failed to download report')
      }

      // Create blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `report-${reportId}.pdf`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    },
  })
}

/**
 * Custom hook for optimistic search with debouncing
 */
export function useDebouncedReports(
  baseParams: Partial<Omit<ReportQuery, 'search'>>,
  searchTerm: string,
  delay: number = 300
) {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm, delay])

  return useReports({
    ...baseParams,
    search: debouncedSearch,
  })
}

/**
 * Hook for managing report loading states across the application
 */
export function useReportsLoadingState() {
  const queryClient = useQueryClient()

  const isFetching = queryClient.isFetching({ queryKey: ['reports'] }) > 0
  const isLoading = queryClient
    .getQueriesData({ queryKey: ['reports'] })
    .some(([, data]) => data === undefined)

  return {
    isLoading,
    isFetching,
    isIdle: !isLoading && !isFetching,
  }
}

// Import React for hooks that use it
import React from 'react'

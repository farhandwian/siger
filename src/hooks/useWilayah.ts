import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface WilayahItem {
  value: string
  label: string
  level: 'province' | 'regency' | 'district' | 'village'
  type: string
  searchText: string
}

interface WilayahResponse {
  success: boolean
  data: WilayahItem[]
  total: number
}

export function useWilayahSearch(searchQuery: string = '', level: string = 'all') {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return useQuery<WilayahResponse>({
    queryKey: ['wilayah', debouncedQuery, level],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        level,
        limit: '100',
      })

      const response = await fetch(`/api/wilayah?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch wilayah data')
      }
      return response.json()
    },
    enabled: true, // Always enabled, will search all if no query
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
  })
}

// Hook for getting provinces only
export function useProvinces() {
  return useQuery<WilayahResponse>({
    queryKey: ['provinces'],
    queryFn: async () => {
      const response = await fetch('/api/wilayah?level=province&limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch provinces')
      }
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (replaces cacheTime)
  })
}

// Hook for getting regencies by province
export function useRegenciesByProvince(provinceCode: string) {
  return useQuery<WilayahResponse>({
    queryKey: ['regencies', provinceCode],
    queryFn: async () => {
      const response = await fetch(`/api/wilayah?level=regency&q=${provinceCode}`)
      if (!response.ok) {
        throw new Error('Failed to fetch regencies')
      }
      return response.json()
    },
    enabled: !!provinceCode,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (replaces cacheTime)
  })
}

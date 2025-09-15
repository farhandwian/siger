// Optimized S-curve Data Hook
'use client'

import { useQuery } from '@tanstack/react-query'

export interface OptimizedSCurveDataPoint {
  weekNumber: number
  weekLabel: string
  rencana: number
  realisasi: number
  deviation: number
}

export interface OptimizedSCurveResponse {
  projectInfo: {
    id: string
    name: string | null
    tanggalSpmk: string | null
  }
  sCurveData: OptimizedSCurveDataPoint[]
  summary: {
    totalWeeks: number
    finalPlan: number
    finalActual: number
    finalDeviation: number
  }
}

/**
 * Hook for fetching optimized S-curve data
 * This endpoint pre-calculates cumulative values on the server
 * reducing client-side computation and data transfer
 */
export function useOptimizedSCurveData(projectId: string) {
  return useQuery({
    queryKey: ['schedule-plans-s-curve', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-plans/s-curve?projectId=${projectId}`, { 
        cache: 'no-store' 
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json.data as OptimizedSCurveResponse
    },
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

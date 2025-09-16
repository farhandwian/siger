'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'

export interface MonitoringData {
  sCurveData: {
    weeks: number[]
    planned: number[]
    actual: number[]
  }
  aiInsights: Array<{
    id: string
    type: 'milestone' | 'acceleration' | 'delay'
    title: string
    project: string
    timeAgo: string
    description: string
    color: 'green' | 'blue' | 'red'
  }>
  scheduleData: Array<{
    id: string
    name: string
    level: number
    bobot: number
    periods: Record<string, { plan: number; actual: number }>
  }>
}

// Custom hook for real-time monitoring data
export function useMonitoringData() {
  const queryClient = useQueryClient()

  // S-Curve data query
  const sCurveQuery = useQuery({
    queryKey: ['monitoring', 's-curve'],
    queryFn: async () => {
      // Mock S-curve data with real-time variation
      const baseData = {
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        planned: [5, 12, 22, 35, 48, 62, 75, 85, 92, 96, 99, 100],
        actual: [3, 8, 18, 32, 45, 58, 72, 83, 90, 94, 97, 100],
      }

      // Use static data to prevent hydration mismatch
      // Note: Real-time variations are disabled to prevent SSR/client mismatch
      // In production, this would fetch actual data from the API

      return baseData
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  // AI Insights query
  const aiInsightsQuery = useQuery({
    queryKey: ['monitoring', 'ai-insights'],
    queryFn: async () => {
      // Mock AI insights with dynamic timestamps
      const insights = [
        {
          id: '1',
          type: 'milestone' as const,
          title: 'Milestone Tercapai',
          project: 'D.I Kalimireng - Rehabilitasi',
          timeAgo: '10 Menit Lalu',
          description:
            'Target minggu ke-8 berhasil dicapai tepat waktu. Progress fisik saat ini mencapai 83% sesuai dengan rencana.',
          color: 'green' as const,
        },
        {
          id: '2',
          type: 'acceleration' as const,
          title: 'Akselerasi Progress Terdeteksi',
          project: 'D.I Rawa Mesuji - Rehabilitasi',
          timeAgo: '12 Menit Lalu',
          description:
            'Rata-rata progress proyek meningkat 15% dalam 2 minggu terakhir. Tren positif ini kemungkinan karena cuaca yang mendukung.',
          color: 'blue' as const,
        },
        {
          id: '3',
          type: 'delay' as const,
          title: 'Prediksi keterlambatan',
          project: 'D.I DIR Rawa Jitu - Pembangunan',
          timeAgo: '18 Menit Lalu',
          description:
            'Belum ada mobilisasi alat berat. Potensi keterlambatan pada kegiatan galian tanah.',
          color: 'red' as const,
        },
        {
          id: '4',
          type: 'delay' as const,
          title: 'Prediksi keterlambatan',
          project: 'D.I Gilingeng - Pembangunan',
          timeAgo: '25 Menit Lalu',
          description:
            'Rata-rata progress proyek meningkat 15% dalam 2 minggu terakhir. Tren positif ini kemungkinan karena cuaca yang mendukung dan peningkatan alokasi SDM.',
          color: 'red' as const,
        },
      ]

      return insights
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  // Manual refresh function
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['monitoring'] })
  }, [queryClient])

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5000)
    return () => clearInterval(interval)
  }, [refreshAllData])

  return {
    sCurve: sCurveQuery,
    aiInsights: aiInsightsQuery,
    refreshAll: refreshAllData,
    isLoading: sCurveQuery.isLoading || aiInsightsQuery.isLoading,
    isError: sCurveQuery.isError || aiInsightsQuery.isError,
  }
}

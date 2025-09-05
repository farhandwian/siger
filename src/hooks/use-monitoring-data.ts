'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'

export interface MonitoringData {
  progress: {
    current: number
    total: number
    deviation: number
    addendumCount: number
    lastUpdated: string
  }
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

  // Progress data query
  const progressQuery = useQuery({
    queryKey: ['monitoring', 'progress'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/progress')
      if (!response.ok) throw new Error('Failed to fetch progress data')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 5000, // 5 seconds
    staleTime: 0,
    gcTime: 30000, // Keep in cache for 30 seconds
  })

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

      // Add meaningful variations based on current time to simulate real progress
      const currentTime = Date.now()
      const timeBasedVariation = Math.sin(currentTime / 5000) * 3 // ±3% variation over time
      const randomVariation = (Math.random() - 0.5) * 4 // ±2% random variation

      // Apply variations to both planned and actual values
      baseData.actual = baseData.actual.map((value, index) => {
        if (index >= 7) {
          // Only vary the last 5 weeks to show recent changes
          const variation = timeBasedVariation + randomVariation
          return Math.max(0, Math.min(100, value + variation))
        }
        return value
      })

      // Add movement to planned values as well (simulate plan adjustments)
      const plannedTimeVariation = Math.sin(currentTime / 7000) * 2 // ±2% variation for planned
      const plannedRandomVariation = (Math.random() - 0.5) * 2 // ±1% random variation

      baseData.planned = baseData.planned.map((value, index) => {
        if (index >= 8) {
          // Only vary the last 4 weeks for planned values
          const variation = plannedTimeVariation + plannedRandomVariation
          return Math.max(0, Math.min(100, value + variation))
        }
        return value
      })

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
          title: 'Milestone Achievement',
          project: 'D.I Rawa Mesuji - Rehabilitasi',
          timeAgo: `${Math.floor(Math.random() * 10) + 1} Menit Lalu`,
          description:
            'Proyek Peningkatan jaringan Tersier Kab P berhasil menyelesaikan kegiatan penggalian tanah 2 minggu lebih cepat dari jadwal.',
          color: 'green' as const,
        },
        {
          id: '2',
          type: 'acceleration' as const,
          title: 'Akselerasi Progress Terdeteksi',
          project: 'D.I Rawa Mesuji - Rehabilitasi',
          timeAgo: `${Math.floor(Math.random() * 15) + 5} Menit Lalu`,
          description:
            'Rata-rata progress proyek meningkat 15% dalam 2 minggu terakhir. Tren positif ini kemungkinan karena cuaca yang mendukung.',
          color: 'blue' as const,
        },
        {
          id: '3',
          type: 'delay' as const,
          title: 'Prediksi keterlambatan',
          project: 'D.I DIR Rawa Jitu - Pembangunan',
          timeAgo: `${Math.floor(Math.random() * 20) + 10} Menit Lalu`,
          description:
            'Belum ada mobilisasi alat berat. Potensi keterlambatan pada kegiatan galian tanah.',
          color: 'red' as const,
        },
        {
          id: '4',
          type: 'delay' as const,
          title: 'Prediksi keterlambatan',
          project: 'D.I Gilingeng - Pembangunan',
          timeAgo: `${Math.floor(Math.random() * 30) + 15} Menit Lalu`,
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
    progress: progressQuery,
    sCurve: sCurveQuery,
    aiInsights: aiInsightsQuery,
    refreshAll: refreshAllData,
    isLoading: progressQuery.isLoading || sCurveQuery.isLoading || aiInsightsQuery.isLoading,
    isError: progressQuery.isError || sCurveQuery.isError || aiInsightsQuery.isError,
  }
}

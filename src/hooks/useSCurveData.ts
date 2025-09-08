'use client'

import { useMemo } from 'react'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import { calculateCumulativeData } from '@/lib/cumulativeCalculations'
import { generateMonthsFromContract } from '@/utils/dateUtils'

export interface SCurveDataPoint {
  weekNumber: number
  weekLabel: string
  month: number
  week: number
  rencana: number
  realisasi: number
  deviation: number
}

/**
 * Hook to provide S-curve data based on real activity schedules
 */
export function useSCurveData(projectId: string) {
  const { data: activities, isLoading: activitiesLoading } = useActivities(projectId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const sCurveData = useMemo(() => {
    if (!activities || !project || activitiesLoading || projectLoading) {
      return []
    }

    const currentYear = new Date().getFullYear()
    const months = generateMonthsFromContract(
      project.tanggalKontrak || null,
      project.akhirKontrak || null
    )

    // Calculate cumulative data
    const cumulativeData = calculateCumulativeData(activities, months, currentYear)

    // Transform to S-curve format
    const sCurvePoints: SCurveDataPoint[] = []
    let weekCounter = 1

    for (const weekData of cumulativeData) {
      sCurvePoints.push({
        weekNumber: weekCounter,
        weekLabel: `Minggu ${weekCounter}`,
        month: weekData.month,
        week: weekData.week,
        rencana: weekData.cumulativePlan,
        realisasi: weekData.cumulativeActual,
        deviation: weekData.cumulativeDeviation,
      })
      weekCounter++
    }

    return sCurvePoints
  }, [activities, project, activitiesLoading, projectLoading])

  return {
    data: sCurveData,
    isLoading: activitiesLoading || projectLoading,
    isEmpty: sCurveData.length === 0,
  }
}

'use client'

import { useMemo } from 'react'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import { calculateCumulativeData } from '@/lib/cumulativeCalculations'
import { generateMonthsFromContract } from '@/utils/dateUtils'

export interface RealMonitoringData {
  current: number
  total: number
  deviation: number
  addendumCount: number
  lastUpdated: string
  weeksPassed: number
  totalWeeks: number
  scheduleProgress: number // Percentage of timeline passed
}

/**
 * Hook to provide real monitoring metrics based on actual activity schedules
 */
export function useRealMonitoringData(projectId: string) {
  const { data: activities, isLoading: activitiesLoading } = useActivities(projectId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const monitoringData = useMemo((): RealMonitoringData | null => {
    if (!activities || !project || activitiesLoading || projectLoading) {
      return null
    }

    const currentYear = new Date().getFullYear()
    const months = generateMonthsFromContract(
      project.tanggalKontrak || null,
      project.akhirKontrak || null
    )

    // Calculate cumulative data
    const cumulativeData = calculateCumulativeData(activities, months, currentYear)

    if (cumulativeData.length === 0) {
      return {
        current: 0,
        total: 100,
        deviation: 0,
        addendumCount: 0,
        lastUpdated: new Date().toLocaleString('id-ID'),
        weeksPassed: 0,
        totalWeeks: 0,
        scheduleProgress: 0,
      }
    }

    // Get the latest week's cumulative data
    const latestWeek = cumulativeData[cumulativeData.length - 1]

    // For total, we can use the final planned cumulative value or default to 100
    const totalPlanned = cumulativeData[cumulativeData.length - 1]?.cumulativePlan || 100

    // Current progress is the latest actual cumulative value
    const currentProgress = latestWeek.cumulativeActual

    // Deviation is the difference between planned and actual
    const deviation = latestWeek.cumulativeDeviation

    // Deviation percentage is the direct difference in percentage points
    // (not a percentage of the planned value)
    const deviationPercentage = deviation

    // Calculate schedule progress (how much of the timeline has passed)
    const totalWeeks = cumulativeData.length
    const currentWeek = new Date()
    const contractStart = project.tanggalKontrak ? new Date(project.tanggalKontrak) : new Date()
    const weeksPassed = Math.max(
      0,
      Math.floor((currentWeek.getTime() - contractStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    )
    const scheduleProgress = totalWeeks > 0 ? Math.min((weeksPassed / totalWeeks) * 100, 100) : 0

    return {
      current: currentProgress,
      total: totalPlanned,
      deviation: Number(deviationPercentage.toFixed(1)),
      addendumCount: 0, // This would need to come from project data or separate tracking
      lastUpdated: new Date().toLocaleString('id-ID'),
      weeksPassed: Math.min(weeksPassed, totalWeeks),
      totalWeeks,
      scheduleProgress: Number(scheduleProgress.toFixed(1)),
    }
  }, [activities, project, activitiesLoading, projectLoading])

  return {
    data: monitoringData,
    isLoading: activitiesLoading || projectLoading,
    isEmpty: !monitoringData,
  }
}

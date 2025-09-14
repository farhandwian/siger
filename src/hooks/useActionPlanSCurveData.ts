'use client'

import { useMemo } from 'react'
import { useProject } from '@/hooks/useActivityQueries'
import { useActionPlanSchedules } from '@/hooks/useActionPlanSchedules'
import { generateSequentialWeeks } from '@/utils/dateUtils'

export interface ActionPlanSCurveDataPoint {
  weekNumber: number
  weekLabel: string
  month: number
  week: number
  rencana: number
  realisasi: number
  deviation: number
}

/**
 * Hook to provide S-curve data based on action plan schedules
 */
export function useActionPlanSCurveData(projectId: string) {
  const { data: actionPlanSchedules, isLoading: schedulesLoading } = useActionPlanSchedules({
    projectId,
  })
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const sCurveData = useMemo(() => {
    if (!actionPlanSchedules || !project || schedulesLoading || projectLoading) {
      return []
    }

    if (!project.tanggalSpmk) {
      return []
    }

    const currentYear = new Date().getFullYear()

    // Generate sequential weeks based on project SPMK date
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)

    // Transform to S-curve format with cumulative calculations
    const sCurvePoints: ActionPlanSCurveDataPoint[] = []
    let cumulativePlan = 0
    let cumulativeActual = 0

    for (let weekIndex = 0; weekIndex < sequentialWeeks.length; weekIndex++) {
      const sequentialWeek = sequentialWeeks[weekIndex]
      const weekNumber = weekIndex + 1

      // Find all action plan schedules for this week
      const weekSchedules = actionPlanSchedules.filter(
        schedule =>
          schedule.month === sequentialWeek.month &&
          schedule.week === sequentialWeek.weekInMonth &&
          schedule.year === currentYear
      )

      // Calculate total plan and actual for this week
      const weekPlan = weekSchedules.reduce(
        (sum, schedule) => sum + (schedule.planPercentage || 0),
        0
      )
      const weekActual = weekSchedules.reduce(
        (sum, schedule) => sum + (schedule.actualPercentage || 0),
        0
      )

      // Add to cumulative totals
      cumulativePlan += weekPlan
      cumulativeActual += weekActual

      const deviation = cumulativeActual - cumulativePlan

      sCurvePoints.push({
        weekNumber,
        weekLabel: `Minggu ${weekNumber}`,
        month: sequentialWeek.month,
        week: sequentialWeek.weekInMonth,
        rencana: cumulativePlan,
        realisasi: cumulativeActual,
        deviation: deviation,
      })
    }

    return sCurvePoints
  }, [actionPlanSchedules, project, schedulesLoading, projectLoading])

  return {
    data: sCurveData,
    isLoading: schedulesLoading || projectLoading,
    isEmpty: sCurveData.length === 0,
  }
}

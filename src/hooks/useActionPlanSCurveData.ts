'use client'

import { useMemo } from 'react'
import { useProject } from '@/hooks/useActivityQueries'
import { useSchedulePlans } from '@/hooks/useSchedulePlans'
import { useRealizations } from '@/hooks/useRealizations'
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
  const { data: schedulePlans, isLoading: schedulePlansLoading } = useSchedulePlans({
    projectId,
  })
  const { data: realizations, isLoading: realizationsLoading } = useRealizations({
    projectId,
  })
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const sCurveData = useMemo(() => {
    if (!schedulePlans || !realizations || !project || schedulePlansLoading || realizationsLoading || projectLoading) {
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

      // Find all schedule plans and realizations for this week
      const weekSchedulePlans = schedulePlans.filter(
        (plan) =>
          plan.month === sequentialWeek.month &&
          plan.week === sequentialWeek.weekInMonth &&
          plan.year === currentYear
      )
      
      const weekRealizations = realizations.filter(
        (realization) =>
          realization.month === sequentialWeek.month &&
          realization.week === sequentialWeek.weekInMonth &&
          realization.year === currentYear
      )

      // Calculate total plan and actual for this week
      const weekPlan = weekSchedulePlans.reduce(
        (sum, plan) => sum + (plan.percentage || 0),
        0
      )
      const weekActual = weekRealizations.reduce(
        (sum, realization) => sum + (realization.percentage || 0),
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
  }, [schedulePlans, realizations, project, schedulePlansLoading, realizationsLoading, projectLoading])

  return {
    data: sCurveData,
    isLoading: schedulePlansLoading || realizationsLoading || projectLoading,
    isEmpty: sCurveData.length === 0,
  }
}

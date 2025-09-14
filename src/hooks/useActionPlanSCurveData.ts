'use client'

import { useMemo } from 'react'
import { useProject } from '@/hooks/useActivityQueries'
import { useActionPlans } from '@/hooks/useActionPlans'
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
 * Hook to provide S-curve data based on action plan scheduleplans
 */
export function useActionPlanSCurveData(projectId: string) {
  const { data: actionPlans, isLoading: scheduleplansLoading } = useActionPlans({
    projectId,
  })
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const sCurveData = useMemo(() => {
    if (!actionPlans || !project || scheduleplansLoading || projectLoading) {
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

      // Find all action plan scheduleplans for this week
      const weekSchedulePlans = actionPlans.filter(
        scheduleplan =>
          scheduleplan.month === sequentialWeek.month &&
          scheduleplan.week === sequentialWeek.weekInMonth &&
          scheduleplan.year === currentYear
      )

      // Calculate total plan and actual for this week
      const weekPlan = weekSchedulePlans.reduce(
        (sum, scheduleplan) => sum + (scheduleplan.planPercentage || 0),
        0
      )
      const weekActual = weekSchedulePlans.reduce(
        (sum, scheduleplan) => sum + (scheduleplan.actualPercentage || 0),
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
  }, [actionPlans, project, scheduleplansLoading, projectLoading])

  return {
    data: sCurveData,
    isLoading: scheduleplansLoading || projectLoading,
    isEmpty: sCurveData.length === 0,
  }
}

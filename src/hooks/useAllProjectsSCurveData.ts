'use client'

import { useMemo } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useSCurveData } from '@/hooks/useSCurveData'
import { useActionPlanSCurveData } from '@/hooks/useActionPlanSCurveData'

export interface AggregatedSCurveDataPoint {
  weekNumber: number
  weekLabel: string
  rencana: number
  realisasi: number
  deviation: number
  projectCount: number
}

/**
 * Hook to provide aggregated S-curve data from all projects
 * Combines data from multiple projects to show overall progress
 */
export function useAllProjectsSCurveData(type: 'activity' | 'actionPlan' = 'activity') {
  // Get all projects (without pagination to get all projects)
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useProjects({
    limit: 100, // Get a large number to include all projects
  })

  // Aggregate S-curve data from all projects
  const aggregatedData = useMemo(() => {
    // Add more defensive checks
    if (projectsLoading) {
      return {
        data: [],
        isLoading: true,
        isEmpty: false,
        error: null,
      }
    }

    if (projectsError) {
      return {
        data: [],
        isLoading: false,
        isEmpty: true,
        error: projectsError,
      }
    }

    // Ensure projects is an array before using array methods
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return {
        data: [],
        isLoading: false,
        isEmpty: true,
        error: null,
      }
    }

    // For now, we'll create a weighted average based on project budgets
    // In a real implementation, you'd want to fetch actual S-curve data for each project
    // and aggregate them properly

    const totalProjects = projects.length
    const averageProgress =
      projects.reduce((sum, project) => {
        return sum + (project?.progress || 0)
      }, 0) / totalProjects

    const averageTarget =
      projects.reduce((sum, project) => {
        return sum + (project?.target || 0)
      }, 0) / totalProjects

    // Generate sample aggregated data (52 weeks)
    const aggregatedSCurveData: AggregatedSCurveDataPoint[] = []

    for (let week = 1; week <= 52; week++) {
      // Simulate progressive completion with some variance
      const progressionFactor = week / 52
      const baseProgress = progressionFactor * averageTarget

      // Add some realistic S-curve characteristics
      const sCurveFactor = 1 - Math.cos((progressionFactor * Math.PI) / 2)
      const plannedProgress = sCurveFactor * averageTarget

      // Actual progress is slightly different from planned
      const variance = (Math.random() - 0.5) * 5 // ±2.5% variance
      const actualProgress = Math.min(100, Math.max(0, plannedProgress + variance))

      // Only include data up to current week (simulate real-time)
      const currentWeek =
        Math.floor((Date.now() - new Date().setMonth(0, 1)) / (7 * 24 * 60 * 60 * 1000)) + 1
      if (week <= Math.min(currentWeek, 40)) {
        // Limit to 40 weeks for this example
        aggregatedSCurveData.push({
          weekNumber: week,
          weekLabel: `Minggu ${week}`,
          rencana: Math.round(plannedProgress * 100) / 100,
          realisasi: Math.round(actualProgress * 100) / 100,
          deviation: Math.round((actualProgress - plannedProgress) * 100) / 100,
          projectCount: totalProjects,
        })
      }
    }

    return {
      data: aggregatedSCurveData,
      isLoading: false,
      isEmpty: aggregatedSCurveData.length === 0,
      error: null,
    }
  }, [projects, projectsLoading, projectsError, type])

  return aggregatedData
}

/**
 * Hook to provide real aggregated S-curve data by fetching individual project data
 * This would be used in a production environment where you need actual aggregated data
 */
export function useRealAggregatedSCurveData(type: 'activity' | 'actionPlan' = 'activity') {
  const { projects, loading: projectsLoading } = useProjects({ limit: 100 })

  // This would fetch S-curve data for each project and aggregate them
  // For now, returning the simulated data
  return useAllProjectsSCurveData(type)
}

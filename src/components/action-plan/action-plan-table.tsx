'use client'

import React from 'react'
import { UnifiedScheduleTable } from '@/components/shared/UnifiedScheduleTable'
import { useActivitiesWithSchedules, useProject } from '@/hooks/useActivityQueries'
import { CalculatedData } from '@/hooks/useCalculatedData'

interface ActionPlanTableProps {
  projectId: string
  calculatedData: CalculatedData
}

export function ActionPlanTable({ 
  projectId,
  calculatedData
}: ActionPlanTableProps) {
  const { data: activities, isLoading } = useActivitiesWithSchedules(projectId)
  const { data: project } = useProject(projectId)

  // Use the calculated data passed from parent component
  const { getCalculatedValueForWeek } = calculatedData

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <UnifiedScheduleTable
        projectId={projectId}
        title="Action Plan Schedule"
        activities={activities}
        isActionPlanTable={true}
        project={project}
        isLoading={isLoading}
        getCalculatedValueForWeek={getCalculatedValueForWeek}
      />
    </div>
  )
}

'use client'

import React from 'react'
import { UnifiedScheduleTable } from '@/components/shared/UnifiedScheduleTable'
import { useActivitiesWithSchedules, useProject } from '@/hooks/useActivityQueries'
import { CalculatedData } from '@/hooks/useCalculatedData'

interface ScheduleTableProps {
  projectId: string
  calculatedData: CalculatedData
}

export function ScheduleTable({ 
  projectId,
  calculatedData
}: ScheduleTableProps) {
  const { data: activities, isLoading } = useActivitiesWithSchedules(projectId)
  const { data: project } = useProject(projectId)

  // Use the calculated data passed from parent component
  const { getCalculatedValueForWeek } = calculatedData

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <UnifiedScheduleTable
        projectId={projectId}
        title="Activity Schedule"
        activities={activities}
        project={project}
        isLoading={isLoading}
        isActionPlanTable={false}
        getCalculatedValueForWeek={getCalculatedValueForWeek}
        showAddButton={true}
        showTitle={false}
      />
    </div>
  )
}

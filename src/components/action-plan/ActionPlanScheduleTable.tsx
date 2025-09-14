'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { EditActivityModal } from '@/components/activities/edit-activity-modal'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import {
  useActionPlanSchedules,
  useUpdateActionPlanSchedule,
  useCreateActionPlanSchedule,
} from '@/hooks/useActionPlanSchedules'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateSequentialWeeks, type SequentialWeek } from '@/utils/dateUtils'
import { calculateCumulativeData, getCumulativeValue } from '@/lib/cumulativeCalculations'
import type { Activity } from '@/lib/schemas'

interface ActionPlanScheduleTableProps {
  projectId: string
}

export function ActionPlanScheduleTable({ projectId }: ActionPlanScheduleTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const customScrollbarRef = useRef<HTMLDivElement>(null)
  const topScrollbarRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [clientWidth, setClientWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0)

  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const { data: actionPlanSchedules } = useActionPlanSchedules({ projectId })
  const updateActionPlanMutation = useUpdateActionPlanSchedule()
  const createActionPlanMutation = useCreateActionPlanSchedule()

  // Generate sequential weeks based on project dates
  const currentYear = new Date().getFullYear()
  const sequentialWeeks: SequentialWeek[] = project
    ? generateSequentialWeeks(project.tanggalSpmk, 30) // 30 weeks default
    : []

  // Custom scrollbar implementation (same as ActivityScheduleTable)
  const updateScrollbar = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      setScrollLeft(container.scrollLeft)
      setScrollWidth(container.scrollWidth)
      setClientWidth(container.clientWidth)
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollbar)
      window.addEventListener('resize', updateScrollbar)
      updateScrollbar()

      return () => {
        container.removeEventListener('scroll', updateScrollbar)
        window.removeEventListener('resize', updateScrollbar)
      }
    }
  }, [updateScrollbar])

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>, isTop: boolean) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScrollLeft(scrollLeft)
  }

  const handleTopThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleThumbMouseDown(e, true)
  }

  const handleBottomThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleThumbMouseDown(e, false)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && scrollContainerRef.current) {
        const scrollbarRef = customScrollbarRef.current || topScrollbarRef.current
        if (scrollbarRef) {
          const deltaX = e.clientX - dragStartX
          const scrollbarRect = scrollbarRef.getBoundingClientRect()
          const scrollbarWidth = scrollbarRect.width
          const maxScrollLeft = scrollWidth - clientWidth
          const deltaScrollLeft = (deltaX / scrollbarWidth) * maxScrollLeft
          const newScrollLeft = Math.min(
            Math.max(dragStartScrollLeft + deltaScrollLeft, 0),
            maxScrollLeft
          )

          scrollContainerRef.current.scrollLeft = newScrollLeft
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragStartX, dragStartScrollLeft, scrollWidth, clientWidth])

  const thumbWidth = Math.max((clientWidth / scrollWidth) * 100, 10) // Minimum 10% width
  const thumbPosition = (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidth)
  const showCustomScrollbar = scrollWidth > clientWidth

  // Get action plan schedule value for specific activity/subactivity and week
  const getActionPlanScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!actionPlanSchedules || !sequentialWeeks[weekNumber - 1]) return null

    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    const schedule = actionPlanSchedules.find(s => {
      if (subActivityId) {
        return (
          s.subActivityId === subActivityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      } else {
        return (
          s.activityId === activityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      }
    })

    const value = type === 'plan' ? schedule?.planPercentage : schedule?.actualPercentage
    return value !== undefined ? value : null
  }

  const handleCellEdit = (cellId: string, currentValue: number | null) => {
    setEditingCell(cellId)
    setEditValue(currentValue !== null ? currentValue.toString() : '')
  }

  const handleCellSave = async (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ) => {
    const numericValue = editValue === '' ? null : parseFloat(editValue)
    const value = !isNaN(numericValue!) ? numericValue : null

    console.log('Action Plan - Saving cell:', {
      activityId,
      subActivityId,
      weekNumber,
      type,
      value,
    })

    if (!sequentialWeeks[weekNumber - 1]) {
      console.error('Invalid week number:', weekNumber)
      return
    }

    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    // Find existing action plan schedule
    const existingSchedule = actionPlanSchedules?.find(s => {
      if (subActivityId) {
        return (
          s.subActivityId === subActivityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      } else {
        return (
          s.activityId === activityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      }
    })

    try {
      if (existingSchedule) {
        // Update existing schedule
        console.log('Action Plan - Updating existing schedule:', existingSchedule.id)
        await updateActionPlanMutation.mutateAsync({
          id: existingSchedule.id,
          data: {
            [type === 'plan' ? 'planPercentage' : 'actualPercentage']: value,
          },
        })
      } else {
        // Create new schedule
        console.log('Action Plan - Creating new schedule')
        await createActionPlanMutation.mutateAsync({
          activityId: subActivityId ? null : activityId,
          subActivityId: subActivityId || null,
          month,
          year: currentYear,
          week,
          planPercentage: type === 'plan' ? value || 0 : 0,
          actualPercentage: type === 'actual' ? value || 0 : 0,
        })
      }

      console.log('Action Plan - Save completed successfully')
      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Action Plan - Error saving:', error)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsEditModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-48 rounded bg-gray-200"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with Add Activity button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Action Plan Schedule</h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#ffc928] text-[#364878] hover:bg-[#ffc928]/90"
        >
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Top Custom Scrollbar */}
      {showCustomScrollbar && (
        <div className="relative h-4 w-full rounded bg-gray-200" ref={topScrollbarRef}>
          <div
            className="absolute top-0 h-full cursor-grab rounded bg-gray-400 active:cursor-grabbing"
            style={{
              left: `${thumbPosition}%`,
              width: `${thumbWidth}%`,
            }}
            onMouseDown={handleTopThumbMouseDown}
          />
        </div>
      )}

      {/* Main table container */}
      <div className="activity-schedule-table-container">
        <div className="table-wrapper" ref={scrollContainerRef}>
          <table className="activity-schedule-table">
            <thead>
              <tr>
                <th className="activity-name-header">Activity Name</th>
                <th className="activity-weight-header">Weight</th>
                {sequentialWeeks.map((week, index) => (
                  <th key={index} className="week-header">
                    <div className="week-header-content">
                      <div className="week-number">W{week.weekNumber}</div>
                      <div className="week-date">
                        {week.startDate.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities?.map(activity => (
                <React.Fragment key={activity.id}>
                  {/* Main Activity Row */}
                  <tr className="activity-row border-b border-gray-200">
                    <td
                      className="activity-name-cell cursor-pointer hover:bg-gray-50"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="activity-name">{activity.name}</div>
                    </td>
                    <td className="activity-weight-cell">-</td>
                    {sequentialWeeks.map((week, weekIndex) => (
                      <td
                        key={`${activity.id}-W${week.weekNumber}`}
                        className="progress-cell-blocked"
                      >
                        {/* Main activity cells are blocked/empty */}
                      </td>
                    ))}
                  </tr>

                  {/* Sub Activities - Each has 2 rows */}
                  {activity.subActivities?.map(subActivity => (
                    <React.Fragment key={subActivity.id}>
                      {/* First Row - Plan values (Blue background #BFDBFE) */}
                      <tr className="border-b border-gray-200">
                        <td rowSpan={2} className="sub-activity-name-cell">
                          <div className="sub-activity-name">{subActivity.name}</div>
                        </td>
                        <td rowSpan={2} className="sub-activity-weight-cell">
                          {subActivity.weight}
                        </td>
                        {sequentialWeeks.map((week, weekIndex) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-plan`
                          const value = getActionPlanScheduleValue(
                            activity.id,
                            subActivity.id,
                            week.weekNumber,
                            'plan'
                          )
                          const isEditing = editingCell === cellId

                          return (
                            <td
                              key={cellId}
                              className={`progress-cell-plan ${value && value > 0 ? 'has-value' : ''}`}
                            >
                              {isEditing ? (
                                <Input
                                  value={editValue}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditValue(e.target.value)
                                  }
                                  onBlur={() =>
                                    handleCellSave(
                                      activity.id,
                                      subActivity.id,
                                      week.weekNumber,
                                      'plan'
                                    )
                                  }
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleCellSave(
                                        activity.id,
                                        subActivity.id,
                                        week.weekNumber,
                                        'plan'
                                      )
                                    } else if (e.key === 'Escape') {
                                      handleCellCancel()
                                    }
                                  }}
                                  className="progress-value-input"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="progress-value-display"
                                  onClick={() => handleCellEdit(cellId, value)}
                                >
                                  {value !== null && value !== undefined
                                    ? value === 0
                                      ? '-'
                                      : value.toFixed(3)
                                    : '-'}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Second Row - Actual values (Yellow background #FFC928) */}
                      <tr className="border-b border-gray-200">
                        {/* Name and weight cells are merged with rowspan above */}
                        {sequentialWeeks.map((week, weekIndex) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-actual`
                          const value = getActionPlanScheduleValue(
                            activity.id,
                            subActivity.id,
                            week.weekNumber,
                            'actual'
                          )
                          const isEditing = editingCell === cellId

                          return (
                            <td
                              key={cellId}
                              className={`progress-cell-actual ${value && value > 0 ? 'has-value' : ''}`}
                            >
                              {isEditing ? (
                                <Input
                                  value={editValue}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditValue(e.target.value)
                                  }
                                  onBlur={() =>
                                    handleCellSave(
                                      activity.id,
                                      subActivity.id,
                                      week.weekNumber,
                                      'actual'
                                    )
                                  }
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleCellSave(
                                        activity.id,
                                        subActivity.id,
                                        week.weekNumber,
                                        'actual'
                                      )
                                    } else if (e.key === 'Escape') {
                                      handleCellCancel()
                                    }
                                  }}
                                  className="progress-value-input"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="progress-value-display"
                                  onClick={() => handleCellEdit(cellId, value)}
                                >
                                  {value !== null && value !== undefined
                                    ? value === 0
                                      ? '-'
                                      : value.toFixed(3)
                                    : '-'}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Custom Scrollbar */}
      {showCustomScrollbar && (
        <div className="relative h-4 w-full rounded bg-gray-200" ref={customScrollbarRef}>
          <div
            className="absolute top-0 h-full cursor-grab rounded bg-gray-400 active:cursor-grabbing"
            style={{
              left: `${thumbPosition}%`,
              width: `${thumbWidth}%`,
            }}
            onMouseDown={handleBottomThumbMouseDown}
          />
        </div>
      )}

      {/* Modals */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
      />

      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        activity={selectedActivity}
        projectId={projectId}
      />

      <style jsx>{`
        .activity-schedule-table-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .table-wrapper {
          overflow-x: auto;
          overflow-y: visible;
          max-height: none;
        }

        .activity-schedule-table {
          width: auto;
          min-width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: auto;
        }

        .activity-schedule-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
        }

        .activity-name-header,
        .activity-weight-header {
          position: sticky;
          left: 0;
          z-index: 11;
          background: #f8fafc;
          border-right: 1px solid #e5e7eb;
          border-bottom: 2px solid #e5e7eb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          white-space: nowrap;
        }

        .activity-name-header {
          width: 300px;
          min-width: 300px;
        }

        .activity-weight-header {
          left: 300px;
          width: 80px;
          min-width: 80px;
          text-align: center;
        }

        .week-header {
          border-bottom: 2px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: center;
          font-weight: 600;
          font-size: 12px;
          color: #374151;
          width: 100px;
          min-width: 100px;
          background: #f8fafc;
        }

        .week-header-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .week-number {
          font-weight: 700;
          color: #1f2937;
        }

        .week-date {
          font-size: 10px;
          color: #6b7280;
        }

        .activity-name-cell,
        .sub-activity-name-cell {
          position: sticky;
          left: 0;
          z-index: 5;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 12px 16px;
          width: 300px;
          min-width: 300px;
        }

        .activity-weight-cell,
        .sub-activity-weight-cell {
          position: sticky;
          left: 300px;
          z-index: 5;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 12px;
          text-align: center;
          width: 80px;
          min-width: 80px;
          font-weight: 600;
        }

        .activity-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .sub-activity-name {
          font-weight: 500;
          color: #4b5563;
          font-size: 13px;
          padding-left: 16px;
        }

        .progress-cell-blocked,
        .progress-cell-plan,
        .progress-cell-actual {
          border-right: 1px solid #e5e7eb;
          padding: 0;
          text-align: center;
          width: 100px;
          min-width: 100px;
          height: 40px;
          vertical-align: middle;
        }

        .progress-cell-blocked {
          background: #f3f4f6;
        }

        .progress-cell-plan {
          background: #bfdbfe;
        }

        .progress-cell-actual {
          background: #ffc928;
        }

        .progress-cell-plan.has-value {
          background: #93c5fd;
        }

        .progress-cell-actual.has-value {
          background: #fbbf24;
        }

        .progress-value-display {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          transition: background-color 0.15s ease;
        }

        .progress-value-display:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .progress-value-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          background: white;
          color: #1f2937;
        }

        .progress-value-input:focus {
          box-shadow: inset 0 0 0 2px #3b82f6;
        }
      `}</style>
    </div>
  )
}

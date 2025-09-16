'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activity/add-activity-modal'
import { EditActivityModal } from '@/components/activity/edit-activity-modal'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateSequentialWeeks } from '@/utils/dateUtils'
import type { Activity, Schedule } from '@/lib/schemas'
import { ScheduleValueType, useUpdateScheduleValue } from '@/hooks/useActivityQueries'


/**
 * Generic Schedule Table Component
 *
 * This component works with activities that include embedded schedule data.
 * No need for getScheduleValue function - schedules are directly accessible.
 */
interface UnifiedScheduleTableProps {
  projectId: string
  title?: string
  activities?: Activity[]
  project?: {
    numberOfWeeks?: number | null
    tanggalSpmk?: string | null
  }
  isLoading?: boolean
  isActionPlanTable?: boolean // New prop to show/hide action plan rows

  // Cumulative calculation function
  getCalculatedValueForWeek: (
    weekNumber: number,
    type: 'total-plan' | 'total-action-plan' | 'total-realization' | 'cumulative-plan' | 'cumulative-action-plan' | 'cumulative-realization' | 'deviation-plan' | 'deviation-action-plan'
  ) => number

  // Optional customization
  showAddButton?: boolean
  showTitle?: boolean
  weekCount?: number // Fallback week count if project.numberOfWeeks is not available
}

// Memoized cell component for plan values
const PlanCell = memo(function PlanCell({
  schedule,
  cellId,
  isEditing,
  editValue,
  isLastWeekOfMonth,
  isActionPlanTable,
  onEdit,
  onSave,
  onCancel,
  onChange
}: {
  schedule: Schedule | undefined
  cellId: string;
  isEditing: boolean;
  editValue: string;
  isLastWeekOfMonth: boolean;
  isActionPlanTable: boolean;
  onEdit: (cellId: string, currentValue: number | null) => void;
  onSave: (scheduleId: string, type: 'plan' | 'realization' | 'actionPlan') => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {

  const value = isActionPlanTable ? schedule?.actionPlan ?? null : schedule?.plan ?? null;
  const mode = isActionPlanTable ? 'actionPlan' : 'plan';
  return (
    <td
      className={`progress-cell-plan ${value && value > 0 ? 'has-value' : ''} ${
        isLastWeekOfMonth ? 'month-separator' : ''
      }`}
    >
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={() => {
            if (schedule?.id) {
              onSave(schedule.id, mode);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (schedule?.id) {
                onSave(schedule.id, mode);
              }
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          className="progress-value-input"
          autoFocus
        />
      ) : (
        <div
          className="progress-value-display"
          onClick={() => onEdit(cellId, value)}
        >
          {value !== null && value !== undefined
            ? value === 0
              ? '-'
              : value.toFixed(3)
            : '-'}
        </div>
      )}
    </td>
  );
});

// Memoized cell component for actual values
const ActualCell = memo(function ActualCell({
  schedule,
  cellId,
  isEditing,
  editValue,
  isLastWeekOfMonth,
  onEdit,
  onSave,
  onCancel,
  onChange
}: {
  schedule: Schedule | undefined;
  cellId: string;
  isEditing: boolean;
  editValue: string;
  isLastWeekOfMonth: boolean;
  onEdit: (cellId: string, currentValue: number | null) => void;
  onSave: (scheduleId: string, type: 'plan' | 'realization' | 'actionPlan') => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  const value = schedule?.realization ?? null;
  
  return (
    <td
      className={`progress-cell-actual ${value && value > 0 ? 'has-value' : ''} ${
        isLastWeekOfMonth ? 'month-separator' : ''
      }`}
    >
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={() => {
            if (schedule?.id) {
              onSave(schedule.id, 'realization');
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (schedule?.id) {
                onSave(schedule.id, 'realization');
              }
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          className="progress-value-input"
          autoFocus
        />
      ) : (
        <div
          className="progress-value-display"
          onClick={() => onEdit(cellId, value)}
        >
          {value !== null && value !== undefined
            ? value === 0
              ? '-'
              : value.toFixed(3)
            : '-'}
        </div>
      )}
    </td>
  );
});

export function UnifiedScheduleTable({
  projectId,
  title = 'Schedule Table',
  activities,
  project,
  isLoading = false,
  isActionPlanTable = false, // New prop to indicate if this is an action plan table
  getCalculatedValueForWeek,
  showAddButton = true,
  showTitle = true,
}: UnifiedScheduleTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const customScrollbarRef = useRef<HTMLDivElement>(null)

  // Use the update schedule value hook
  const updateScheduleValue = useUpdateScheduleValue(projectId)

  // Internal save function using the new single-value API
  const saveScheduleValue = async (
    scheduleId: string,
    type: ScheduleValueType,
    value: number | null
  ): Promise<void> => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required for schedule updates')
    }

    try {
      await updateScheduleValue.mutateAsync({
        scheduleId,
        valueType: type,
        value,
      })
    } catch (error) {
      throw error
    }
  }
  const topScrollbarRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [clientWidth, setClientWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0)

  // Custom scrollbar implementation
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
      const resizeObserver = new ResizeObserver(updateScrollbar)
      resizeObserver.observe(container)
      updateScrollbar()

      return () => {
        container.removeEventListener('scroll', updateScrollbar)
        resizeObserver.disconnect()
      }
    }
  }, [updateScrollbar])

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScrollLeft(scrollLeft)
  }

  const handleTopScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && topScrollbarRef.current) {
      const scrollbarRect = topScrollbarRef.current.getBoundingClientRect()
      const clickX = e.clientX - scrollbarRect.left
      const scrollbarWidth = scrollbarRect.width
      const maxScrollLeft = scrollWidth - clientWidth
      const newScrollLeft = (clickX / scrollbarWidth) * maxScrollLeft
      scrollContainerRef.current.scrollLeft = Math.min(Math.max(newScrollLeft, 0), maxScrollLeft)
    }
  }

  const handleBottomScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && customScrollbarRef.current) {
      const scrollbarRect = customScrollbarRef.current.getBoundingClientRect()
      const clickX = e.clientX - scrollbarRect.left
      const scrollbarWidth = scrollbarRect.width
      const maxScrollLeft = scrollWidth - clientWidth
      const newScrollLeft = (clickX / scrollbarWidth) * maxScrollLeft
      scrollContainerRef.current.scrollLeft = Math.min(Math.max(newScrollLeft, 0), maxScrollLeft)
    }
  }

  const handleTopThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleThumbMouseDown(e)
  }

  const handleBottomThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleThumbMouseDown(e)
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

  // Generate sequential weeks for table headers based on SPMK date
  const effectiveWeekCount = project?.numberOfWeeks || 30
  const sequentialWeeks = generateSequentialWeeks(project?.tanggalSpmk || null, effectiveWeekCount)

  // Group sequential weeks by month for two-row header
  const monthGroups = sequentialWeeks.reduce((groups, week) => {
    const monthKey = `${week.year}-${week.month}`
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: week.month,
        year: week.year,
        name: getMonthName(week.month),
        weeks: []
      }
    }
    groups[monthKey].weeks.push(week)
    return groups
  }, {} as Record<string, { month: number; year: number; name: string; weeks: typeof sequentialWeeks }>)

  const monthGroupsArray = Object.values(monthGroups)

  // Helper function to get month name
  function getMonthName(month: number): string {
    const monthNames = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ]
    return monthNames[month - 1] || 'UNKNOWN'
  }

  // Show simplified table if sequential weeks generation fails or is empty
  if (!sequentialWeeks || sequentialWeeks.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold text-red-600">Table Configuration Error</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>SPMK Date:</strong> {project?.tanggalSpmk || 'Not set'}
          </p>
          <p>
            <strong>Project numberOfWeeks:</strong> {project?.numberOfWeeks || 'Not set'}
          </p>
          <p>
            <strong>Effective Week Count:</strong> {effectiveWeekCount}
          </p>
          <p>
            <strong>Sequential Weeks Generated:</strong> {sequentialWeeks?.length || 0}
          </p>
          <p>
            <strong>Issue:</strong> Unable to generate week structure. Please check SPMK date
            format.
          </p>
          <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              Expected SPMK date format: 23 Mei 2025 or 2025-05-23
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleCellEdit = (cellId: string, currentValue: number | null) => {
    setEditingCell(cellId)
    setEditValue(currentValue !== null ? currentValue.toString() : '')
  }

  const handleCellSave = async (
    scheduleId: string,
    type: 'plan' | 'realization' | 'actionPlan'
  ) => {
    // Parse value - allow 0 as valid value
    const numericValue = editValue === '' ? null : parseFloat(editValue)
    const value = !isNaN(numericValue!) ? numericValue : null

    try {
      await saveScheduleValue(scheduleId, type, value)
      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      // Handle error silently - error handling should be done in the saveScheduleValue function
      setEditingCell(null)
      setEditValue('')
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header with Add Button and Legend */}
      {(showAddButton || showTitle) && (
        <div className="border-b border-gray-200 px-2 py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-4">
          <div className="flex items-center justify-between">
            <div>
              {showTitle && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            </div>
            {/* Move Add button to the left using Tailwind order-first so it appears before the title */}
            <div
              className="order-first flex items-center gap-4"
              aria-hidden={!showAddButton}
            >
              {showAddButton && (
              <Button
                aria-label="Tambah Kegiatan"
                title="Tambah Kegiatan"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border-[#ffc928] bg-[#ffc928] px-2 py-1.5 text-[9px] font-medium text-[#364878] hover:bg-[#e6b323] lg:gap-2 lg:px-3 lg:py-2 lg:text-[10px] xl:text-xs"
              >
                <Plus className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                Tambah Kegiatan
              </Button>
              )}
            </div>

            {/* Legend placed to the far right */}
            <div className="ml-auto flex items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-1 lg:gap-2">
              <div className="h-2 w-2 rounded-full bg-[#BFDBFE] lg:h-2.5 lg:w-2.5" />
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                Rencana
              </span>
              </div>

              <div className="flex items-center gap-1 lg:gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FFC928] lg:h-2.5 lg:w-2.5" />
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                Realisasi
              </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="relative">
        {/* Custom Top Scrollbar */}
        {showCustomScrollbar && (
          <div className="absolute left-0 right-0 top-0 z-10 h-5 rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
            <div
              ref={topScrollbarRef}
              className="relative h-full cursor-pointer"
              onClick={handleTopScrollbarClick}
            >
              <div
                className="scrollbar-thumb"
                style={{
                  left: `${thumbPosition}%`,
                  width: `${thumbWidth}%`,
                }}
                onMouseDown={handleTopThumbMouseDown}
              />
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className={`scrollbar-hide overflow-x-auto ${showCustomScrollbar ? 'scroll-container-with-top-bar' : 'scroll-container-default'}`}
        >
          <table className="w-full text-[8px] lg:text-[9px] xl:text-[10px]">
            {/* Table Header */}
            <thead>
              {/* First header row - Month names */}
              <tr>
                <th
                  rowSpan={3}
                  className="activity-table-sticky-left border-b border-gray-200 bg-gray-50 p-1.5 table-text-sm font-bold text-gray-900"
                >
                  URAIAN PEKERJAAN
                </th>
                <th
                  rowSpan={3}
                  className="border-b border-gray-200 bg-gray-50 p-1.5 table-text-sm font-bold text-gray-900"
                >
                  <div>Bobot</div>
                  <div>(%)</div>
                </th>
                {monthGroupsArray.map((monthGroup, monthIndex) =>
                  monthGroup.weeks.map((week, weekIndex) => (
                    <th
                      key={`num-W${week.weekNumber}`}
                      className={`border-b border-gray-200 bg-gray-50 p-1.5 table-text-sm font-bold text-gray-900 ${
                        weekIndex === monthGroup.weeks.length - 1 && monthIndex < monthGroupsArray.length - 1
                          ? 'month-separator'
                          : ''
                      }`}
                    >
                      {week.weekNumber}
                    </th>
                  ))
                )}
                
              </tr>

              {/* Second header row - Week ranges */}
              <tr>
                {monthGroupsArray.map((monthGroup, monthIndex) => (
                  <th
                    key={`${monthGroup.year}-${monthGroup.month}`}
                    colSpan={monthGroup.weeks.length}
                    className={`activity-table-header-primary ${
                      monthIndex < monthGroupsArray.length - 1 ? 'month-separator' : ''
                    }`}
                  >
                    {monthGroup.name}
                  </th>
                ))}
                
              </tr>

              {/* Third header row - Week numbers */}
              <tr>
                {monthGroupsArray.map((monthGroup, monthIndex) =>
                  monthGroup.weeks.map((week, weekIndex) => (
                    <th
                      key={`range-W${week.weekNumber}`}
                      className={`activity-table-header-secondary ${
                        weekIndex === monthGroup.weeks.length - 1 && monthIndex < monthGroupsArray.length - 1
                          ? 'month-separator'
                          : ''
                      }`}
                    >
                      {week.range}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody>
              {activities?.map(activity => (
                <React.Fragment key={activity.id}>
                  {/* Main Activity Row */}
                  <tr className="activity-main-row">
                    <td
                      className="activity-main-cell"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="activity-main-title">{activity.name}</div>
                    </td>
                    <td className="bg-gray-100"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`${activity.id}-main-W${week.weekNumber}`}
                          className={`bg-gray-100 ${week.isLastWeekOfMonth ? 'month-separator' : ''}`}
                        />
                      )
                    })}
                  </tr>

                  {/* Sub Activities - Dynamic rows based on showActionPlan */}
                  {activity.subActivities?.map(subActivity => (
                    <React.Fragment key={subActivity.id}>
                      {/* Plan Row */}
                      <tr className="border-b border-gray-200">
                        <td rowSpan={2} className="sub-activity-name-cell">
                          <div className="sub-activity-name">{subActivity.name}</div>
                        </td>
                        <td rowSpan={2} className="sub-activity-weight-cell">
                          {subActivity.weight}
                        </td>
                        {/* for each subActivity.schedules */}

                        {sequentialWeeks.map((week) => {
                          // find schedule for this week from subActivity.schedules
                          const schedule = subActivity.schedules?.find(s => s.weekNumber === week.weekNumber)
                          const cellId = `${subActivity.id}-W${week.weekNumber}-plan`
                          const isEditing = editingCell === cellId
                          return (
                            <PlanCell
                              key={cellId}
                              schedule={schedule}
                              isActionPlanTable={isActionPlanTable}
                              cellId={cellId}
                              isEditing={isEditing}
                              editValue={editValue}
                              isLastWeekOfMonth={week.isLastWeekOfMonth}
                              onEdit={handleCellEdit}
                              onSave={handleCellSave}
                              onCancel={handleCellCancel}
                              onChange={setEditValue}
                            />
                          )
                        })}
                      </tr>

                      {/* Actual Row */}
                      <tr className="border-b border-gray-200">
                        {sequentialWeeks.map((week) => {
                          // find schedule for this week from subActivity.schedules
                          const schedule = subActivity.schedules?.find(s => s.weekNumber === week.weekNumber)
                          const cellId = `${subActivity.id}-W${week.weekNumber}-actual`
                          const isEditing = editingCell === cellId

                          return (
                            <ActualCell
                              key={cellId}
                              schedule={schedule}
                              cellId={cellId}
                              isEditing={isEditing}
                              editValue={editValue}
                              isLastWeekOfMonth={week.isLastWeekOfMonth}
                              onEdit={handleCellEdit}
                              onSave={handleCellSave}
                              onCancel={handleCellCancel}
                              onChange={setEditValue}
                            />
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}

              {/* Total Weekly Values Section */}
              {(
                <>
                  {/* Total Section Spacer */}
                  <tr className="h-[27px] border-b border-gray-200">
                    <td colSpan={2 + sequentialWeeks.length} className="border-gray-200"></td>
                  </tr>

                  {/* Total Header */}
                  <tr>
                    <td className="cumulative-header-cell">TOTAL</td>
                    <td className="cumulative-sticky-weight"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`total-header-W${week.weekNumber}`}
                          className={`border-b border-gray-200 ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        ></td>
                      )
                    })}
                  </tr>

                  {/* Total Rencana Row */}
                  <tr>
                    <td className="cumulative-label-cell">Rencana</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`rencana-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-plan ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCalculatedValueForWeek(week.weekNumber, isActionPlanTable ? 'total-action-plan' : 'total-plan').toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Total Realisasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Realisasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`realisasi-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-actual ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCalculatedValueForWeek(week.weekNumber, 'total-realization').toFixed(
                            3
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Kumulatif Section Spacer */}
                  <tr className="h-[27px] border-b border-gray-200">
                    <td colSpan={2 + sequentialWeeks.length} className="border-gray-200"></td>
                  </tr>

                  {/* Kumulatif Header */}
                  <tr>
                    <td className="cumulative-header-cell">KUMULATIF</td>
                    <td className="cumulative-sticky-weight"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`kumulatif-header-W${week.weekNumber}`}
                          className={`border-b border-gray-200 ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        ></td>
                      )
                    })}
                  </tr>

                  {/* Kumulatif Rencana Row */}
                  <tr>
                    <td className="cumulative-label-cell">Rencana</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`rencana-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-plan ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCalculatedValueForWeek(week.weekNumber, isActionPlanTable ? 'cumulative-action-plan' : 'cumulative-plan').toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Kumulatif Realisasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Realisasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`realisasi-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-actual ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCalculatedValueForWeek(week.weekNumber, 'cumulative-realization').toFixed(
                            3
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Kumulatif Deviasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Deviasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      return (
                        <td
                          key={`deviasi-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-deviation ${
                            week.isLastWeekOfMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCalculatedValueForWeek(
                            week.weekNumber,
                            isActionPlanTable ? 'deviation-action-plan' : 'deviation-plan'
                          ).toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Bottom Scrollbar */}
        {showCustomScrollbar && (
          <div className="h-5 rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
            <div
              ref={customScrollbarRef}
              className="relative h-full cursor-pointer"
              onClick={handleBottomScrollbarClick}
            >
              <div
                className="scrollbar-thumb"
                style={{
                  left: `${thumbPosition}%`,
                  width: `${thumbWidth}%`,
                }}
                onMouseDown={handleBottomThumbMouseDown}
              />
            </div>
          </div>
        )}
      </div>

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
    </div>
  )
}

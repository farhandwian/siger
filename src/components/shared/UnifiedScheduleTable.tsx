'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { EditActivityModal } from '@/components/activities/edit-activity-modal'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateSequentialWeeks } from '@/utils/dateUtils'
import type { Activity } from '@/lib/schemas'

/**
 * Generic Schedule Table Component
 *
 * This component can be used for both Activity Schedules and Action Plan Schedules
 * by passing different data sources and mutation functions as props.
 */
interface UnifiedScheduleTableProps {
  projectId: string
  title?: string
  activities?: Activity[]
  project?: any
  isLoading?: boolean

  // Functions to handle data retrieval and updates
  getScheduleValue: (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ) => number | null

  saveScheduleValue: (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual',
    value: number | null
  ) => Promise<void>

  // Cumulative calculation function
  getCumulativeValueForWeek: (
    weekNumber: number,
    type: 'plan' | 'actual' | 'deviation'
  ) => number

  // Optional customization
  showAddButton?: boolean
  showTitle?: boolean
  showCumulativeSection?: boolean
  weekCount?: number
}

// Memoized cell component for plan values
const PlanCell = memo(function PlanCell({
  subActivityId,
  weekNumber,
  value,
  isEditing,
  editValue,
  isLastWeekInMonth,
  onEdit,
  onSave,
  onCancel,
  onChange
}: {
  subActivityId: string;
  weekNumber: number;
  value: number | null;
  isEditing: boolean;
  editValue: string;
  isLastWeekInMonth: boolean;
  onEdit: (cellId: string, currentValue: number | null) => void;
  onSave: (subActivityId: string, weekNumber: number, type: 'plan' | 'actual') => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  const cellId = `${subActivityId}-W${weekNumber}-plan`;
  
  return (
    <td
      className={`progress-cell-plan ${value && value > 0 ? 'has-value' : ''} ${
        isLastWeekInMonth ? 'month-separator' : ''
      }`}
    >
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={() => onSave(subActivityId, weekNumber, 'plan')}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSave(subActivityId, weekNumber, 'plan');
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
  subActivityId,
  weekNumber,
  value,
  isEditing,
  editValue,
  isLastWeekInMonth,
  onEdit,
  onSave,
  onCancel,
  onChange
}: {
  subActivityId: string;
  weekNumber: number;
  value: number | null;
  isEditing: boolean;
  editValue: string;
  isLastWeekInMonth: boolean;
  onEdit: (cellId: string, currentValue: number | null) => void;
  onSave: (subActivityId: string, weekNumber: number, type: 'plan' | 'actual') => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  const cellId = `${subActivityId}-W${weekNumber}-actual`;
  
  return (
    <td
      className={`progress-cell-actual ${value && value > 0 ? 'has-value' : ''} ${
        isLastWeekInMonth ? 'month-separator' : ''
      }`}
    >
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={() => onSave(subActivityId, weekNumber, 'actual')}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSave(subActivityId, weekNumber, 'actual');
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
  getScheduleValue,
  saveScheduleValue,
  getCumulativeValueForWeek,
  showAddButton = true,
  showTitle = true,
  showCumulativeSection = true,
  weekCount = 20,
}: UnifiedScheduleTableProps) {
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
  const sequentialWeeks = generateSequentialWeeks(project?.tanggalSpmk || null, weekCount)

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

  // Helper function to determine if a week is at the end of a month (for month separators)
  function isLastWeekOfMonth(week: typeof sequentialWeeks[0]): boolean {
    const currentMonthKey = `${week.year}-${week.month}`
    const monthGroup = monthGroups[currentMonthKey]
    if (!monthGroup) return false
    
    const lastWeek = monthGroup.weeks[monthGroup.weeks.length - 1]
    return lastWeek.weekNumber === week.weekNumber
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
            <strong>Sequential Weeks Generated:</strong> {sequentialWeeks?.length || 0}
          </p>
          <p>
            <strong>Issue:</strong> Unable to generate week structure. Please check SPMK date
            format.
          </p>
          <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              Expected SPMK date format: "23 Mei 2025" or "2025-05-23"
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
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ) => {
    // Parse value - allow 0 as valid value
    const numericValue = editValue === '' ? null : parseFloat(editValue)
    const value = !isNaN(numericValue!) ? numericValue : null

    try {
      await saveScheduleValue(activityId, subActivityId, weekNumber, type, value)
      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      // Handle error appropriately - could show a toast notification or error state
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
                  {/* Main Activity Row - No weight, clickable */}
                  <tr className="activity-main-row">
                    <td
                      className="activity-main-cell"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="activity-main-title">{activity.name}</div>
                    </td>
                    <td className="bg-gray-100">{/* No weight for main activity */}</td>
                    {sequentialWeeks.map((week) => {
                      const isLastWeekInMonth = isLastWeekOfMonth(week)
                      return (
                        <td 
                          key={`${activity.id}-main-W${week.weekNumber}`} 
                          className={`bg-gray-100 ${isLastWeekInMonth ? 'month-separator' : ''}`}
                        >
                          {/* Main activity cells are blocked/empty */}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Sub Activities - Each has 2 rows */}
                  {activity.subActivities?.map(subActivity => (
                    <React.Fragment key={subActivity.id}>
                      {/* First Row - Blue background (#BFDBFE) - Plan values */}
                      <tr className="border-b border-gray-200">
                        <td rowSpan={2} className="sub-activity-name-cell">
                          <div className="sub-activity-name">{subActivity.name}</div>
                        </td>
                        <td rowSpan={2} className="sub-activity-weight-cell">
                          {subActivity.weight}
                        </td>
                        {sequentialWeeks.map((week) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-plan`
                          const value = getScheduleValue(
                            activity.id,
                            subActivity.id,
                            week.weekNumber,
                            'plan'
                          )
                          const isEditing = editingCell === cellId
                          const isLastWeekInMonth = isLastWeekOfMonth(week)

                          return (
                            <PlanCell
                              key={cellId}
                              subActivityId={subActivity.id}
                              weekNumber={week.weekNumber}
                              value={value}
                              isEditing={isEditing}
                              editValue={editValue}
                              isLastWeekInMonth={isLastWeekInMonth}
                              onEdit={handleCellEdit}
                              onSave={(subId, weekNum, type) =>
                                handleCellSave(activity.id, subId, weekNum, type)
                              }
                              onCancel={handleCellCancel}
                              onChange={setEditValue}
                            />
                          )
                        })}
                      </tr>

                      {/* Second Row - Yellow background (#FFC928) - Actual values */}
                      <tr className="border-b border-gray-200">
                        {/* Name and weight cells are merged with rowspan above */}
                        {sequentialWeeks.map((week) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-actual`
                          const value = getScheduleValue(
                            activity.id,
                            subActivity.id,
                            week.weekNumber,
                            'actual'
                          )
                          const isEditing = editingCell === cellId
                          const isLastWeekInMonth = isLastWeekOfMonth(week)

                          return (
                            <ActualCell
                              key={cellId}
                              subActivityId={subActivity.id}
                              weekNumber={week.weekNumber}
                              value={value}
                              isEditing={isEditing}
                              editValue={editValue}
                              isLastWeekInMonth={isLastWeekInMonth}
                              onEdit={handleCellEdit}
                              onSave={(subId, weekNum, type) =>
                                handleCellSave(activity.id, subId, weekNum, type)
                              }
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

              {/* Spacer row */}
              <tr className="h-[27px] border-b border-gray-200">
                <td colSpan={2 + sequentialWeeks.length} className="border-gray-200"></td>
              </tr>

              {/* Total Weekly Values Section */}
              {showCumulativeSection && (
                <>
                  {/* Total Rencana Row */}
                  <tr>
                    <td className="cumulative-label-cell">Rencana</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      // Calculate total for this week (plan)
                      const weekTotal =
                        activities?.reduce((total, activity) => {
                          const subActivityTotal =
                            activity.subActivities?.reduce((subTotal, subActivity) => {
                              const value = getScheduleValue(
                                activity.id,
                                subActivity.id,
                                week.weekNumber,
                                'plan'
                              )
                              return subTotal + (value || 0)
                            }, 0) || 0
                          return total + subActivityTotal
                        }, 0) || 0
                      
                      const isLastWeekInMonth = isLastWeekOfMonth(week)

                      return (
                        <td
                          key={`total-plan-W${week.weekNumber}`}
                          className={`progress-cell-plan ${weekTotal > 0 ? 'has-value' : ''} ${
                            isLastWeekInMonth ? 'month-separator' : ''
                          }`}
                        >
                          {weekTotal > 0 ? weekTotal.toFixed(3) : '-'}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Total Realisasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Realisasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      // Calculate total for this week (actual)
                      const weekTotal =
                        activities?.reduce((total, activity) => {
                          const subActivityTotal =
                            activity.subActivities?.reduce((subTotal, subActivity) => {
                              const value = getScheduleValue(
                                activity.id,
                                subActivity.id,
                                week.weekNumber,
                                'actual'
                              )
                              return subTotal + (value || 0)
                            }, 0) || 0
                          return total + subActivityTotal
                        }, 0) || 0
                      
                      const isLastWeekInMonth = isLastWeekOfMonth(week)

                      return (
                        <td
                          key={`total-actual-W${week.weekNumber}`}
                          className={`progress-cell-actual ${weekTotal > 0 ? 'has-value' : ''} ${
                            isLastWeekInMonth ? 'month-separator' : ''
                          }`}
                        >
                          {weekTotal > 0 ? weekTotal.toFixed(3) : '-'}
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
                      const isLastWeekInMonth = isLastWeekOfMonth(week)
                      return (
                        <td
                          key={`kumulatif-header-W${week.weekNumber}`}
                          className={`border-b border-gray-200 ${
                            isLastWeekInMonth ? 'month-separator' : ''
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
                      const isLastWeekInMonth = isLastWeekOfMonth(week)
                      return (
                        <td
                          key={`rencana-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-plan ${
                            isLastWeekInMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCumulativeValueForWeek(week.weekNumber, 'plan').toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Kumulatif Realisasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Realisasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map((week) => {
                      const isLastWeekInMonth = isLastWeekOfMonth(week)
                      return (
                        <td
                          key={`realisasi-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-actual ${
                            isLastWeekInMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCumulativeValueForWeek(week.weekNumber, 'actual').toFixed(
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
                      const isLastWeekInMonth = isLastWeekOfMonth(week)
                      return (
                        <td
                          key={`deviasi-W${week.weekNumber}`}
                          className={`progress-cell-cumulative-deviation ${
                            isLastWeekInMonth ? 'month-separator' : ''
                          }`}
                        >
                          {getCumulativeValueForWeek(
                            week.weekNumber,
                            'deviation'
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

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { EditActivityModal } from '@/components/activities/edit-activity-modal'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateSequentialWeeks, type SequentialWeek } from '@/utils/dateUtils'
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
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ) => number

  // Optional customization
  showAddButton?: boolean
  showTitle?: boolean
  showCumulativeSection?: boolean
  weekCount?: number
}

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

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>, isTop: boolean) => {
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

  // Generate sequential weeks for table headers based on SPMK date
  const sequentialWeeks = generateSequentialWeeks(project?.tanggalSpmk || null, weekCount)

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

    console.log('Saving cell value:', editValue, 'parsed as:', value)

    if (!sequentialWeeks[weekNumber - 1]) {
      console.error('Invalid week number:', weekNumber)
      return
    }

    try {
      await saveScheduleValue(activityId, subActivityId, weekNumber, type, value)
      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Error updating schedule:', error)
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
            <div className="order-first flex items-center gap-4">
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

              {/* Legend */}
              {/* // Legend moved to the right by using `ml-auto` on the first legend item.
              // This pushes the legend items to the far right of the flex container. */}
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="ml-auto flex items-center gap-1 lg:gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FFC928] lg:h-2.5 lg:w-2.5" />
                  <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                    Realisasi
                  </span>
                </div>

                <div className="flex items-center gap-1 lg:gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#BFDBFE] lg:h-2.5 lg:w-2.5" />
                  <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                    Rencana
                  </span>
                </div>
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
              {/* Single header row - Week ranges */}
              <tr>
                <th className="activity-table-sticky-left table-text-sm border-b border-gray-200 bg-gray-50 p-1.5 font-bold text-gray-900">
                  URAIAN PEKERJAAN
                </th>
                <th className="table-text-sm border-b border-gray-200 bg-gray-50 p-1.5 font-bold text-gray-900">
                  <div>Bobot</div>
                  <div>(%)</div>
                </th>
                {sequentialWeeks.map((week, weekIndex) => (
                  <th key={`W${week.weekNumber}`} className="activity-table-header-primary">
                    <div className="text-xs font-semibold">W{week.weekNumber}</div>
                    <div className="text-[10px] font-normal">{week.range}</div>
                  </th>
                ))}
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
                    {sequentialWeeks.map(week => (
                      <td key={`${activity.id}-main-W${week.weekNumber}`} className="bg-gray-100">
                        {/* Main activity cells are blocked/empty */}
                      </td>
                    ))}
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
                        {sequentialWeeks.map((week, weekIndex) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-plan`
                          const value = getScheduleValue(
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

                      {/* Second Row - Yellow background (#FFC928) - Actual values */}
                      <tr className="border-b border-gray-200">
                        {/* Name and weight cells are merged with rowspan above */}
                        {sequentialWeeks.map((week, weekIndex) => {
                          const cellId = `${subActivity.id}-W${week.weekNumber}-actual`
                          const value = getScheduleValue(
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
                    {sequentialWeeks.map(week => {
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

                      return (
                        <td
                          key={`total-plan-W${week.weekNumber}`}
                          className={`progress-cell-plan ${weekTotal > 0 ? 'has-value' : ''}`}
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
                    {sequentialWeeks.map(week => {
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

                      return (
                        <td
                          key={`total-actual-W${week.weekNumber}`}
                          className={`progress-cell-actual ${weekTotal > 0 ? 'has-value' : ''}`}
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
                    {sequentialWeeks.map(week => (
                      <td
                        key={`kumulatif-header-W${week.weekNumber}`}
                        className="border-b border-gray-200"
                      ></td>
                    ))}
                  </tr>

                  {/* Kumulatif Rencana Row */}
                  <tr>
                    <td className="cumulative-label-cell">Rencana</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map(week => (
                      <td
                        key={`rencana-W${week.weekNumber}`}
                        className="progress-cell-cumulative-plan"
                      >
                        {getCumulativeValueForWeek(week.month, week.weekInMonth, 'plan').toFixed(3)}
                      </td>
                    ))}
                  </tr>

                  {/* Kumulatif Realisasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Realisasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map(week => (
                      <td
                        key={`realisasi-W${week.weekNumber}`}
                        className="progress-cell-cumulative-actual"
                      >
                        {getCumulativeValueForWeek(week.month, week.weekInMonth, 'actual').toFixed(
                          3
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Kumulatif Deviasi Row */}
                  <tr>
                    <td className="cumulative-label-cell">Deviasi</td>
                    <td className="sticky border-b border-gray-200"></td>
                    {sequentialWeeks.map(week => (
                      <td
                        key={`deviasi-W${week.weekNumber}`}
                        className="progress-cell-cumulative-deviation"
                      >
                        {getCumulativeValueForWeek(
                          week.month,
                          week.weekInMonth,
                          'deviation'
                        ).toFixed(3)}
                      </td>
                    ))}
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

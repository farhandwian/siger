'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { EditActivityModal } from '@/components/activities/edit-activity-modal'
import { useActivities, useUpdateSchedule, useProject } from '@/hooks/useActivityQueries'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateMonthsFromContract } from '@/utils/dateUtils'
import { calculateCumulativeData, getCumulativeValue } from '@/lib/cumulativeCalculations'
import type { Activity } from '@/lib/schemas'

interface ActivityScheduleTableProps {
  projectId: string
}

export function ActivityScheduleTable({ projectId }: ActivityScheduleTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const updateScheduleMutation = useUpdateSchedule()

  console.log('Contract dates for schedule:', {
    tanggalKontrak: project?.tanggalKontrak,
    akhirKontrak: project?.akhirKontrak,
  })

  // Generate months and weeks for table headers based on contract dates
  const currentYear = new Date().getFullYear()
  const months = generateMonthsFromContract(
    project?.tanggalKontrak || null,
    project?.akhirKontrak || null
  )

  console.log('Generated months from contract:', months)

  // Calculate cumulative data on the client side
  const cumulativeData = calculateCumulativeData(activities, months, currentYear)

  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    month: number,
    week: number,
    type: 'plan' | 'actual'
  ) => {
    if (!activities) return null

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return null

    if (subActivityId) {
      const subActivity = activity.subActivities?.find(sa => sa.id === subActivityId)
      const schedule = subActivity?.schedules?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      const value = type === 'plan' ? schedule?.planPercentage : schedule?.actualPercentage
      return value !== undefined ? value : null
    } else {
      const schedule = activity.schedules?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      const value = type === 'plan' ? schedule?.planPercentage : schedule?.actualPercentage
      return value !== undefined ? value : null
    }
  }

  // Get cumulative value for a specific month/week using client-side calculations
  const getCumulativeValueForWeek = (
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    return getCumulativeValue(cumulativeData, month, week, type)
  }

  const handleCellEdit = (cellId: string, currentValue: number | null) => {
    setEditingCell(cellId)
    setEditValue(currentValue !== null ? currentValue.toString() : '')
  }

  const handleCellSave = async (
    activityId: string,
    subActivityId: string | null,
    month: number,
    week: number,
    type: 'plan' | 'actual'
  ) => {
    // Parse value - allow 0 as valid value
    const numericValue = editValue === '' ? null : parseFloat(editValue)
    const value = !isNaN(numericValue!) ? numericValue : null

    console.log('Saving cell value:', editValue, 'parsed as:', value)

    try {
      await updateScheduleMutation.mutateAsync({
        activityId: subActivityId ? undefined : activityId,
        subActivityId: subActivityId || undefined,
        month,
        year: currentYear,
        week,
        [type === 'plan' ? 'planPercentage' : 'actualPercentage']: value,
      })

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
      <div className="border-b border-gray-200 px-2 py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border-[#ffc928] bg-[#ffc928] px-2 py-1.5 text-[9px] font-medium text-[#364878] hover:bg-[#e6b323] lg:gap-2 lg:px-3 lg:py-2 lg:text-[10px] xl:text-xs"
          >
            <Plus className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            Tambah Kegiatan
          </Button>

          {/* Legend */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-1 lg:gap-2">
              <div
                className="h-2 w-2 rounded-full lg:h-2.5 lg:w-2.5"
                style={{ backgroundColor: '#FFC928' }}
              ></div>
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">Realisasi</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <div
                className="h-2 w-2 rounded-full lg:h-2.5 lg:w-2.5"
                style={{ backgroundColor: '#BFDBFE' }}
              ></div>
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">Rencana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[8px] lg:text-[9px] xl:text-[10px]">
          {/* Table Header */}
          <thead>
            {/* First header row - Month names */}
            <tr>
              <th className="w-[200px] border-b border-gray-200 bg-gray-50 p-1.5 text-left text-[9px] font-bold text-gray-900 lg:w-[250px] lg:p-2 lg:text-[10px] xl:w-[270px] xl:p-3 xl:text-xs">
                Uraian Pekerjaan
              </th>
              <th className="w-[40px] border-b border-r-2 border-white bg-gray-50 p-1.5 text-center text-[9px] font-bold text-gray-900 lg:w-[50px] lg:p-2 lg:text-[10px] xl:w-[57px] xl:p-3 xl:text-xs">
                <div>Bobot</div>
                <div>(%)</div>
              </th>
              {months.map((month, monthIndex) => (
                <th
                  key={month.month}
                  colSpan={month.weeks.length}
                  className={`border-b border-gray-200 bg-[#364878] px-2 py-1 text-center text-[9px] font-bold text-white lg:px-3 lg:py-1.5 lg:text-[10px] xl:px-6 xl:py-1.5 xl:text-xs ${
                    monthIndex < months.length - 1 ? 'border-r-2 border-white' : ''
                  }`}
                >
                  {month.name}
                </th>
              ))}
            </tr>

            {/* Second header row - Week ranges */}
            <tr>
              <th className="border-b border-gray-200 bg-gray-50"></th>
              <th className="border-b border-r-2 border-white bg-gray-50"></th>
              {months.map((month, monthIndex) =>
                month.weeks.map((weekObj, weekIndex) => (
                  <th
                    key={`${month.month}-${weekObj.week}`}
                    className={`min-w-[50px] border-b border-gray-200 bg-[#80a9da] px-1 py-1 text-center text-[8px] font-bold text-white lg:min-w-[60px] lg:px-2 lg:py-1.5 lg:text-[9px] xl:min-w-[67px] xl:px-3 xl:text-[10px] ${
                      weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                        ? 'border-r-2 border-white'
                        : ''
                    }`}
                  >
                    {weekObj.range}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {activities?.map(activity => (
              <React.Fragment key={activity.id}>
                {/* Main Activity Row - No weight, clickable */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td
                    className="cursor-pointer border-b border-gray-200 bg-gray-100 px-1.5 py-1 hover:bg-gray-200 lg:px-2 lg:py-1.5 xl:px-2 xl:py-1.5"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="text-[9px] font-bold uppercase text-gray-900 underline lg:text-[10px] xl:text-xs">
                      {activity.name}
                    </div>
                  </td>
                  <td className="border-b border-r-2 border-white bg-gray-100 px-2 py-1.5 text-center text-[9px] text-gray-700 lg:px-3 lg:text-[10px] xl:px-6 xl:py-3 xl:text-xs">
                    {/* No weight for main activity */}
                  </td>
                  {months.map((month, monthIndex) =>
                    month.weeks.map((weekObj, weekIndex) => (
                      <td
                        key={`${activity.id}-main-${month.month}-${weekObj.week}`}
                        className={`min-w-[50px] border-b border-gray-200 bg-gray-100 px-2 py-1 text-center lg:min-w-[60px] lg:px-3 lg:py-1.5 xl:min-w-[67px] xl:px-6 ${
                          weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                            ? 'border-r-2 border-white'
                            : ''
                        }`}
                      >
                        {/* Main activity cells are blocked/empty */}
                      </td>
                    ))
                  )}
                </tr>

                {/* Sub Activities - Each has 2 rows */}
                {activity.subActivities?.map(subActivity => (
                  <React.Fragment key={subActivity.id}>
                    {/* First Row - Blue background (#BFDBFE) */}
                    <tr className="border-b border-gray-200">
                      <td
                        rowSpan={2}
                        className="border-r border-gray-200 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-2"
                      >
                        <div className="pl-1 text-[9px] font-semibold text-gray-900 lg:pl-2 lg:text-[10px] xl:pl-4 xl:text-xs">
                          {subActivity.name}
                        </div>
                      </td>
                      <td
                        rowSpan={2}
                        className="border-r-2 border-white px-2 py-1 text-center text-[9px] text-gray-700 lg:px-3 lg:py-1.5 lg:text-[10px] xl:px-6 xl:py-2 xl:text-xs"
                      >
                        {subActivity.weight}
                      </td>
                      {months.map((month, monthIndex) =>
                        month.weeks.map((weekObj, weekIndex) => {
                          const cellId = `${subActivity.id}-${month.month}-${weekObj.week}-plan`
                          const value = getScheduleValue(
                            activity.id,
                            subActivity.id,
                            month.month,
                            weekObj.week,
                            'plan'
                          )
                          const isEditing = editingCell === cellId

                          return (
                            <td
                              key={cellId}
                              className={`min-w-[67px] border-b border-gray-200 px-6 py-1.5 text-center ${
                                weekIndex === month.weeks.length - 1 &&
                                monthIndex < months.length - 1
                                  ? 'border-r-2 border-white'
                                  : ''
                              }`}
                              style={{ backgroundColor: '#BFDBFE' }}
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
                                      month.month,
                                      weekObj.week,
                                      'plan'
                                    )
                                  }
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleCellSave(
                                        activity.id,
                                        subActivity.id,
                                        month.month,
                                        weekObj.week,
                                        'plan'
                                      )
                                    } else if (e.key === 'Escape') {
                                      handleCellCancel()
                                    }
                                  }}
                                  className="h-6 w-full border-0 bg-transparent p-0 text-center text-xs focus:ring-0"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer text-xs font-medium text-[#364878]"
                                  onClick={() => handleCellEdit(cellId, value)}
                                >
                                  {value !== null && value !== undefined
                                    ? value === 0
                                      ? '0'
                                      : value.toFixed(3)
                                    : '-'}
                                </div>
                              )}
                            </td>
                          )
                        })
                      )}
                    </tr>

                    {/* Second Row - Yellow background (#FFC928) */}
                    <tr className="border-b border-gray-200">
                      {/* Name and weight cells are merged with rowspan above */}
                      {months.map((month, monthIndex) =>
                        month.weeks.map((weekObj, weekIndex) => {
                          const cellId = `${subActivity.id}-${month.month}-${weekObj.week}-actual`
                          const value = getScheduleValue(
                            activity.id,
                            subActivity.id,
                            month.month,
                            weekObj.week,
                            'actual'
                          )
                          const isEditing = editingCell === cellId

                          return (
                            <td
                              key={cellId}
                              className={`min-w-[67px] border-b border-gray-200 px-6 py-1.5 text-center ${
                                weekIndex === month.weeks.length - 1 &&
                                monthIndex < months.length - 1
                                  ? 'border-r-2 border-white'
                                  : ''
                              }`}
                              style={{ backgroundColor: '#FFC928' }}
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
                                      month.month,
                                      weekObj.week,
                                      'actual'
                                    )
                                  }
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleCellSave(
                                        activity.id,
                                        subActivity.id,
                                        month.month,
                                        weekObj.week,
                                        'actual'
                                      )
                                    } else if (e.key === 'Escape') {
                                      handleCellCancel()
                                    }
                                  }}
                                  className="h-6 w-full border-0 bg-transparent p-0 text-center text-xs focus:ring-0"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer text-xs font-medium text-[#364878]"
                                  onClick={() => handleCellEdit(cellId, value)}
                                >
                                  {value !== null && value !== undefined
                                    ? value === 0
                                      ? '0'
                                      : value.toFixed(3)
                                    : '-'}
                                </div>
                              )}
                            </td>
                          )
                        })
                      )}
                    </tr>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            {/* Kumulatif Section */}
            <tr className="h-[27px] border-b border-gray-200">
              <td
                colSpan={2 + months.reduce((acc, month) => acc + month.weeks.length, 0)}
                className="border-gray-200"
              ></td>
            </tr>

            {/* Kumulatif Header */}
            <tr>
              <td className="border-b border-gray-200 px-6 py-3 text-xs font-bold text-gray-900">
                Kumulatif
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map((month, monthIndex) =>
                month.weeks.map((weekObj, weekIndex) => (
                  <td
                    key={`kumulatif-header-${month.month}-${weekObj.week}`}
                    className={`border-b border-gray-200 ${
                      weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                        ? 'border-r-2 border-white'
                        : ''
                    }`}
                  ></td>
                ))
              )}
            </tr>

            {/* Rencana Row */}
            <tr>
              <td className="border-b border-r-2 border-white px-6 py-1.5 text-xs font-semibold text-gray-700">
                Rencana
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map((month, monthIndex) =>
                month.weeks.map((weekObj, weekIndex) => (
                  <td
                    key={`rencana-${month.month}-${weekObj.week}`}
                    className={`border-b border-gray-200 px-6 py-1.5 text-center text-xs font-medium text-[#364878] ${
                      weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                        ? 'border-r-2 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: '#BFDBFE' }}
                  >
                    {getCumulativeValueForWeek(month.month, weekObj.week, 'plan').toFixed(1)}%
                  </td>
                ))
              )}
            </tr>

            {/* Realisasi Row */}
            <tr>
              <td className="border-b border-r-2 border-white px-6 py-1.5 text-xs font-semibold text-gray-700">
                Realisasi
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map((month, monthIndex) =>
                month.weeks.map((weekObj, weekIndex) => (
                  <td
                    key={`realisasi-${month.month}-${weekObj.week}`}
                    className={`border-b border-gray-200 px-6 py-1.5 text-center text-xs font-medium text-[#364878] ${
                      weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                        ? 'border-r-2 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: '#FFC928' }}
                  >
                    {getCumulativeValueForWeek(month.month, weekObj.week, 'actual').toFixed(1)}%
                  </td>
                ))
              )}
            </tr>

            {/* Deviasi Row */}
            <tr>
              <td className="border-b border-r-2 border-white px-6 py-1.5 text-xs font-semibold text-gray-700">
                Deviasi
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map((month, monthIndex) =>
                month.weeks.map((weekObj, weekIndex) => (
                  <td
                    key={`deviasi-${month.month}-${weekObj.week}`}
                    className={`border-b border-gray-200 bg-white px-6 py-1.5 text-center text-xs font-medium text-[#364878] ${
                      weekIndex === month.weeks.length - 1 && monthIndex < months.length - 1
                        ? 'border-r-2 border-white'
                        : ''
                    }`}
                  >
                    {getCumulativeValueForWeek(month.month, weekObj.week, 'deviation').toFixed(1)}%
                  </td>
                ))
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedActivity(null)
        }}
        activity={selectedActivity}
        projectId={projectId}
      />
    </div>
  )
}

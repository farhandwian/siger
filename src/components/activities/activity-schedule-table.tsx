'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { EditActivityModal } from '@/components/activities/edit-activity-modal'
import {
  useActivities,
  useUpdateSchedule,
  useProject,
  useCumulativeData,
} from '@/hooks/useActivityQueries'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { generateMonthsFromContract } from '@/utils/dateUtils'
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
  const { data: cumulativeData } = useCumulativeData(projectId)
  const updateScheduleMutation = useUpdateSchedule()

  console.log('Component cumulativeData:', cumulativeData)

  // Generate months and weeks for table headers based on contract dates
  const currentYear = new Date().getFullYear()
  const months = generateMonthsFromContract(
    project?.tanggalKontrak || null,
    project?.akhirKontrak || null
  )

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

  // Get cumulative value for a specific month/week
  const getCumulativeValue = (
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    const cumulative = cumulativeData?.find(
      c => c.month === month && c.week === week && c.year === currentYear
    )

    if (!cumulative) return 0

    switch (type) {
      case 'plan':
        return cumulative.cumulativePlan
      case 'actual':
        return cumulative.cumulativeActual
      case 'deviation':
        return cumulative.cumulativeDeviation
      default:
        return 0
    }
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Header with Add Button and Legend */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border-[#ffc928] bg-[#ffc928] px-4 py-2.5 text-sm font-medium text-[#364878] hover:bg-[#e6b323]"
          >
            <Plus className="h-5 w-5" />
            Tambah Kegiatan
          </Button>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#FFC928' }}
              ></div>
              <span className="text-sm text-gray-500">Realisasi</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#BFDBFE' }}
              ></div>
              <span className="text-sm text-gray-500">Rencana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          {/* Table Header */}
          <thead>
            {/* First header row - Month names */}
            <tr>
              <th className="w-[270px] border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-bold text-gray-900">
                Uraian Pekerjaan
              </th>
              <th className="w-[57px] border-b border-r-2 border-white bg-gray-50 p-3 text-center text-sm font-bold text-gray-900">
                <div>Bobot</div>
                <div>(%)</div>
              </th>
              {months.map((month, monthIndex) => (
                <th
                  key={month.month}
                  colSpan={month.weeks.length}
                  className={`border-b border-gray-200 bg-[#364878] px-6 py-1.5 text-center text-xs font-bold text-white ${
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
                    className={`min-w-[67px] border-b border-gray-200 bg-[#80a9da] px-3 py-1.5 text-center text-xs font-bold text-white ${
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
                    className="cursor-pointer border-b border-gray-200 bg-gray-100 px-2 py-1.5 hover:bg-gray-200"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="text-xs font-bold uppercase text-gray-900 underline">
                      {activity.name}
                    </div>
                  </td>
                  <td className="border-b border-r-2 border-white bg-gray-100 px-6 py-3 text-center text-xs text-gray-700">
                    {/* No weight for main activity */}
                  </td>
                  {months.map((month, monthIndex) =>
                    month.weeks.map((weekObj, weekIndex) => (
                      <td
                        key={`${activity.id}-main-${month.month}-${weekObj.week}`}
                        className={`min-w-[67px] border-b border-gray-200 bg-gray-100 px-6 py-1.5 text-center ${
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
                      <td rowSpan={2} className="border-r border-gray-200 px-6 py-2">
                        <div className="pl-4 text-xs font-semibold text-gray-900">
                          {subActivity.name}
                        </div>
                      </td>
                      <td
                        rowSpan={2}
                        className="border-r-2 border-white px-6 py-2 text-center text-xs text-gray-700"
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
                    {getCumulativeValue(month.month, weekObj.week, 'plan').toFixed(1)}%
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
                    {getCumulativeValue(month.month, weekObj.week, 'actual').toFixed(1)}%
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
                    {getCumulativeValue(month.month, weekObj.week, 'deviation').toFixed(1)}%
                  </td>
                ))
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Progress Bar */}
      <div className="border-t border-gray-200 px-3 py-2">
        <div className="h-1.5 w-[407px] rounded-full bg-gray-200">
          <div className="h-full w-[30%] rounded-full bg-gray-300"></div>
        </div>
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

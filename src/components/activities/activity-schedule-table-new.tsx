'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddActivityModal } from '@/components/activities/add-activity-modal'
import { useActivities, useUpdateSchedule } from '@/hooks/useActivityQueries'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface ActivityScheduleTableProps {
  projectId: string
}

export function ActivityScheduleTable({ projectId }: ActivityScheduleTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: activities, isLoading } = useActivities(projectId)
  const updateScheduleMutation = useUpdateSchedule()

  // Generate months and weeks for table headers based on Figma design
  const currentYear = new Date().getFullYear()
  const months = [
    {
      month: 5,
      name: 'MEI',
      weeks: [
        { week: 1, range: '23 - 25' },
        { week: 2, range: '26 - 01' },
      ],
    },
    {
      month: 6,
      name: 'JUNI',
      weeks: [
        { week: 1, range: '02 - 08' },
        { week: 2, range: '09 - 15' },
        { week: 3, range: '16 - 22' },
        { week: 4, range: '23 - 29' },
      ],
    },
    {
      month: 7,
      name: 'JULI',
      weeks: [
        { week: 1, range: '30 - 06' },
        { week: 2, range: '07 - 13' },
        { week: 3, range: '14 - 20' },
        { week: 4, range: '21 - 27' },
      ],
    },
  ]

  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    month: number,
    week: number,
    type: 'plan' | 'actual'
  ) => {
    if (!activities) return 0

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return 0

    if (subActivityId) {
      const subActivity = activity.subActivities?.find(sa => sa.id === subActivityId)
      const schedule = subActivity?.schedules?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      return type === 'plan' ? schedule?.planPercentage || 0 : schedule?.actualPercentage || 0
    } else {
      const schedule = activity.schedules?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      return type === 'plan' ? schedule?.planPercentage || 0 : schedule?.actualPercentage || 0
    }
  }

  const handleCellEdit = (cellId: string, currentValue: number) => {
    setEditingCell(cellId)
    setEditValue(currentValue.toString())
  }

  const handleCellSave = async (
    activityId: string,
    subActivityId: string | null,
    month: number,
    week: number,
    type: 'plan' | 'actual'
  ) => {
    const value = parseFloat(editValue) || 0

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
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffc928]"></div>
              <span className="text-sm text-gray-500">Realisasi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-200"></div>
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
              <th className="w-[57px] border-b border-gray-200 bg-gray-50 p-3 text-center text-sm font-bold text-gray-900">
                <div>Bobot</div>
                <div>(%)</div>
              </th>
              {months.map(month => (
                <th
                  key={month.month}
                  colSpan={month.weeks.length}
                  className="border-b border-gray-200 bg-[#364878] px-6 py-1.5 text-center text-xs font-bold text-white"
                >
                  {month.name}
                </th>
              ))}
            </tr>

            {/* Second header row - Week ranges */}
            <tr>
              <th className="border-b border-gray-200 bg-gray-50"></th>
              <th className="border-b border-gray-200 bg-gray-50"></th>
              {months.map(month =>
                month.weeks.map(weekObj => (
                  <th
                    key={`${month.month}-${weekObj.week}`}
                    className="min-w-[67px] border-b border-gray-200 bg-[#80a9da] px-3 py-1.5 text-center text-xs font-bold text-white"
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
                {/* Main Activity Row */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="border-b border-gray-200 bg-gray-100 px-2 py-1.5">
                    <div className="cursor-pointer text-xs font-semibold text-gray-900 underline">
                      {activity.name}
                    </div>
                  </td>
                  <td className="border-b border-gray-200 bg-gray-100 px-6 py-3 text-center text-xs text-gray-700">
                    {activity.weight}
                  </td>
                  {months.map(month =>
                    month.weeks.map(weekObj => {
                      const cellId = `${activity.id}-${month.month}-${weekObj.week}-plan`
                      const value = getScheduleValue(
                        activity.id,
                        null,
                        month.month,
                        weekObj.week,
                        'plan'
                      )
                      const isEditing = editingCell === cellId

                      return (
                        <td
                          key={cellId}
                          className="min-w-[67px] border-b border-gray-200 bg-gray-100 px-6 py-1.5 text-center"
                        >
                          {isEditing ? (
                            <Input
                              value={editValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditValue(e.target.value)
                              }
                              onBlur={() =>
                                handleCellSave(activity.id, null, month.month, weekObj.week, 'plan')
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleCellSave(
                                    activity.id,
                                    null,
                                    month.month,
                                    weekObj.week,
                                    'plan'
                                  )
                                } else if (e.key === 'Escape') {
                                  handleCellCancel()
                                }
                              }}
                              className="h-6 w-full border-0 p-0 text-center text-xs focus:ring-0"
                              autoFocus
                            />
                          ) : (
                            <div
                              className={`cursor-pointer text-xs ${
                                value > 0
                                  ? 'rounded bg-blue-200 px-2 py-1 text-[#364878]'
                                  : 'text-gray-700'
                              }`}
                              onClick={() => handleCellEdit(cellId, value)}
                            >
                              {value > 0 ? value.toFixed(3) : '-'}
                            </div>
                          )}
                        </td>
                      )
                    })
                  )}
                </tr>

                {/* Sub Activities */}
                {activity.subActivities?.map(subActivity => (
                  <tr key={subActivity.id} className="border-b border-gray-200 bg-gray-100">
                    <td className="px-6 py-3">
                      <div className="pl-4 text-xs font-semibold text-gray-900">
                        {subActivity.name}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-xs text-gray-700">
                      {subActivity.weight}
                    </td>
                    {months.map(month =>
                      month.weeks.map(weekObj => {
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
                            className="min-w-[67px] border-b border-gray-200 px-6 py-1.5 text-center"
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
                                className="h-6 w-full border-0 p-0 text-center text-xs focus:ring-0"
                                autoFocus
                              />
                            ) : (
                              <div
                                className={`cursor-pointer text-xs ${
                                  value > 0
                                    ? 'rounded bg-blue-200 px-2 py-1 text-[#364878]'
                                    : 'text-gray-700'
                                }`}
                                onClick={() => handleCellEdit(cellId, value)}
                              >
                                {value > 0 ? value.toFixed(3) : '-'}
                              </div>
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
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
              {months.map(month =>
                month.weeks.map(weekObj => (
                  <td
                    key={`kumulatif-header-${month.month}-${weekObj.week}`}
                    className="border-b border-gray-200"
                  ></td>
                ))
              )}
            </tr>

            {/* Rencana Row */}
            <tr>
              <td className="border-b border-gray-200 px-6 py-1.5 text-xs font-semibold text-gray-700">
                Rencana
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map(month =>
                month.weeks.map(weekObj => (
                  <td
                    key={`rencana-${month.month}-${weekObj.week}`}
                    className="border-b border-gray-200 px-6 py-1.5 text-center text-xs text-[#364878]"
                  >
                    0.148
                  </td>
                ))
              )}
            </tr>

            {/* Realisasi Row */}
            <tr>
              <td className="border-b border-gray-200 px-6 py-1.5 text-xs font-semibold text-gray-700">
                Realisasi
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map(month =>
                month.weeks.map(weekObj => (
                  <td
                    key={`realisasi-${month.month}-${weekObj.week}`}
                    className="border-b border-gray-200 bg-[#ffc928] px-6 py-1.5 text-center text-xs text-[#364878]"
                  >
                    0.148
                  </td>
                ))
              )}
            </tr>

            {/* Deviasi Row */}
            <tr>
              <td className="border-b border-gray-200 px-6 py-1.5 text-xs font-semibold text-gray-700">
                Deviasi
              </td>
              <td className="border-b border-gray-200"></td>
              {months.map(month =>
                month.weeks.map(weekObj => (
                  <td
                    key={`deviasi-${month.month}-${weekObj.week}`}
                    className="border-b border-gray-200 px-6 py-1.5 text-center text-xs text-[#364878]"
                  >
                    0.148
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
    </div>
  )
}

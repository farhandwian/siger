'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, Loader2 } from 'lucide-react'
import {
  useResourceFlowData,
  useActivitiesForResourceFlow,
  useCreateResourceFlowSchedule,
  useUpdateResourceFlowSchedule,
  AnalisaKebutuhan,
} from '@/hooks/useResourceFlowQueries'
import { cn } from '@/lib/utils'

/**
 * Props for ResourceFlowTable component
 * Takes only a projectId since it manages its own selection state
 */
interface ResourceFlowTableProps {
  projectId: string
}

/**
 * Editable cell component for numeric input in the table
 */
interface EditableCellProps {
  value: number
  onChange: (value: number) => void
  isDisabled?: boolean
  className?: string
}

/**
 * Activity interface for dropdown data structure
 */
interface Activity {
  id: string
  nama: string
  sub_activities?: SubActivity[]
}

/**
 * Sub Activity interface for dropdown data structure
 */
interface SubActivity {
  id: string
  nama: string
  analisa_kebutuhan?: AnalisaKebutuhan[]
}

const EditableCell = ({ value, onChange, isDisabled = false, className }: EditableCellProps) => {
  const [localValue, setLocalValue] = useState(value.toString())
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString())
    }
  }, [value, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    const numValue = parseFloat(localValue) || 0
    if (numValue !== value) {
      onChange(numValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  if (isDisabled) {
    return (
      <div className={cn('py-1.5 text-center text-xs text-gray-700', className)}>
        {value.toLocaleString()}
      </div>
    )
  }

  return (
    <input
      type="number"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full border-none bg-transparent py-1.5 text-center text-xs outline-none',
        'focus:bg-blue-50 focus:ring-1 focus:ring-blue-200',
        className
      )}
    />
  )
}

export function ResourceFlowTable({ projectId }: ResourceFlowTableProps) {
  // State management for dropdown selections
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [selectedSubActivity, setSelectedSubActivity] = useState<string>('')
  const [selectedAnalisaKebutuhan, setSelectedAnalisaKebutuhan] = useState<string>('')

  // State management for table interactions
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loadingCell, setLoadingCell] = useState<string | null>(null)

  // API Hooks
  const { data: resourceFlowData, isLoading, error } = useResourceFlowData(projectId)
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useActivitiesForResourceFlow(projectId)
  const updateSchedule = useUpdateResourceFlowSchedule()
  const createSchedule = useCreateResourceFlowSchedule()

  // Debug logging
  console.log('Debug - Activities data:', activitiesData)
  console.log('Debug - Activities loading:', activitiesLoading)
  console.log('Debug - Activities error:', activitiesError)
  console.log('Debug - Resource flow data:', resourceFlowData)

  // Data processing: Get the selected analisa kebutuhan and its schedules
  const currentAnalisaKebutuhan = resourceFlowData?.find(
    item => item.id === selectedAnalisaKebutuhan
  )

  // Auto-select first available items when data loads
  useEffect(() => {
    if (activitiesData?.length && !selectedActivity) {
      const firstActivity = activitiesData[0]
      setSelectedActivity(firstActivity.id)

      if (firstActivity.sub_activities?.length && !selectedSubActivity) {
        const firstSubActivity = firstActivity.sub_activities[0]
        setSelectedSubActivity(firstSubActivity.id)

        if (firstSubActivity.analisa_kebutuhan?.length && !selectedAnalisaKebutuhan) {
          setSelectedAnalisaKebutuhan(firstSubActivity.analisa_kebutuhan[0].id)
        }
      }
    }
  }, [activitiesData, selectedActivity, selectedSubActivity, selectedAnalisaKebutuhan])

  // Auto-select first available sub activity when activity changes
  useEffect(() => {
    if (selectedActivity && activitiesData?.length) {
      const activity = activitiesData.find((a: Activity) => a.id === selectedActivity)
      if (activity?.sub_activities?.length) {
        const firstSubActivity = activity.sub_activities[0]
        setSelectedSubActivity(firstSubActivity.id)

        if (firstSubActivity.analisa_kebutuhan?.length) {
          setSelectedAnalisaKebutuhan(firstSubActivity.analisa_kebutuhan[0].id)
        }
      }
    }
  }, [selectedActivity, activitiesData])

  // Auto-select first available analisa kebutuhan when sub activity changes
  useEffect(() => {
    if (selectedSubActivity && activitiesData?.length) {
      const activity = activitiesData.find((a: Activity) => a.id === selectedActivity)
      const subActivity = activity?.sub_activities?.find(
        (sa: SubActivity) => sa.id === selectedSubActivity
      )
      if (subActivity?.analisa_kebutuhan?.length) {
        setSelectedAnalisaKebutuhan(subActivity.analisa_kebutuhan[0].id)
      }
    }
  }, [selectedSubActivity, selectedActivity, activitiesData])

  // Get current month for display based on selected month/year
  const currentMonth = new Date(selectedYear, selectedMonth - 1)
    .toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  // Generate date range for the selected month
  const generateDateColumns = () => {
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
    const monthEnd = new Date(selectedYear, selectedMonth, 0) // Last day of month

    const dates = []
    const currentDate = new Date(monthStart)

    while (currentDate <= monthEnd) {
      dates.push({
        date: currentDate.toISOString().split('T')[0],
        display: currentDate.getDate().toString(),
        fullDate: new Date(currentDate),
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  const dateColumns = generateDateColumns()

  // Calculate cumulative values for a specific date based on current analisa kebutuhan schedules
  const calculateRencanaKumulatif = (targetDate: string) => {
    if (!currentAnalisaKebutuhan?.resourceFlowSchedules) return 0

    return currentAnalisaKebutuhan.resourceFlowSchedules
      .filter((schedule: any) => schedule.tanggal <= targetDate)
      .reduce((sum: number, schedule: any) => sum + (schedule.rencana || 0), 0)
  }

  const calculateRealisasiKumulatif = (targetDate: string) => {
    if (!currentAnalisaKebutuhan?.resourceFlowSchedules) return 0

    return currentAnalisaKebutuhan.resourceFlowSchedules
      .filter((schedule: any) => schedule.tanggal <= targetDate)
      .reduce((sum: number, schedule: any) => sum + (schedule.realisasi || 0), 0)
  }

  // Handle cell editing
  const handleCellEdit = (cellId: string, currentValue: number | null) => {
    setEditingCell(cellId)
    setEditValue(currentValue !== null ? currentValue.toString() : '')
  }

  // Handle saving schedule data
  const handleCellSave = async (
    scheduleId: string | undefined,
    field: 'rencana' | 'realisasi',
    date: string,
    analisaKebutuhanId: string
  ) => {
    const numericValue = editValue === '' ? 0 : parseFloat(editValue)
    const value = !isNaN(numericValue) ? numericValue : 0

    const cellId = `${field}-${date}`
    setLoadingCell(cellId)

    console.log('Saving resource flow schedule:', {
      scheduleId,
      field,
      date,
      analisaKebutuhanId,
      value,
      editValue,
    })

    try {
      // Only send the field being updated - API will preserve other fields
      const scheduleData = {
        analisaKebutuhanId,
        tanggal: date,
        [field]: value, // Only send the field being updated
      }

      console.log('Schedule data to upsert (field-specific):', scheduleData)
      await createSchedule.mutateAsync(scheduleData)

      setEditingCell(null)
      setEditValue('')
      console.log('Resource flow schedule saved successfully')
    } catch (error) {
      console.error('Error saving resource flow schedule:', error)
      // Don't reset the cell if there was an error, let user try again
    } finally {
      setLoadingCell(null)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Get dropdown options
  const getActivityOptions = (): Activity[] => activitiesData || []

  const getSubActivityOptions = (): SubActivity[] => {
    const activity = activitiesData?.find((a: Activity) => a.id === selectedActivity)
    return activity?.sub_activities || []
  }

  const getAnalisaKebutuhanOptions = (): AnalisaKebutuhan[] => {
    const activity = activitiesData?.find((a: Activity) => a.id === selectedActivity)
    const subActivity = activity?.sub_activities?.find(
      (sa: SubActivity) => sa.id === selectedSubActivity
    )
    return subActivity?.analisa_kebutuhan || []
  }

  // Loading state
  if (isLoading || activitiesLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-gray-500">Loading resource flow data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || activitiesError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600">
          Error loading data: {error?.message || activitiesError?.message}
        </p>
      </div>
    )
  }

  // No data state
  if (!activitiesData?.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">
          Belum ada data kegiatan. Silakan tambah kegiatan terlebih dahulu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 lg:space-y-3 xl:space-y-4">
      {/* Resource Flow Selection Dropdowns */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-2 lg:p-3 xl:p-4">
          <div className="space-y-3 lg:space-y-4 xl:space-y-6">
            {/* Selection Controls */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4 xl:gap-6">
              {/* Activity Selector */}
              <div className="space-y-0.5 lg:space-y-1">
                <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                  Pilih Pekerjaan
                </label>
                <div className="relative">
                  <select
                    value={selectedActivity}
                    onChange={e => setSelectedActivity(e.target.value)}
                    className="w-full appearance-none border-b border-gray-200 bg-white px-2 py-1 pr-8 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs"
                  >
                    <option value="">-- Pilih Pekerjaan --</option>
                    {getActivityOptions().map((activity: Activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 lg:h-4 lg:w-4" />
                </div>
              </div>

              {/* Sub Activity Selector */}
              <div className="space-y-0.5 lg:space-y-1">
                <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                  Pilih Kegiatan
                </label>
                <div className="relative">
                  <select
                    value={selectedSubActivity}
                    onChange={e => setSelectedSubActivity(e.target.value)}
                    disabled={!selectedActivity}
                    className="w-full appearance-none border-b border-gray-200 bg-white px-2 py-1 pr-8 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs"
                  >
                    <option value="">-- Pilih Kegiatan --</option>
                    {getSubActivityOptions().map((subActivity: SubActivity) => (
                      <option key={subActivity.id} value={subActivity.id}>
                        {subActivity.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 lg:h-4 lg:w-4" />
                </div>
              </div>

              {/* Analisa Kebutuhan Selector */}
              <div className="space-y-0.5 lg:space-y-1">
                <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                  Pilih Analisa Kebutuhan
                </label>
                <div className="relative">
                  <select
                    value={selectedAnalisaKebutuhan}
                    onChange={e => setSelectedAnalisaKebutuhan(e.target.value)}
                    disabled={!selectedSubActivity}
                    className="w-full appearance-none border-b border-gray-200 bg-white px-2 py-1 pr-8 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs"
                  >
                    <option value="">-- Pilih Analisa Kebutuhan --</option>
                    {getAnalisaKebutuhanOptions().map((analisa: any) => (
                      <option key={analisa.id} value={analisa.id}>
                        {analisa.kebutuhan.nama} - {analisa.kebutuhan.kategoriKebutuhan.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 lg:h-4 lg:w-4" />
                </div>
              </div>
            </div>

            {/* Resource Information Display */}
            {currentAnalisaKebutuhan && (
              <div className="border-t border-gray-100 pt-3 lg:pt-4 xl:pt-6">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4 xl:gap-6">
                  <div className="space-y-0.5 lg:space-y-1">
                    <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                      Jenis Kebutuhan
                    </label>
                    <div className="w-full border-b border-gray-200 bg-gray-50 px-2 py-1 text-[9px] text-gray-600 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs">
                      {currentAnalisaKebutuhan.kebutuhan.nama}
                    </div>
                  </div>

                  <div className="space-y-0.5 lg:space-y-1">
                    <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                      Kategori
                    </label>
                    <div className="w-full border-b border-gray-200 bg-gray-50 px-2 py-1 text-[9px] text-gray-600 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs">
                      {currentAnalisaKebutuhan.kebutuhan.kategoriKebutuhan.nama}
                    </div>
                  </div>

                  <div className="space-y-0.5 lg:space-y-1">
                    <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                      Koefisien
                    </label>
                    <div className="w-full border-b border-gray-200 bg-gray-50 px-2 py-1 text-[9px] text-gray-600 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs">
                      {currentAnalisaKebutuhan.koefisien.toLocaleString()} unit
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Table */}
      {currentAnalisaKebutuhan && (
        <div className="space-y-2 lg:space-y-3 xl:space-y-4">
          <h3 className="text-[10px] font-medium text-gray-700 lg:text-xs xl:text-base">
            Tabel Progress {currentAnalisaKebutuhan.kebutuhan.nama}
          </h3>

          {/* Month Picker */}
          <div className="w-48 lg:w-56 xl:w-64">
            <div className="relative">
              <div className="rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm lg:px-3 lg:py-1.5 xl:px-4 xl:py-2">
                <div className="flex items-center justify-between gap-1 lg:gap-2">
                  <button
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12)
                        setSelectedYear(selectedYear - 1)
                      } else {
                        setSelectedMonth(selectedMonth - 1)
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <svg
                      className="h-3 w-3 text-gray-400 lg:h-4 lg:w-4 xl:h-5 xl:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-sm">
                      {currentMonth}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1)
                        setSelectedYear(selectedYear + 1)
                      } else {
                        setSelectedMonth(selectedMonth + 1)
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 bg-[#fcfcfd] px-2 py-1.5 text-left lg:px-3 lg:py-2 xl:px-6 xl:py-3">
                      <span className="text-[9px] font-bold text-gray-700 lg:text-[10px] xl:text-xs">
                        Pelaksanaan
                      </span>
                    </th>
                    <th
                      className="border-b border-gray-200 bg-[#364878] px-2 py-1 text-center lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5"
                      colSpan={dateColumns.length}
                    >
                      <span className="text-[9px] font-bold text-white lg:text-[10px] xl:text-xs">
                        {currentMonth.split(' ')[0]}
                      </span>
                    </th>
                  </tr>
                  <tr>
                    <th className="border-b border-gray-200"></th>
                    {dateColumns.map(col => (
                      <th
                        key={col.date}
                        className="min-w-[40px] border-b border-gray-200 bg-[#80a9da] px-2 py-1 text-center lg:min-w-[50px] lg:px-3 lg:py-1.5 xl:min-w-[67px] xl:px-6 xl:py-1.5"
                      >
                        <span className="text-[8px] font-bold text-white lg:text-[9px] xl:text-xs">
                          {col.display}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Rencana Row */}
                  <tr>
                    <td className="border-b border-gray-200 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5">
                      <span className="text-[9px] font-medium text-gray-900 lg:text-[10px] xl:text-xs">
                        Rencana
                      </span>
                    </td>
                    {dateColumns.map(col => {
                      const schedule = currentAnalisaKebutuhan.resourceFlowSchedules?.find(
                        s => s.tanggal === col.date
                      )
                      const cellId = `rencana-${col.date}`
                      const value = schedule?.rencana || 0
                      const isEditing = editingCell === cellId
                      const isLoading = loadingCell === cellId

                      return (
                        <td
                          key={col.date}
                          className="border-b border-gray-200 px-2 py-1 text-center lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5"
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() =>
                                  handleCellSave(
                                    schedule?.id,
                                    'rencana',
                                    col.date,
                                    currentAnalisaKebutuhan.id
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(
                                      schedule?.id,
                                      'rencana',
                                      col.date,
                                      currentAnalisaKebutuhan.id
                                    )
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel()
                                  }
                                }}
                                className="h-4 w-full border-0 bg-transparent p-0 text-center text-[8px] focus:ring-0 lg:h-5 lg:text-[9px] xl:h-6 xl:text-xs"
                                autoFocus
                                type="number"
                              />
                              {isLoading && (
                                <Loader2 className="ml-1 h-2 w-2 animate-spin text-blue-500 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3" />
                              )}
                            </div>
                          ) : (
                            <div
                              className="flex cursor-pointer items-center justify-center text-[8px] font-medium text-gray-700 hover:bg-gray-50 lg:text-[9px] xl:text-xs"
                              onClick={() => handleCellEdit(cellId, value)}
                            >
                              {value !== null && value !== undefined
                                ? value === 0
                                  ? '0'
                                  : value.toLocaleString()
                                : '-'}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Rencana Kumulatif Row */}
                  <tr>
                    <td className="border-b border-gray-200 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5">
                      <span className="text-[9px] font-medium text-gray-900 lg:text-[10px] xl:text-xs">
                        Rencana Kumulatif
                      </span>
                    </td>
                    {dateColumns.map(col => {
                      const kumulatifValue = calculateRencanaKumulatif(col.date)
                      return (
                        <td
                          key={col.date}
                          className="border-b border-gray-200 bg-gray-50 px-2 py-1 text-center lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5"
                        >
                          <div className="text-[8px] text-gray-600 lg:text-[9px] xl:text-xs">
                            {kumulatifValue.toLocaleString()}
                          </div>
                        </td>
                      )
                    })}
                  </tr>

                  {/* Realisasi Row */}
                  <tr>
                    <td className="border-b border-gray-200 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5">
                      <span className="text-[9px] font-medium text-gray-900 lg:text-[10px] xl:text-xs">
                        Realisasi
                      </span>
                    </td>
                    {dateColumns.map(col => {
                      const schedule = currentAnalisaKebutuhan.resourceFlowSchedules?.find(
                        s => s.tanggal === col.date
                      )
                      const cellId = `realisasi-${col.date}`
                      const value = schedule?.realisasi || 0
                      const isEditing = editingCell === cellId
                      const isLoading = loadingCell === cellId

                      return (
                        <td
                          key={col.date}
                          className="border-b border-gray-200 px-6 py-1.5 text-center"
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() =>
                                  handleCellSave(
                                    schedule?.id,
                                    'realisasi',
                                    col.date,
                                    currentAnalisaKebutuhan.id
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(
                                      schedule?.id,
                                      'realisasi',
                                      col.date,
                                      currentAnalisaKebutuhan.id
                                    )
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel()
                                  }
                                }}
                                className="h-6 w-full border-0 bg-transparent p-0 text-center text-xs focus:ring-0"
                                autoFocus
                                type="number"
                              />
                              {isLoading && (
                                <Loader2 className="ml-1 h-3 w-3 animate-spin text-blue-500" />
                              )}
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-50"
                              onClick={() => handleCellEdit(cellId, value)}
                            >
                              {value !== null && value !== undefined
                                ? value === 0
                                  ? '0'
                                  : value.toLocaleString()
                                : '-'}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* Realisasi Kumulatif Row */}
                  <tr>
                    <td className="border-b border-gray-200 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5">
                      <span className="text-[9px] font-medium text-gray-900 lg:text-[10px] xl:text-xs">
                        Realisasi Kumulatif
                      </span>
                    </td>
                    {dateColumns.map(col => {
                      const kumulatifValue = calculateRealisasiKumulatif(col.date)
                      return (
                        <td
                          key={col.date}
                          className="border-b border-gray-200 bg-gray-50 px-2 py-1 text-center lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5"
                        >
                          <div className="text-[8px] text-gray-600 lg:text-[9px] xl:text-xs">
                            {kumulatifValue.toLocaleString()}
                          </div>
                        </td>
                      )
                    })}
                  </tr>

                  {/* Tercapai Row */}
                  <tr>
                    <td className="border-b border-gray-200 bg-gray-100 px-2 py-1 lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5">
                      <span className="text-[9px] font-medium text-gray-900 lg:text-[10px] xl:text-xs">
                        Tercapai
                      </span>
                    </td>
                    {dateColumns.map(col => {
                      const schedule = currentAnalisaKebutuhan.resourceFlowSchedules?.find(
                        s => s.tanggal === col.date
                      )
                      // For resource flow, we'll calculate if targets are met based on rencana vs realisasi
                      const rencana = schedule?.rencana || 0
                      const realisasi = schedule?.realisasi || 0
                      const tercapai = realisasi >= rencana ? 'Y' : 'N'

                      return (
                        <td
                          key={col.date}
                          className={cn(
                            'border-b border-gray-200 px-2 py-1 text-center lg:px-3 lg:py-1.5 xl:px-6 xl:py-1.5',
                            tercapai === 'Y' ? 'bg-emerald-500' : 'bg-red-500'
                          )}
                        >
                          <span className="text-[9px] font-bold text-white lg:text-[10px] xl:text-sm">
                            {tercapai}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

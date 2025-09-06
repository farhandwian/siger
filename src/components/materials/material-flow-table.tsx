'use client'

import { useState, useEffect } from 'react'
import { AutoSaveMaterialField } from '@/components/ui/auto-save-material-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, ChevronDown, Loader2 } from 'lucide-react'
import {
  useDeleteMaterial,
  useUpdateMaterialSchedule,
  useCreateMaterialSchedule,
  Material,
} from '@/hooks/useMaterialQueries'
import { cn } from '@/lib/utils'

interface MaterialFlowTableProps {
  materials: Material[]
  selectedMaterial: string
  onMaterialChange: (material: string) => void
}

interface EditableCellProps {
  value: number
  onChange: (value: number) => void
  isDisabled?: boolean
  className?: string
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

export function MaterialFlowTable({
  materials,
  selectedMaterial,
  onMaterialChange,
}: MaterialFlowTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loadingCell, setLoadingCell] = useState<string | null>(null)

  const deleteMaterial = useDeleteMaterial()
  const updateSchedule = useUpdateMaterialSchedule()
  const createSchedule = useCreateMaterialSchedule()

  // Find the selected material
  const currentMaterial = materials.find(m => m.jenisMaterial === selectedMaterial) || materials[0]

  // Update parent component when material selection changes
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterial) {
      onMaterialChange(materials[0].jenisMaterial)
    }
  }, [materials, selectedMaterial, onMaterialChange])

  // Initialize selected month based on current material's start date
  useEffect(() => {
    if (currentMaterial?.tanggalMulai) {
      const startDate = new Date(currentMaterial.tanggalMulai)
      setSelectedMonth(startDate.getMonth() + 1)
      setSelectedYear(startDate.getFullYear())
    }
  }, [currentMaterial])

  // Get current month for display based on selected month/year
  const currentMonth = new Date(selectedYear, selectedMonth - 1)
    .toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  // Generate date range based on selected month and material date range
  const generateDateColumns = (material: Material) => {
    if (!material?.tanggalMulai || !material?.tanggalSelesai) return []

    const materialStart = new Date(material.tanggalMulai)
    const materialEnd = new Date(material.tanggalSelesai)

    // Get first and last day of selected month
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
    const monthEnd = new Date(selectedYear, selectedMonth, 0) // Last day of month

    // Use the overlapping period between material dates and selected month
    const startDate = materialStart > monthStart ? materialStart : monthStart
    const endDate = materialEnd < monthEnd ? materialEnd : monthEnd

    const dates = []

    // Only generate dates if there's an overlap
    if (startDate <= endDate) {
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push({
          date: currentDate.toISOString().split('T')[0],
          display: currentDate.getDate().toString(),
          fullDate: new Date(currentDate),
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return dates
  }

  const dateColumns = currentMaterial ? generateDateColumns(currentMaterial) : []

  // Calculate cumulative values for a specific date
  const calculateRencanaKumulatif = (targetDate: string) => {
    if (!currentMaterial?.schedules) return 0

    return dateColumns
      .filter(col => col.date <= targetDate)
      .reduce((sum, col) => {
        const schedule = currentMaterial.schedules?.find(s => s.date === col.date)
        return sum + (schedule?.rencana || 0)
      }, 0)
  }

  const calculateRealisasiKumulatif = (targetDate: string) => {
    if (!currentMaterial?.schedules) return 0

    return dateColumns
      .filter(col => col.date <= targetDate)
      .reduce((sum, col) => {
        const schedule = currentMaterial.schedules?.find(s => s.date === col.date)
        return sum + (schedule?.realisasi || 0)
      }, 0)
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus material ini?')) {
      try {
        const materialToDelete = materials.find(m => m.id === materialId)
        if (materialToDelete) {
          await deleteMaterial.mutateAsync({
            id: materialId,
            projectId: materialToDelete.projectId,
          })
        }
      } catch (error) {
        console.error('Failed to delete material:', error)
      }
    }
  }

  const handleCellEdit = (cellId: string, currentValue: number | null) => {
    setEditingCell(cellId)
    setEditValue(currentValue !== null ? currentValue.toString() : '')
  }

  const handleCellSave = async (
    scheduleId: string | undefined,
    field: 'rencana' | 'realisasi' | 'rencanaKumulatif' | 'realisasiKumulatif',
    date: string,
    materialId: string
  ) => {
    const numericValue = editValue === '' ? 0 : parseFloat(editValue)
    const value = !isNaN(numericValue) ? numericValue : 0

    const cellId = `${field}-${date}`
    setLoadingCell(cellId)

    console.log('Saving cell:', { scheduleId, field, date, materialId, value, editValue })

    try {
      // Always use the create endpoint which now handles upsert
      const existingSchedule = currentMaterial.schedules?.find(s => s.date === date)

      let scheduleData = {
        materialId,
        date,
        rencana: existingSchedule?.rencana || 0,
        rencanaKumulatif: existingSchedule?.rencanaKumulatif || 0,
        realisasi: existingSchedule?.realisasi || 0,
        realisasiKumulatif: existingSchedule?.realisasiKumulatif || 0,
        // Override the specific field being updated
        [field]: value,
      }

      // Recalculate cumulative values based on the updated data
      if (field === 'rencana') {
        // Update the schedule data temporarily to calculate cumulative
        const tempSchedules = [...(currentMaterial.schedules || [])]
        const existingIndex = tempSchedules.findIndex(s => s.date === date)
        if (existingIndex >= 0) {
          tempSchedules[existingIndex] = { ...tempSchedules[existingIndex], rencana: value }
        } else {
          tempSchedules.push({ ...scheduleData, rencana: value })
        }

        // Calculate cumulative for this date and update
        scheduleData.rencanaKumulatif = dateColumns
          .filter(col => col.date <= date)
          .reduce((sum, col) => {
            const schedule = tempSchedules.find(s => s.date === col.date)
            return sum + (schedule?.rencana || 0)
          }, 0)
      } else if (field === 'realisasi') {
        // Similar calculation for realisasi
        const tempSchedules = [...(currentMaterial.schedules || [])]
        const existingIndex = tempSchedules.findIndex(s => s.date === date)
        if (existingIndex >= 0) {
          tempSchedules[existingIndex] = { ...tempSchedules[existingIndex], realisasi: value }
        } else {
          tempSchedules.push({ ...scheduleData, realisasi: value })
        }

        scheduleData.realisasiKumulatif = dateColumns
          .filter(col => col.date <= date)
          .reduce((sum, col) => {
            const schedule = tempSchedules.find(s => s.date === col.date)
            return sum + (schedule?.realisasi || 0)
          }, 0)
      }

      console.log('Schedule data to upsert:', scheduleData)
      await createSchedule.mutateAsync(scheduleData)

      setEditingCell(null)
      setEditValue('')
      console.log('Cell saved successfully')
    } catch (error) {
      console.error('Error saving schedule:', error)
      // Don't reset the cell if there was an error, let user try again
    } finally {
      setLoadingCell(null)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">
          Belum ada data material. Silakan tambah material terlebih dahulu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 lg:space-y-3 xl:space-y-4">
      {/* Material Information Form */}
      {currentMaterial && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-2 lg:p-3 xl:p-4">
            <div className="space-y-3 lg:space-y-4 xl:space-y-6">
              {/* Material Basic Info */}
              <div className="flex items-start gap-2 lg:gap-3">
                <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:gap-6">
                  <div className="space-y-0.5 lg:space-y-1">
                    <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                      Jenis Material
                    </label>
                    <AutoSaveMaterialField
                      value={currentMaterial.jenisMaterial}
                      onChange={value => {}}
                      materialId={currentMaterial.id}
                      fieldName="jenisMaterial"
                    />
                  </div>

                  <div className="space-y-0.5 lg:space-y-1">
                    <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                      Volume Satuan
                    </label>
                    <select
                      className="w-full border-b border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-700 transition-colors focus:border-blue-500 focus:outline-none lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs"
                      defaultValue={currentMaterial.volumeSatuan}
                    >
                      <option value="m3">m3</option>
                      <option value="buah">buah</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => handleDeleteMaterial(currentMaterial.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 bg-red-500 px-2 py-1 text-[9px] text-white hover:bg-red-600 lg:px-3 lg:py-1.5 lg:text-[10px] xl:text-xs"
                >
                  <Trash2 className="mr-1 h-3 w-3 lg:mr-2 lg:h-4 lg:w-4" />
                  Hapus Material
                </Button>
              </div>

              {/* Volume and Dates */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:gap-6">
                <div className="space-y-0.5 lg:space-y-1">
                  <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                    Volume Target (
                    {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan})
                  </label>
                  <AutoSaveMaterialField
                    value={currentMaterial.volumeTarget?.toString() || '0'}
                    onChange={() => {}}
                    materialId={currentMaterial.id}
                    fieldName="volumeTarget"
                    type="number"
                  />
                </div>

                <div className="space-y-0.5 lg:space-y-1">
                  <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                    Volume Realisasi
                  </label>
                  <div className="w-full border-b border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-400 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs">
                    {currentMaterial.schedules?.[
                      currentMaterial.schedules.length - 1
                    ]?.realisasiKumulatif?.toLocaleString() || '0'}{' '}
                    {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4 xl:gap-6">
                <div className="space-y-0.5 lg:space-y-1">
                  <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                    Tanggal Mulai
                  </label>
                  <AutoSaveMaterialField
                    value={currentMaterial.tanggalMulai || ''}
                    onChange={() => {}}
                    materialId={currentMaterial.id}
                    fieldName="tanggalMulai"
                    type="date"
                  />
                </div>

                <div className="space-y-0.5 lg:space-y-1">
                  <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                    Tanggal Selesai
                  </label>
                  <AutoSaveMaterialField
                    value={currentMaterial.tanggalSelesai || ''}
                    onChange={() => {}}
                    materialId={currentMaterial.id}
                    fieldName="tanggalSelesai"
                    type="date"
                  />
                </div>

                <div className="space-y-0.5 lg:space-y-1">
                  <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
                    Waktu Selesai (Hari)
                  </label>
                  <AutoSaveMaterialField
                    value={currentMaterial.waktuSelesai?.toString() || '0'}
                    onChange={() => {}}
                    materialId={currentMaterial.id}
                    fieldName="waktuSelesai"
                    type="number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Table */}
      {currentMaterial && (
        <div className="space-y-2 lg:space-y-3 xl:space-y-4">
          <h3 className="text-[10px] font-medium text-gray-700 lg:text-xs xl:text-base">
            Tabel Progress {currentMaterial.jenisMaterial}
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
                      const schedule = currentMaterial.schedules?.find(s => s.date === col.date)
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
                                    currentMaterial.id
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(
                                      schedule?.id,
                                      'rencana',
                                      col.date,
                                      currentMaterial.id
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
                      const schedule = currentMaterial.schedules?.find(s => s.date === col.date)
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
                                    currentMaterial.id
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(
                                      schedule?.id,
                                      'realisasi',
                                      col.date,
                                      currentMaterial.id
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
                      const schedule = currentMaterial.schedules?.find(s => s.date === col.date)
                      const tercapai = schedule?.tercapai || 'Y'
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

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Settings2, X, Search, ChevronDown, Plus, Trash2, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Types
interface Activity {
  id: string
  name: string
  subActivities: SubActivity[]
}

interface SubActivity {
  id: string
  name: string
  satuan?: string
  volumeKontrak?: number
  weight: number
}

interface Project {
  id: string
  masaKontrak?: string
}

interface CategoryItem {
  id: string
  name: string
  kategoriKebutuhanId: string
}

interface Category {
  id: string
  nama: string
}

interface AnalisaKebutuhanEntry {
  kategoriKebutuhanId: string
  kebutuhanId: string
  koefisien: number
  categoryName: string
  itemName: string
}

// Schemas
const AnalisaKebutuhanFormSchema = z.object({
  subActivityId: z.string().min(1, 'Sub activity harus dipilih'),
  entries: z
    .array(
      z.object({
        kategoriKebutuhanId: z.string().min(1, 'Kategori kebutuhan harus dipilih'),
        kebutuhanId: z.string().min(1, 'Kebutuhan harus dipilih'),
        koefisien: z.number().min(0, 'Koefisien harus ≥ 0'),
        categoryName: z.string(),
        itemName: z.string(),
      })
    )
    .min(1, 'Minimal satu kebutuhan harus ditambahkan'),
})

type AnalisaKebutuhanFormData = z.infer<typeof AnalisaKebutuhanFormSchema>

interface BuatAnalisaKebutuhanModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess?: () => void
}

export function BuatAnalisaKebutuhanModal({
  isOpen,
  onOpenChange,
  projectId,
  onSuccess,
}: BuatAnalisaKebutuhanModalProps) {
  // States
  const [selectedSubActivityId, setSelectedSubActivityId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [currentDate] = useState(new Date().toISOString().split('T')[0])

  const queryClient = useQueryClient()

  // Fetch data
  const { data: activitiesData } = useQuery<{ success: boolean; data: Activity[] }>({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/activities`)
      return response.json()
    },
    enabled: !!projectId,
  })

  const { data: projectData } = useQuery<{ success: boolean; data: Project }>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      return response.json()
    },
    enabled: !!projectId,
  })

  const { data: categoriesData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/analisa-kebutuhan/categories')
      return response.json()
    },
  })

  const { data: kebutuhanData } = useQuery<{ success: boolean; data: CategoryItem[] }>({
    queryKey: ['kebutuhan'],
    queryFn: async () => {
      const response = await fetch('/api/analisa-kebutuhan/kebutuhan')
      return response.json()
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (entries: AnalisaKebutuhanEntry[]) => {
      const promises = entries.map(entry =>
        fetch('/api/analisa-kebutuhan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subActivityId: selectedSubActivityId,
            kebutuhanId: entry.kebutuhanId,
            koefisien: entry.koefisien,
            stokHarian: 0,
            terpasang: 0,
            totalSisaStokHariIni: 0,
            tanggal: currentDate,
          }),
        })
      )

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisa-kebutuhan-grouped'] })
      onSuccess?.()
      onOpenChange(false)
      reset()
      setSelectedSubActivityId('')
    },
  })

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    reset,
    setValue,
  } = useForm<AnalisaKebutuhanFormData>({
    resolver: zodResolver(AnalisaKebutuhanFormSchema),
    defaultValues: {
      subActivityId: '',
      entries: [],
    },
  })

  const {
    fields: entriesFields,
    append: appendEntry,
    remove: removeEntry,
  } = useFieldArray({
    control,
    name: 'entries',
  })

  // Data processing
  const activities = activitiesData?.data || []
  const project = projectData?.data
  const categories = categoriesData?.data || []
  const kebutuhanItems = kebutuhanData?.data || []

  // Find selected sub-activity
  const selectedSubActivity = activities
    .flatMap(a => a.subActivities)
    .find(sa => sa.id === selectedSubActivityId)

  // Group kebutuhan by category
  const kebutuhanByCategory = categories.reduce(
    (acc, category) => {
      acc[category.id] = {
        name: category.nama,
        items: kebutuhanItems.filter(item => item.kategoriKebutuhanId === category.id),
      }
      return acc
    },
    {} as Record<string, { name: string; items: CategoryItem[] }>
  )

  // Calculate volume per hari
  const calculateVolumePerHari = () => {
    if (!selectedSubActivity?.volumeKontrak || !project?.masaKontrak) return 0
    const masaKontrakDays = parseInt(project.masaKontrak) || 1
    return selectedSubActivity.volumeKontrak / masaKontrakDays
  }

  // Calculate volume target per minggu
  const calculateVolumeTargetPerMinggu = () => {
    const volumePerHari = calculateVolumePerHari()
    return volumePerHari * 7 // 7 hari dalam seminggu
  }

  // Filter activities based on search
  const filteredActivities = activities.filter(
    activity =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.subActivities.some(sa => sa.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Toggle activity expansion
  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  // Select sub-activity
  const selectSubActivity = (subActivity: SubActivity) => {
    setSelectedSubActivityId(subActivity.id)
    setValue('subActivityId', subActivity.id)
    // Add initial entry when sub-activity is selected
    if (entriesFields.length === 0) {
      appendEntry({
        kategoriKebutuhanId: '',
        kebutuhanId: '',
        koefisien: 0,
        categoryName: '',
        itemName: '',
      })
    }
  }

  // Add new entry
  const addEntry = () => {
    appendEntry({
      kategoriKebutuhanId: '',
      kebutuhanId: '',
      koefisien: 0,
      categoryName: '',
      itemName: '',
    })
  }

  // Calculate hasil for entry
  const calculateHasil = (koefisien: number) => {
    const volumePerHari = calculateVolumePerHari()
    return koefisien * volumePerHari
  }

  // Get unit for category
  const getUnitForCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return 'Unit/Hari'

    const lowerName = category.nama.toLowerCase()
    if (lowerName.includes('tenaga') || lowerName.includes('kerja')) {
      return 'Orang/Hari'
    } else if (lowerName.includes('bahan')) {
      return 'm²/Hari'
    } else if (lowerName.includes('alat')) {
      return 'unit/Hari'
    }
    return 'Unit/Hari'
  }

  // Get kebutuhan items for selected category
  const getKebutuhanForCategory = (categoryId: string) => {
    return kebutuhanItems.filter(item => item.kategoriKebutuhanId === categoryId)
  }

  // Form submission
  const onSubmit = async (data: AnalisaKebutuhanFormData) => {
    if (!selectedSubActivityId) return

    await createMutation.mutateAsync(data.entries)
  }

  // Handle modal close
  const handleClose = () => {
    onOpenChange(false)
    reset()
    setSelectedSubActivityId('')
    setSearchQuery('')
    setExpandedActivities(new Set())
  }

  const isLoading = createMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[900px] max-w-[1303px] gap-0 rounded-2xl p-0">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gray-700" />
              <DialogTitle className="text-lg font-medium text-gray-900">
                Buat Analisa Kebutuhan
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex h-[833px]">
          {/* Left Sidebar - Activities Tree */}
          <div className="w-64 overflow-y-auto border-r border-gray-200 p-4">
            {/* Search */}
            <div className="mb-4">
              <Label className="font-medium text-gray-700">Pekerjaan</Label>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Cari Pekerjaan"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Activities List */}
            <div className="space-y-1">
              {filteredActivities.map(activity => (
                <div key={activity.id}>
                  {/* Activity Header */}
                  <button
                    onClick={() => toggleActivity(activity.id)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-gray-50"
                  >
                    <span className="truncate text-sm font-medium text-gray-700">
                      {activity.name}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        expandedActivities.has(activity.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Sub-activities */}
                  {expandedActivities.has(activity.id) && (
                    <div className="ml-4 space-y-1">
                      {activity.subActivities.map(subActivity => (
                        <button
                          key={subActivity.id}
                          onClick={() => selectSubActivity(subActivity)}
                          className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                            selectedSubActivityId === subActivity.id
                              ? 'bg-blue-100 font-medium text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {subActivity.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedSubActivity ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Sub-activity Title */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-700">{selectedSubActivity.name}</h3>
                </div>

                {/* Volume Information */}
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Volume</Label>
                    <div className="mt-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      {selectedSubActivity.volumeKontrak || 0} {selectedSubActivity.satuan || 'm³'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Waktu Pelaksanaan</Label>
                    <div className="mt-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      {project?.masaKontrak || 0} Hari
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Volume Perhari</Label>
                    <div className="mt-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      {calculateVolumePerHari().toFixed(2)} {selectedSubActivity.satuan || 'm³'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Volume Target Perminggu
                    </Label>
                    <div className="mt-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      {calculateVolumeTargetPerMinggu().toFixed(2)}{' '}
                      {selectedSubActivity.satuan || 'm³'}/Minggu
                    </div>
                  </div>
                </div>

                {/* Analisa Kebutuhan Form */}
                <div className="space-y-4">
                  <Card className="bg-gray-100">
                    <CardContent className="p-3">
                      {/* Main Content with sidebar layout */}
                      <div className="flex gap-3">
                        {/* Left side - Form fields */}
                        <div className="flex-1 space-y-3">
                          {/* Kategori Kebutuhan Dropdown - Full Width */}
                          <div>
                            <Label className="mb-1 block text-sm font-medium text-gray-700">
                              Kategori Kebutuhan
                            </Label>
                            <Select
                              value={
                                entriesFields.length > 0
                                  ? watch(`entries.0.kategoriKebutuhanId`)
                                  : ''
                              }
                              onValueChange={value => {
                                const category = categories.find(cat => cat.id === value)
                                if (entriesFields.length === 0) {
                                  appendEntry({
                                    kategoriKebutuhanId: value,
                                    kebutuhanId: '',
                                    koefisien: 0,
                                    categoryName: category?.nama || '',
                                    itemName: '',
                                  })
                                } else {
                                  setValue(`entries.0.kategoriKebutuhanId`, value)
                                  setValue(`entries.0.categoryName`, category?.nama || '')
                                  setValue(`entries.0.kebutuhanId`, '')
                                  setValue(`entries.0.itemName`, '')
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Pilih Kategori Kebutuhan" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Entries */}
                          <div className="space-y-3">
                            {entriesFields.map((field, index) => (
                              <div key={field.id} className="space-y-3">
                                {/* Daftar Kebutuhan */}
                                <div>
                                  {index === 0 && (
                                    <Label className="mb-1 block text-sm font-medium text-gray-700">
                                      Daftar Kebutuhan
                                    </Label>
                                  )}
                                  <Select
                                    value={watch(`entries.${index}.kebutuhanId`)}
                                    onValueChange={value => {
                                      const item = getKebutuhanForCategory(
                                        watch(`entries.${index}.kategoriKebutuhanId`)
                                      ).find(item => item.id === value)
                                      setValue(`entries.${index}.kebutuhanId`, value)
                                      setValue(`entries.${index}.itemName`, item?.name || '')
                                    }}
                                    disabled={!watch(`entries.${index}.kategoriKebutuhanId`)}
                                  >
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="Pilih Kebutuhan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getKebutuhanForCategory(
                                        watch(`entries.${index}.kategoriKebutuhanId`)
                                      ).map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                          {item.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Calculation Row */}
                                <div className="flex items-end gap-3">
                                  {/* Koefisien */}
                                  <div className="w-[162px]">
                                    {index === 0 && (
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Koefisien
                                      </Label>
                                    )}
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Koefisien"
                                      {...register(`entries.${index}.koefisien`, {
                                        valueAsNumber: true,
                                      })}
                                      className="bg-white"
                                    />
                                  </div>

                                  <div className="w-6 pb-2 text-center text-sm font-medium text-gray-700">
                                    x
                                  </div>

                                  {/* Volume */}
                                  <div className="w-[162px]">
                                    {index === 0 && (
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Volume
                                      </Label>
                                    )}
                                    <div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400">
                                      {calculateVolumePerHari().toFixed(2)}{' '}
                                      {selectedSubActivity.satuan || 'm³'}
                                    </div>
                                  </div>

                                  <div className="w-[26px] pb-2 text-center text-sm font-medium text-gray-700">
                                    =
                                  </div>

                                  {/* Hasil */}
                                  <div className="w-[125px]">
                                    {index === 0 && (
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Hasil
                                      </Label>
                                    )}
                                    <div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400">
                                      {calculateHasil(
                                        watch(`entries.${index}.koefisien`) || 0
                                      ).toFixed(2)}{' '}
                                      unit
                                    </div>
                                  </div>

                                  {/* Hasil field */}
                                  <div className="w-[125px]">
                                    {index === 0 && (
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Analisa Kebutuhan
                                      </Label>
                                    )}
                                    <div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400">
                                      {calculateHasil(
                                        watch(`entries.${index}.koefisien`) || 0
                                      ).toFixed(2)}{' '}
                                      {getUnitForCategory(
                                        watch(`entries.${index}.kategoriKebutuhanId`)
                                      )}
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex gap-1.5">
                                    {/* Delete Button */}
                                    {entriesFields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeEntry(index)}
                                        className="h-9 w-9 p-2"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </Button>
                                    )}

                                    {/* Add Button - only show on last entry */}
                                    {index === entriesFields.length - 1 && (
                                      <Button
                                        type="button"
                                        onClick={addEntry}
                                        size="sm"
                                        className="h-9 w-9 bg-blue-500 p-2 text-white hover:bg-blue-600"
                                      >
                                        <Plus className="h-5 w-5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Add Button - Full width */}
                      <Button
                        type="button"
                        onClick={addEntry}
                        className="mt-3 w-full bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kebutuhan
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end border-t border-gray-200 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-yellow-400 font-medium text-blue-900 hover:bg-yellow-500"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>

                {/* Hidden field for form validation */}
                <input type="hidden" {...register('subActivityId')} />
              </form>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                  <Settings2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>Pilih sub-activity untuk mulai membuat analisa kebutuhan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

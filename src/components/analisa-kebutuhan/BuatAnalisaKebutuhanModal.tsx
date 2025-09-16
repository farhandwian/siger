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
import { useToast } from '@/components/ui/toast'
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
  nama: string // Changed from 'name' to 'nama' to match Prisma schema
  kategoriKebutuhanId: string
}

interface Category {
  id: string
  nama: string
}

interface AnalisaKebutuhanEntry {
  id?: string // Optional ID for existing entries (for updates)
  kategoriKebutuhanId: string
  kebutuhanId: string
  koefisien: number
  hasil: number
  satuanHasil: string
  hasilAnalisaKebutuhan: number
  satuanHasilAnalisaKebutuhan: string
  categoryName: string
  itemName: string
}

// Schemas
const AnalisaKebutuhanFormSchema = z.object({
  subActivityId: z.string().min(1, 'Sub activity harus dipilih'),
  entries: z
    .array(
      z.object({
        id: z.string().optional(), // Optional ID for existing entries
        kategoriKebutuhanId: z.string().min(1, 'Kategori kebutuhan harus dipilih'),
        kebutuhanId: z.string().min(1, 'Kebutuhan harus dipilih'),
        koefisien: z.number().min(0, 'Koefisien harus ≥ 0'),
        hasil: z.number().min(0, 'Hasil harus ≥ 0'),
        satuanHasil: z.string().min(1, 'Satuan hasil harus diisi'),
        hasilAnalisaKebutuhan: z.number().min(0, 'Hasil analisa kebutuhan harus ≥ 0'),
        satuanHasilAnalisaKebutuhan: z
          .string()
          .min(1, 'Satuan hasil analisa kebutuhan harus diisi'),
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

  const queryClient = useQueryClient()
  const { success, error } = useToast()

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
      const result = await response.json()
      return result
    },
  })

  const { data: kebutuhanData } = useQuery<{ success: boolean; data: CategoryItem[] }>({
    queryKey: ['kebutuhan'],
    queryFn: async () => {
      const response = await fetch('/api/analisa-kebutuhan/kebutuhan')
      const result = await response.json()
      return result
    },
  })

  // Fetch existing analisa kebutuhan for selected sub-activity
  const { data: existingAnalisaData, refetch: refetchExistingData } = useQuery<{
    success: boolean
    data: Array<{
      id: string
      subActivityId: string
      kebutuhanId: string
      koefisien: number
      hasil?: number
      satuanHasil?: string
      hasilAnalisaKebutuhan?: number
      satuanHasilAnalisaKebutuhan?: string
      stokHarian: number
      terpasang: number
      totalSisaStokHariIni: number
      kebutuhan: {
        id: string
        nama: string
        kategoriKebutuhanId: string
        kategoriKebutuhan: {
          id: string
          nama: string
        }
      }
    }>
  }>({
    queryKey: ['existing-analisa-kebutuhan', selectedSubActivityId],
    queryFn: async () => {
      const response = await fetch(`/api/analisa-kebutuhan?subActivityId=${selectedSubActivityId}`)
      const result = await response.json()
      return result
    },
    enabled: !!selectedSubActivityId,
  })

  // Create/Update mutation (Upsert)
  const upsertMutation = useMutation({
    mutationFn: async (entries: (AnalisaKebutuhanEntry & { id?: string })[]) => {
      const promises = entries.map(entry => {
        const payload = {
          subActivityId: selectedSubActivityId,
          kebutuhanId: entry.kebutuhanId,
          koefisien: entry.koefisien,
          hasil: entry.hasil,
          satuanHasil: entry.satuanHasil,
          hasilAnalisaKebutuhan: entry.hasilAnalisaKebutuhan,
          satuanHasilAnalisaKebutuhan: entry.satuanHasilAnalisaKebutuhan,
          stokHarian: 0,
          terpasang: 0,
          totalSisaStokHariIni: 0,
        }

        // If entry has an ID, it's an update (PUT), otherwise it's a create (POST)
        if (entry.id) {
          return fetch(`/api/analisa-kebutuhan/${entry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        } else {
          return fetch('/api/analisa-kebutuhan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
      })

      const responses = await Promise.all(promises)

      // Check if any requests failed
      const failedResponses = responses.filter(r => !r.ok)
      if (failedResponses.length > 0) {
        const errorDetails = await Promise.all(failedResponses.map(r => r.json()))
        throw new Error(
          `Failed to save ${failedResponses.length} entries: ${errorDetails.map(e => e.error).join(', ')}`
        )
      }

      const results = await Promise.all(responses.map(r => r.json()))
      return results
    },
    onSuccess: results => {
      const hasUpdates = results.some((r: any) => existingEntries.some(e => e.id === r.data?.id))
      const hasCreates = results.some((r: any) => !existingEntries.some(e => e.id === r.data?.id))

      let successMessage = ''
      if (hasUpdates && hasCreates) {
        successMessage = 'Analisa kebutuhan berhasil diperbarui dan ditambahkan!'
      } else if (hasUpdates) {
        successMessage = 'Analisa kebutuhan berhasil diperbarui!'
      } else {
        successMessage = 'Analisa kebutuhan berhasil ditambahkan!'
      }

      success('Berhasil!', successMessage, 4000)

      queryClient.invalidateQueries({ queryKey: ['analisa-kebutuhan-grouped'] })
      queryClient.invalidateQueries({ queryKey: ['existing-analisa-kebutuhan'] })
      onSuccess?.()
      onOpenChange(false)
      reset()
      setSelectedSubActivityId('')
    },
    onError: (err: Error) => {
      console.error('Error updating analisa kebutuhan:', err)
      error(
        'Gagal Menyimpan',
        err.message || 'Terjadi kesalahan saat menyimpan analisa kebutuhan. Silakan coba lagi.',
        6000
      )
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
  const existingEntries = existingAnalisaData?.data || []

  // Effect to populate form with existing data when sub-activity changes
  useEffect(() => {
    if (selectedSubActivityId && existingEntries.length > 0) {
      // Clear current entries safely using reset with new data
      const newEntries = existingEntries.map(entry => ({
        id: entry.id, // Include the ID for updates
        kategoriKebutuhanId: entry.kebutuhan.kategoriKebutuhanId,
        kebutuhanId: entry.kebutuhanId,
        koefisien: entry.koefisien,
        hasil: entry.hasil || 0,
        satuanHasil: entry.satuanHasil || '',
        hasilAnalisaKebutuhan: entry.hasilAnalisaKebutuhan || 0,
        satuanHasilAnalisaKebutuhan: entry.satuanHasilAnalisaKebutuhan || '',
        categoryName: entry.kebutuhan.kategoriKebutuhan.nama,
        itemName: entry.kebutuhan.nama,
      }))

      // Reset the entire form with new entries instead of removing/adding individually
      reset({
        subActivityId: selectedSubActivityId,
        entries: newEntries,
      })
    } else if (
      selectedSubActivityId &&
      existingEntries.length === 0 &&
      entriesFields.length === 0
    ) {
      // No existing data, add empty entry for new sub-activity
      reset({
        subActivityId: selectedSubActivityId,
        entries: [
          {
            kategoriKebutuhanId: '',
            kebutuhanId: '',
            koefisien: 0,
            hasil: 0,
            satuanHasil: '',
            hasilAnalisaKebutuhan: 0,
            satuanHasilAnalisaKebutuhan: '',
            categoryName: '',
            itemName: '',
          },
        ],
      })
    }
  }, [selectedSubActivityId, existingEntries, kebutuhanItems, categories, reset])

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
    // Note: Form population is now handled by useEffect when existing data is fetched
  }

  // Add new entry (for individual items within a category)
  const addEntry = () => {
    appendEntry({
      kategoriKebutuhanId: '',
      kebutuhanId: '',
      koefisien: 0,
      hasil: 0,
      satuanHasil: '',
      hasilAnalisaKebutuhan: 0,
      satuanHasilAnalisaKebutuhan: '',
      categoryName: '',
      itemName: '',
    })
  }

  // Add new category (for adding a new category section)
  const addNewCategory = () => {
    // Add entry with empty kategoriKebutuhanId - this will create a new unselected group
    appendEntry({
      kategoriKebutuhanId: '',
      kebutuhanId: '',
      koefisien: 0,
      hasil: 0,
      satuanHasil: '',
      hasilAnalisaKebutuhan: 0,
      satuanHasilAnalisaKebutuhan: '',
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

    await upsertMutation.mutateAsync(data.entries)
  }

  // Handle modal close
  const handleClose = React.useCallback(() => {
    // Use useCallback to prevent recreation and batch state updates
    onOpenChange(false)

    // Use a timeout to ensure the modal close animation doesn't conflict with state reset
    setTimeout(() => {
      reset({
        subActivityId: '',
        entries: [],
      })
      setSelectedSubActivityId('')
      setSearchQuery('')
      setExpandedActivities(new Set())
    }, 0)
  }, [onOpenChange, reset])

  const isLoading = upsertMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-[90vw] gap-0 rounded-2xl p-0">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <DialogHeader>
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
        </div>

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
                  {/* Group entries by category */}
                  {(() => {
                    // Group entries by kategoriKebutuhanId, but create separate groups for unselected entries
                    const entriesByCategory = entriesFields.reduce(
                      (acc, field, index) => {
                        const categoryId = watch(`entries.${index}.kategoriKebutuhanId`)
                        // Create unique keys for unselected categories
                        const groupKey = categoryId || `unselected_${index}`
                        if (!acc[groupKey]) {
                          acc[groupKey] = []
                        }
                        acc[groupKey].push({ field, index })
                        return acc
                      },
                      {} as Record<string, Array<{ field: any; index: number }>>
                    )

                    return Object.entries(entriesByCategory).map(([groupKey, categoryEntries]) => {
                      // Extract actual categoryId from groupKey
                      const categoryId = groupKey.startsWith('unselected_') ? '' : groupKey
                      const categoryName = categoryId
                        ? categories.find(cat => cat.id === categoryId)?.nama ||
                          'Kategori Tidak Diketahui'
                        : 'Pilih Kategori'

                      return (
                        <Card key={groupKey} className="bg-gray-100">
                          <CardContent className="p-3">
                            {/* Category Header */}
                            <div className="mb-3">
                              <Label className="mb-1 block text-sm font-medium text-gray-700">
                                Kategori Kebutuhan
                              </Label>
                              <Select
                                value={categoryId}
                                onValueChange={value => {
                                  const category = categories.find(cat => cat.id === value)
                                  // Update all entries in this category
                                  categoryEntries.forEach(({ index }) => {
                                    setValue(`entries.${index}.kategoriKebutuhanId`, value)
                                    setValue(`entries.${index}.categoryName`, category?.nama || '')
                                    setValue(`entries.${index}.kebutuhanId`, '')
                                    setValue(`entries.${index}.itemName`, '')
                                  })
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

                            {/* Entries for this category */}
                            <div className="space-y-3">
                              {categoryEntries.map(({ field, index }, entryIndex) => (
                                <div key={field.id} className="space-y-3">
                                  {/* Calculation Row */}
                                  <div className="flex flex-wrap items-end gap-3 border-[2px] border-r-2 p-2">
                                    {/* Daftar Kebutuhan */}
                                    <div className="w-[200px]">
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Daftar Kebutuhan
                                      </Label>

                                      <Select
                                        value={watch(`entries.${index}.kebutuhanId`)}
                                        onValueChange={value => {
                                          const currentCategoryId = watch(
                                            `entries.${index}.kategoriKebutuhanId`
                                          )

                                          const item = getKebutuhanForCategory(
                                            currentCategoryId
                                          ).find(item => item.id === value)
                                          setValue(`entries.${index}.kebutuhanId`, value)
                                          setValue(`entries.${index}.itemName`, item?.nama || '') // Changed from 'name' to 'nama'
                                        }}
                                        disabled={!watch(`entries.${index}.kategoriKebutuhanId`)}
                                      >
                                        <SelectTrigger className="bg-white">
                                          <SelectValue placeholder="Pilih Kebutuhan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(() => {
                                            const currentCategoryId =
                                              watch(`entries.${index}.kategoriKebutuhanId`) || ''
                                            const availableItems =
                                              getKebutuhanForCategory(currentCategoryId)

                                            return availableItems.map(item => (
                                              <SelectItem key={item.id} value={item.id}>
                                                {item.nama}
                                              </SelectItem>
                                            ))
                                          })()}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Koefisien */}
                                    <div className="w-[162px]">
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Koefisien
                                      </Label>

                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
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
                                      <Label className="mb-1 block text-sm font-medium text-gray-700">
                                        Volume
                                      </Label>

                                      <div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400">
                                        {calculateVolumePerHari().toFixed(2)}{' '}
                                        {selectedSubActivity.satuan || 'm³'}
                                      </div>
                                    </div>

                                    <div className="w-[26px] pb-2 text-center text-sm font-medium text-gray-700">
                                      =
                                    </div>

                                    {/* Hasil */}
                                    <div className="flex w-[200px] gap-2">
                                      <div className="flex-1">
                                        <Label className="mb-1 block text-sm font-medium text-gray-700">
                                          Hasil
                                        </Label>

                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0"
                                          {...register(`entries.${index}.hasil`, {
                                            valueAsNumber: true,
                                          })}
                                          className="bg-white"
                                        />
                                      </div>
                                      <div className="w-[70px]">
                                        <Label className="mb-1 block text-sm font-medium text-gray-700">
                                          Satuan
                                        </Label>

                                        <Input
                                          type="text"
                                          placeholder="unit"
                                          {...register(`entries.${index}.satuanHasil`)}
                                          className="bg-white text-xs"
                                        />
                                      </div>
                                    </div>

                                    {/* Analisa Kebutuhan */}
                                    <div className="flex w-[210px] gap-2">
                                      <div className="flex-1">
                                        <Label className="mb-1 block text-sm font-medium text-gray-700">
                                          Analisa Kebutuhan
                                        </Label>

                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0"
                                          {...register(`entries.${index}.hasilAnalisaKebutuhan`, {
                                            valueAsNumber: true,
                                          })}
                                          className="bg-white"
                                        />
                                      </div>
                                      <div className="w-[70px]">
                                        <Label className="mb-1 block text-sm font-medium text-gray-700">
                                          Satuan
                                        </Label>

                                        <Input
                                          type="text"
                                          placeholder="unit"
                                          {...register(
                                            `entries.${index}.satuanHasilAnalisaKebutuhan`
                                          )}
                                          className="bg-white text-xs"
                                        />
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

                                      {/* Add Button - only show on last entry of this category */}
                                      {entryIndex === categoryEntries.length - 1 && (
                                        <Button
                                          type="button"
                                          onClick={() => {
                                            // Add new entry with same category
                                            appendEntry({
                                              kategoriKebutuhanId: categoryId || '',
                                              kebutuhanId: '',
                                              koefisien: 0,
                                              hasil: 0,
                                              satuanHasil: '',
                                              hasilAnalisaKebutuhan: 0,
                                              satuanHasilAnalisaKebutuhan: '',
                                              categoryName: categoryId
                                                ? categories.find(cat => cat.id === categoryId)
                                                    ?.nama || ''
                                                : '',
                                              itemName: '',
                                            })
                                          }}
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

                            {/* Hidden fields for form data */}
                            {categoryEntries.map(({ index }) => (
                              <div key={`hidden-${index}`} style={{ display: 'none' }}>
                                <input type="hidden" {...register(`entries.${index}.id`)} />
                                <input
                                  type="hidden"
                                  {...register(`entries.${index}.categoryName`)}
                                />
                                <input type="hidden" {...register(`entries.${index}.itemName`)} />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    })
                  })()}

                  {/* Add New Category Button */}
                  <Button
                    type="button"
                    onClick={addNewCategory}
                    className="w-full bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kategori Kebutuhan
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-end border-t border-gray-200 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-yellow-400 font-medium text-blue-900 hover:bg-yellow-500"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading
                      ? 'Menyimpan...'
                      : existingEntries.length > 0
                        ? 'Update Analisa Kebutuhan'
                        : 'Simpan Analisa Kebutuhan'}
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

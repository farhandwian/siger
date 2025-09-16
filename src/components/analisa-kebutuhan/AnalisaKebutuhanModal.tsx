'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useKategoriKebutuhanList,
  useKebutuhanList,
  useCreateAnalisaKebutuhan,
  useUpdateAnalisaKebutuhan,
  AnalisaKebutuhanWithRelations,
} from '@/hooks/useAnalisaKebutuhan'
import {
  AnalisaKebutuhanFormSchema,
  AnalisaKebutuhanFormData,
} from '@/lib/schemas/analisa-kebutuhan'
import { SpinnerIcon } from '@/components/ui/icons'

interface AnalisaKebutuhanModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  subActivityId: string
  editItem?: AnalisaKebutuhanWithRelations | null
  onSuccess?: () => void
}

export function AnalisaKebutuhanModal({
  isOpen,
  onOpenChange,
  subActivityId,
  editItem,
  onSuccess,
}: AnalisaKebutuhanModalProps) {
  // State
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>('')

  // Mutations
  const createMutation = useCreateAnalisaKebutuhan()
  const updateMutation = useUpdateAnalisaKebutuhan()

  // Queries
  const { data: categoriesData } = useKategoriKebutuhanList()
  const { data: kebutuhanData } = useKebutuhanList(selectedKategoriId || undefined)

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<AnalisaKebutuhanFormData>({
    resolver: zodResolver(AnalisaKebutuhanFormSchema),
    defaultValues: {
      kebutuhanId: '',
      koefisien: 0,
      stokHarian: 0,
      terpasang: 0,
      totalSisaStokHariIni: 0,
    },
  })

  // Watch form values for reactivity
  const watchedKebutuhanId = watch('kebutuhanId')

  // Data
  const categories = categoriesData?.data || []
  const kebutuhanItems = kebutuhanData?.data || []

  // Find selected kebutuhan to determine its category
  const selectedKebutuhan = kebutuhanItems.find(item => item.id === watchedKebutuhanId)

  // Effects
  useEffect(() => {
    if (editItem) {
      // Populate form with edit data
      setValue('kebutuhanId', editItem.kebutuhanId)
      setValue('koefisien', editItem.koefisien)
      setValue('stokHarian', editItem.stokHarian ?? 0)
      setValue('terpasang', editItem.terpasang ?? 0)
      setValue('totalSisaStokHariIni', editItem.totalSisaStokHariIni ?? 0)

      // Set category
      setSelectedKategoriId(editItem.kebutuhan.kategoriKebutuhanId)
    } else {
      // Reset form for new entry
      reset()
      setSelectedKategoriId('')
    }
  }, [editItem, setValue, reset])

  // Update kategori when kebutuhan selection changes
  useEffect(() => {
    if (selectedKebutuhan && selectedKebutuhan.kategoriKebutuhanId !== selectedKategoriId) {
      setSelectedKategoriId(selectedKebutuhan.kategoriKebutuhanId)
    }
  }, [selectedKebutuhan, selectedKategoriId])

  // Handle category change
  const handleKategoriChange = (kategoriId: string) => {
    setSelectedKategoriId(kategoriId)
    // Reset kebutuhan selection when category changes
    setValue('kebutuhanId', '')
    clearErrors('kebutuhanId')
  }

  // Handle kebutuhan selection
  const handleKebutuhanChange = (kebutuhanId: string) => {
    setValue('kebutuhanId', kebutuhanId)
    clearErrors('kebutuhanId')
  }

  // Form submission
  const onSubmit = async (data: any) => {
    try {
      const formData = AnalisaKebutuhanFormSchema.parse(data)
      const payload = {
        ...formData,
        subActivityId,
        stokHarian: formData.stokHarian || 0,
        terpasang: formData.terpasang || 0,
        totalSisaStokHariIni: formData.totalSisaStokHariIni || 0,
      }

      if (editItem) {
        await updateMutation.mutateAsync({ ...payload, id: editItem.id })
      } else {
        await createMutation.mutateAsync(payload)
      }

      // Success handling
      onSuccess?.()
      onOpenChange(false)

      // Reset form
      reset()
      setSelectedKategoriId('')
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Handle modal close
  const handleClose = () => {
    onOpenChange(false)
    reset()
    setSelectedKategoriId('')
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const submitError = createMutation.error || updateMutation.error

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {editItem ? 'Edit Analisa Kebutuhan' : 'Tambah Analisa Kebutuhan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(submitError as Error).message || 'Terjadi kesalahan saat menyimpan data'}
              </AlertDescription>
            </Alert>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select value={selectedKategoriId} onValueChange={handleKategoriChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori kebutuhan" />
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

          {/* Kebutuhan Selection */}
          <div className="space-y-2">
            <Label htmlFor="kebutuhan">Kebutuhan *</Label>
            <Select
              value={watchedKebutuhanId}
              onValueChange={handleKebutuhanChange}
              disabled={!selectedKategoriId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedKategoriId ? 'Pilih kebutuhan' : 'Pilih kategori terlebih dahulu'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {kebutuhanItems
                  .filter(item => item.kategoriKebutuhanId === selectedKategoriId)
                  .map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.kebutuhanId && (
              <p className="text-sm text-red-600">{errors.kebutuhanId.message}</p>
            )}
          </div>

          {/* Numeric Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="koefisien">Koefisien *</Label>
              <Input
                id="koefisien"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                {...register('koefisien')}
              />
              {errors.koefisien && (
                <p className="text-sm text-red-600">{errors.koefisien.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stokHarian">Stok Harian</Label>
              <Input
                id="stokHarian"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('stokHarian')}
              />
              {errors.stokHarian && (
                <p className="text-sm text-red-600">{errors.stokHarian.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="terpasang">Terpasang</Label>
              <Input
                id="terpasang"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('terpasang')}
              />
              {errors.terpasang && (
                <p className="text-sm text-red-600">{errors.terpasang.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSisaStokHariIni">Total Sisa Stok</Label>
              <Input
                id="totalSisaStokHariIni"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('totalSisaStokHariIni')}
              />
              {errors.totalSisaStokHariIni && (
                <p className="text-sm text-red-600">{errors.totalSisaStokHariIni.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? (
                <>
                  <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                  {editItem ? 'Menyimpan...' : 'Menambah...'}
                </>
              ) : editItem ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Data'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

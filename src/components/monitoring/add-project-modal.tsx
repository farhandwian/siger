'use client'

import React, { useState } from 'react'
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
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, Plus, X, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWilayahSearch } from '@/hooks/useWilayah'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
  const [openLocationPicker, setOpenLocationPicker] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')

  // Use wilayah search hook for dynamic location data
  const { data: wilayahData, isLoading: isLoadingWilayah } = useWilayahSearch(locationSearchQuery)
  // Form state
  const [formData, setFormData] = useState({
    penyediaJasa: '',
    pekerjaan: '',
    jenisPaket: '',
    jenisPengadaan: '',
    paguAnggaran: '',
    nilaiKontrak: '',
    nomorKontrak: '',
    tanggalKontrak: '',
    spmk: '',
    tanggalSpmk: '',
    akhirKontrak: '',
    pembayaranTerakhir: '',
    lokasiProyek: '', // New field for Lokasi Proyek
  })

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    // Format currency fields to remove non-numeric characters except digits
    if (field === 'paguAnggaran' || field === 'nilaiKontrak' || field === 'pembayaranTerakhir') {
      value = value.replace(/[^\d]/g, '')
    }

    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  // Calculate masa kontrak automatically
  const calculateMasaKontrak = () => {
    if (formData.tanggalSpmk && formData.akhirKontrak) {
      const startDate = new Date(formData.tanggalSpmk)
      const endDate = new Date(formData.akhirKontrak)

      // Debug log to see if function is being called
      console.log('Calculating masa kontrak:', {
        tanggalSpmk: formData.tanggalSpmk,
        akhirKontrak: formData.akhirKontrak,
        startDate,
        endDate,
      })

      if (
        startDate &&
        endDate &&
        !isNaN(startDate.getTime()) &&
        !isNaN(endDate.getTime()) &&
        endDate > startDate
      ) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return `${diffDays} hari`
      }
    }
    return ''
  }

  const validateForm = (): string | null => {
    if (!formData.penyediaJasa.trim()) return 'Penyedia jasa is required'
    if (!formData.pekerjaan.trim()) return 'Pekerjaan is required'
    if (!formData.nilaiKontrak.trim()) return 'Nilai kontrak is required'
    if (!formData.nomorKontrak.trim()) return 'Nomor kontrak is required'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare data with proper formatting for currency fields
      const submissionData = {
        ...formData,
        // Add "Rp" prefix to currency fields if they have values
        paguAnggaran: formData.paguAnggaran ? `Rp${formData.paguAnggaran}` : '',
        nilaiKontrak: formData.nilaiKontrak ? `Rp${formData.nilaiKontrak}` : '',
        pembayaranTerakhir: formData.pembayaranTerakhir ? `Rp${formData.pembayaranTerakhir}` : '',
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project')
      }

      // Success - reset form and close modal
      setFormData({
        penyediaJasa: '',
        pekerjaan: '',
        jenisPaket: '',
        jenisPengadaan: '',
        paguAnggaran: '',
        nilaiKontrak: '',
        nomorKontrak: '',
        tanggalKontrak: '',
        spmk: '',
        tanggalSpmk: '',
        akhirKontrak: '',
        pembayaranTerakhir: '',
        lokasiProyek: '', // Reset Lokasi Proyek field
      })

      // Call success callback to refresh the project list
      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:min-w-[640px] lg:min-w-[900px] xl:min-w-[1100px] xl:max-w-[1200px]">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
                <Plus className="h-5 w-5" />
                Tambah Pekerjaan
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* General Information Section */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Informasi Umum Proyek</h3>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Penyedia Jasa */}
              <div className="space-y-1">
                <Label htmlFor="penyediaJasa" className="text-sm font-medium text-gray-700">
                  Penyedia Jasa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="penyediaJasa"
                  placeholder="Isi Penyedia jasa"
                  value={formData.penyediaJasa}
                  onChange={e => handleInputChange('penyediaJasa', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Pekerjaan */}
              <div className="space-y-1">
                <Label htmlFor="pekerjaan" className="text-sm font-medium text-gray-700">
                  Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pekerjaan"
                  placeholder="Isi Kegiatan"
                  value={formData.pekerjaan}
                  onChange={e => handleInputChange('pekerjaan', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Jenis Paket */}
              <div className="space-y-1">
                <Label htmlFor="jenisPaket" className="text-sm font-medium text-gray-700">
                  Jenis Paket
                </Label>
                <Select
                  value={formData.jenisPaket}
                  onValueChange={value => handleInputChange('jenisPaket', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Jenis Paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="konstruksi">Konstruksi</SelectItem>
                    <SelectItem value="jasa-konsultansi">Jasa Konsultansi</SelectItem>
                    <SelectItem value="barang">Barang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jenis Pengadaan */}
              <div className="space-y-1">
                <Label htmlFor="jenisPengadaan" className="text-sm font-medium text-gray-700">
                  Jenis Pengadaan
                </Label>
                <Select
                  value={formData.jenisPengadaan}
                  onValueChange={value => handleInputChange('jenisPengadaan', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Jenis Pengadaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tender">Tender</SelectItem>
                    <SelectItem value="penunjukan-langsung">Penunjukan Langsung</SelectItem>
                    <SelectItem value="tender-cepat">Tender Cepat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 space-y-1 lg:col-span-2">
                <Label htmlFor="lokasiProyek" className="text-sm font-medium text-gray-700">
                  Lokasi Proyek
                </Label>
                <Popover open={openLocationPicker} onOpenChange={setOpenLocationPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openLocationPicker}
                      className="w-full justify-between"
                    >
                      {formData.lokasiProyek || 'Pilih Lokasi Proyek...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Cari lokasi..."
                        value={locationSearchQuery}
                        onValueChange={setLocationSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingWilayah ? 'Mencari lokasi...' : 'Lokasi tidak ditemukan.'}
                        </CommandEmpty>
                        {wilayahData?.data?.map(wilayah => (
                          <CommandItem
                            key={wilayah.value}
                            value={wilayah.label}
                            onSelect={() => {
                              handleInputChange('lokasiProyek', wilayah.label)
                              setOpenLocationPicker(false)
                              setLocationSearchQuery('')
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.lokasiProyek === wilayah.label
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {wilayah.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Contract & Budget Information Section */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Informasi Kontrak & Anggaran</h3>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Pagu Anggaran */}
              <div className="space-y-1">
                <Label htmlFor="paguAnggaran" className="text-sm font-medium text-gray-700">
                  Pagu Anggaran
                </Label>
                <Input
                  id="paguAnggaran"
                  placeholder="Masukkan angka saja (contoh: 500000000)"
                  value={formData.paguAnggaran}
                  onChange={e => handleInputChange('paguAnggaran', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Nilai Kontrak */}
              <div className="space-y-1">
                <Label htmlFor="nilaiKontrak" className="text-sm font-medium text-gray-700">
                  Nilai Kontrak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nilaiKontrak"
                  placeholder="Masukkan angka saja (contoh: 450000000)"
                  value={formData.nilaiKontrak}
                  onChange={e => handleInputChange('nilaiKontrak', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Nomor Kontrak */}
              <div className="space-y-1 lg:col-span-2 xl:col-span-1">
                <Label htmlFor="nomorKontrak" className="text-sm font-medium text-gray-700">
                  Nomor Kontrak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomorKontrak"
                  placeholder="Masukkan Nomor Kontrak"
                  value={formData.nomorKontrak}
                  onChange={e => handleInputChange('nomorKontrak', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Tanggal Kontrak */}
              <div className="space-y-1">
                <Label htmlFor="tanggalKontrak" className="text-sm font-medium text-gray-700">
                  Tanggal Kontrak
                </Label>
                <div className="relative">
                  <Input
                    id="tanggalKontrak"
                    type="date"
                    value={formData.tanggalKontrak}
                    onChange={e => handleInputChange('tanggalKontrak', e.target.value)}
                    className="w-full pr-10"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* SPMK */}
              <div className="space-y-1">
                <Label htmlFor="spmk" className="text-sm font-medium text-gray-700">
                  SPMK (Surat Perintah Mulai Kerja)
                </Label>
                <Input
                  id="spmk"
                  placeholder="Masukkan SPMK"
                  value={formData.spmk}
                  onChange={e => handleInputChange('spmk', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Tanggal SPMK */}
              <div className="space-y-1">
                <Label htmlFor="tanggalSpmk" className="text-sm font-medium text-gray-700">
                  Tanggal SPMK <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="tanggalSpmk"
                    type="date"
                    value={formData.tanggalSpmk}
                    onChange={e => handleInputChange('tanggalSpmk', e.target.value)}
                    className="w-full pr-10"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Akhir Kontrak */}
              <div className="space-y-1">
                <Label htmlFor="akhirKontrak" className="text-sm font-medium text-gray-700">
                  Akhir Kontrak <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="akhirKontrak"
                    type="date"
                    value={formData.akhirKontrak}
                    onChange={e => handleInputChange('akhirKontrak', e.target.value)}
                    className="w-full pr-10"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Masa Kontrak (Auto-calculated) */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Masa Kontrak</Label>
                <Input
                  placeholder="Otomatis dihitung dari tanggal SPMK dan akhir kontrak"
                  value={calculateMasaKontrak()}
                  readOnly
                  className="w-full bg-gray-100 text-gray-600"
                />
              </div>

              {/* Pembayaran Terakhir */}
              <div className="space-y-1 xl:col-span-2">
                <Label htmlFor="pembayaranTerakhir" className="text-sm font-medium text-gray-700">
                  Pembayaran Terakhir
                </Label>
                <Input
                  id="pembayaranTerakhir"
                  placeholder="Masukkan angka saja (contoh: 100000000)"
                  value={formData.pembayaranTerakhir}
                  onChange={e => handleInputChange('pembayaranTerakhir', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-[#ffc928] px-4 py-2.5 text-sm font-medium text-[#364878] hover:bg-[#ffc928]/90 focus:bg-[#ffc928]/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Tambah Proyek
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Default export
export default AddProjectModal

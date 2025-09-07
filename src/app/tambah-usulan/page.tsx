'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  KATEGORI_KEGIATAN_OPTIONS,
  JENIS_DAERAH_IRIGASI_OPTIONS,
  PRIORITAS_OPTIONS,
} from '@/lib/schemas/proposal'
import { LingkupUsulanSection } from '@/components/proposals/lingkup-usulan-section'
import { ReadinessCriteriaSection } from '@/components/proposals/readiness-criteria-section'
import { Search } from 'lucide-react'

export default function TambahUsulanKegiatan() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    tahun: '2025',
    prioritas: '2',
    kategoriKegiatan: '',
    jenisDaerahIrigasi: '',
    daerahIrigasi: '',
    outcome: 0,
    kebutuhanAnggaran: 0,
    anggaranPerHektar: 0,
    ipExisting: 0,
    ipRencana: 0,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (result.success) {
        setProposalId(result.data.id)
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = () => {
    router.push('/daftar-usulan')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Sistem Informasi Geospasial Irigasi
              </h1>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span>Daftar Usulan</span>
                <span className="mx-2">/</span>
                <span className="text-blue-600">Tambah Usulan Kegiatan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg">Tambah Usulan Kegiatan</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tahun">Tahun</Label>
                  <Input
                    id="tahun"
                    value={formData.tahun}
                    onChange={e => handleInputChange('tahun', e.target.value)}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioritas">Prioritas</Label>
                  <select
                    id="prioritas"
                    value={formData.prioritas}
                    onChange={e => handleInputChange('prioritas', e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITAS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategoriKegiatan">Kategori Kegiatan</Label>
                  <select
                    id="kategoriKegiatan"
                    value={formData.kategoriKegiatan}
                    onChange={e => handleInputChange('kategoriKegiatan', e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Kegiatan</option>
                    {KATEGORI_KEGIATAN_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Data Irigasi */}
              <div className="space-y-6">
                <h3 className="text-base font-medium text-gray-900">Data Irigasi</h3>

                <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jenisDaerahIrigasi">Jenis Daerah Irigasi</Label>
                    <select
                      id="jenisDaerahIrigasi"
                      value={formData.jenisDaerahIrigasi}
                      onChange={e => handleInputChange('jenisDaerahIrigasi', e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Irigasi</option>
                      {JENIS_DAERAH_IRIGASI_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daerahIrigasi">Daerah Irigasi</Label>
                    <Input
                      id="daerahIrigasi"
                      value={formData.daerahIrigasi}
                      onChange={e => handleInputChange('daerahIrigasi', e.target.value)}
                      placeholder="Daerah Irigasi"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Button
                      type="button"
                      className="rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Cari Daerah Irigasi
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="outcome">Outcome</Label>
                    <div className="relative">
                      <Input
                        id="outcome"
                        type="number"
                        value={formData.outcome}
                        onChange={e =>
                          handleInputChange('outcome', parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg pr-16"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">Hektar</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kebutuhanAnggaran">Kebutuhan Anggaran</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-500">Rp</span>
                      <Input
                        id="kebutuhanAnggaran"
                        type="number"
                        value={formData.kebutuhanAnggaran}
                        onChange={e =>
                          handleInputChange('kebutuhanAnggaran', parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg pl-8"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anggaranPerHektar">Anggaran / Hektar</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-500">Rp</span>
                      <Input
                        id="anggaranPerHektar"
                        type="number"
                        value={formData.anggaranPerHektar}
                        onChange={e =>
                          handleInputChange('anggaranPerHektar', parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg pl-8"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Informasi IP */}
              <div className="space-y-6">
                <h3 className="text-base font-medium text-gray-900">Informasi IP</h3>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ipExisting">IP Existing (Ex:100%)</Label>
                    <div className="relative">
                      <Input
                        id="ipExisting"
                        type="number"
                        value={formData.ipExisting}
                        onChange={e =>
                          handleInputChange('ipExisting', parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg pr-8"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ipRencana">IP Rencana (Ex:100%)</Label>
                    <div className="relative">
                      <Input
                        id="ipRencana"
                        type="number"
                        value={formData.ipRencana}
                        onChange={e =>
                          handleInputChange('ipRencana', parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg pr-8"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {!proposalId && (
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-yellow-400 px-8 text-blue-900 hover:bg-yellow-500"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
                  </Button>
                </div>
              )}
            </form>

            {/* Additional sections only show after proposal is created */}
            {proposalId && (
              <>
                <hr className="border-gray-200" />
                <LingkupUsulanSection proposalId={proposalId} />

                <hr className="border-gray-200" />
                <ReadinessCriteriaSection proposalId={proposalId} />

                <hr className="border-gray-200" />
                <div className="flex justify-end">
                  <Button
                    onClick={handleFinalSubmit}
                    className="rounded-lg bg-yellow-400 px-8 text-blue-900 hover:bg-yellow-500"
                  >
                    Buat Usulan
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

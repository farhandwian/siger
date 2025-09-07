'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { DOKUMEN_TYPES } from '@/lib/schemas/proposal'

interface ReadinessCriteriaSectionProps {
  proposalId: string
}

const READINESS_DATA = [
  {
    dokumen: 'SID / DED / As Built Drawing (Laporan Akhir dan Gambar Desain)',
    keterangan: 'SID / DED/ As Built Drawing (Laporan Akhir dan Gambar Desain)',
    uploaded: false,
  },
  {
    dokumen: 'Dokumen lingkungan (AMDAL/UKL-UPL/SPPL)',
    keterangan: null,
    uploaded: false,
  },
  {
    dokumen: 'Data sumber air yang masuk formulir usulan kegiatan',
    keterangan: 'Data sumber air yang masuk formulir usulan kegiatan',
    uploaded: false,
  },
  {
    dokumen: 'KAK',
    keterangan: null,
    uploaded: false,
  },
  {
    dokumen: 'RAB/Back Up Volume, Harga Satuan, SMKK, AHSP',
    keterangan: null,
    uploaded: false,
  },
  {
    dokumen:
      'Gambar Area Kerja dan Akses Jalan yang menunjukkan area kerja dan akses jalan menuju lokasi kegiatan',
    keterangan: 'Gambar Area Kerja dan Akses Jalan',
    uploaded: false,
  },
]

export function ReadinessCriteriaSection({ proposalId }: ReadinessCriteriaSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Set<number>>(new Set())

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload the file to your server
      console.log('Uploading file:', file.name)
      setUploadedFiles(prev => new Set([...prev, index]))
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-base font-medium text-gray-900">Readiness Criteria</h3>

      <div className="overflow-hidden rounded-xl border bg-white">
        {/* Table Header */}
        <div className="bg-blue-600 text-white">
          <div className="grid grid-cols-3 gap-4 p-4">
            <div className="text-sm font-bold">Dokumen</div>
            <div className="text-sm font-bold">Keterangan</div>
            <div className="text-sm font-bold">Upload Dokumen</div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-200">
          {READINESS_DATA.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 gap-4 p-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="text-xs leading-normal text-gray-700">{item.dokumen}</div>

              <div className="text-xs leading-normal text-gray-700">{item.keterangan || ''}</div>

              <div className="flex items-center justify-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => handleFileUpload(index, e)}
                    className="sr-only"
                  />
                  <div className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-700">
                          {uploadedFiles.has(index) ? 'File Uploaded' : 'Unggah Berkas Di sini'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {uploadedFiles.has(index) ? 'PDF' : 'Berkas PDF'}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

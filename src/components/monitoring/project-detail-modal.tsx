'use client'

import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { ProgressBar } from '../ui/progress-bar'
import { cn } from '@/lib/utils'

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

interface TabProps {
  label: string
  isActive?: boolean
  onClick?: () => void
}

const Tab: React.FC<TabProps> = ({ label, isActive = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-[9px] transition-colors lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-xs',
        isActive
          ? 'border border-gray-200 bg-[#ffc928] text-[#364878] shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {isActive && (
        <svg
          className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <rect
            x="3"
            y="4"
            width="14"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path d="M8 2v4M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}

interface FormFieldProps {
  label: string
  value: string
}

const FormField: React.FC<FormFieldProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col gap-0.5 lg:gap-1">
      <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
        {label}
      </label>
      <div className="border-b border-gray-200 bg-white px-2 py-1 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-2">
        <span className="text-[9px] text-gray-700 lg:text-[10px] xl:text-xs">{value}</span>
      </div>
    </div>
  )
}

interface ProgressCardProps {
  title: string
  progress: number
  deviation: number
  target: number | string
  unit?: string
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  deviation,
  target,
  unit = '%',
}) => {
  return (
    <Card className="relative border border-gray-200 shadow-sm">
      <CardContent className="p-2 lg:p-3 xl:p-4">
        <div className="mb-2 flex items-center justify-between lg:mb-3">
          <h3 className="text-[10px] font-medium text-gray-700 lg:text-xs xl:text-sm">{title}</h3>
          <svg
            className="h-3 w-3 text-gray-400 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
        </div>

        <div className="space-y-1 lg:space-y-1.5 xl:space-y-2">
          <div className="flex justify-between text-[9px] lg:text-[10px] xl:text-xs">
            <div className="flex gap-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-emerald-500">
                {progress}
                {unit}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="text-gray-500">Deviasi</span>
              <span className="font-medium text-amber-500">
                {deviation}
                {unit}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="text-gray-500">Target</span>
              <span className="font-medium text-gray-700">
                {target}
                {unit}
              </span>
            </div>
          </div>

          <ProgressBar
            progress={progress}
            deviation={deviation}
            target={typeof target === 'number' ? target : 100}
          />
        </div>

        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-1/2 h-1 w-[calc(100%-8px)] -translate-x-1/2 transform bg-yellow-400 lg:w-[calc(100%-12px)] xl:w-[calc(100%-16px)]" />
      </CardContent>
    </Card>
  )
}

interface DataCardProps {
  title: string
  data: Array<{ label: string; value: string | number }>
}

const DataCard: React.FC<DataCardProps> = ({ title, data }) => {
  return (
    <Card className="relative border border-gray-200 shadow-sm">
      <CardContent className="p-2 lg:p-3 xl:p-4">
        <div className="space-y-2 lg:space-y-3">
          <h3 className="text-center text-[10px] font-medium text-gray-700 lg:text-xs xl:text-sm">
            {title}
          </h3>

          <div className="space-y-0">
            {/* Header */}
            <div className="flex justify-between border-b border-gray-200 pb-1 text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
              <span>Keterangan</span>
              <span>Nilai</span>
            </div>

            {/* Data rows */}
            {data.map((item, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-gray-200 py-1 text-[8px] lg:text-[9px] xl:text-[10px]"
              >
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-blue-500">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-1/2 h-1 w-[calc(100%-8px)] -translate-x-1/2 transform bg-yellow-400 lg:w-[calc(100%-12px)] xl:w-[calc(100%-16px)]" />
      </CardContent>
    </Card>
  )
}

export const ProjectDetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, projectId }) => {
  if (!isOpen) return null

  const tabs = [
    'Overview',
    'Peta Pekerjaan',
    'Data Teknis',
    'Jadwal',
    'Action Plan',
    'Material Flow',
    'Analisa Kebutuhan',
  ]

  const outputData = [
    { label: 'Normalisasi', value: '81.398 m2' },
    { label: 'Rehab Saluran', value: '-' },
    { label: 'Rehab Pintu', value: '2' },
    { label: 'Rehab Bangunan', value: '3' },
  ]

  const tenagaKerjaData = [
    { label: 'Mandor', value: '20' },
    { label: 'Tukang', value: '123' },
    { label: 'Pekerja', value: '134' },
  ]

  const alatData = [
    { label: 'Excavator STD', value: '5' },
    { label: 'Excavator LA', value: '2' },
    { label: 'Excavator Mini', value: '4' },
    { label: 'Excavator Amphibi', value: '3' },
  ]

  const materialData = [
    { label: 'Semen', value: '28405' },
    { label: 'Pasir', value: '78280' },
    { label: 'Agregat', value: '89775' },
    { label: 'Pintu', value: '81' },
    { label: 'U-ditch', value: '-' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto rounded-lg bg-gray-50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-white p-1 text-gray-500 hover:text-gray-700 lg:right-3 lg:top-3 lg:p-1.5"
        >
          <svg
            className="h-3 w-3 lg:h-4 lg:w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="mx-4 mb-4 mt-4 rounded-lg border border-gray-200 bg-white lg:mx-6 lg:mb-6 lg:mt-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 p-2 lg:p-3">
            <div className="rounded-lg bg-gray-100 p-0.5">
              <div className="flex gap-0.5 overflow-x-auto lg:gap-1">
                {tabs.map((tab, index) => (
                  <Tab key={index} label={tab} isActive={tab === 'Data Teknis'} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-3 lg:space-y-5 lg:p-4 xl:space-y-6 xl:p-6">
            {/* Informasi Umum Proyek */}
            <section>
              <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                Informasi Umum Proyek
              </h2>
              <div className="space-y-2 lg:space-y-3">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                  <FormField label="Penyedia Jasa" value="PT. Loeh Raya Perkasa" />
                  <FormField
                    label="Pekerjaan"
                    value="Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                  <FormField label="Jenis Paket" value="Fisik" />
                  <FormField label="Jenis Pengadaan" value="Kontraktual" />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Informasi Kontrak & Anggaran */}
            <section>
              <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                Informasi Kontrak & Anggaran
              </h2>
              <div className="space-y-2 lg:space-y-3">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                  <FormField label="Pagu Anggaran" value="RP19.257.871.000" />
                  <FormField label="Nilai Kontrak" value="RP17.008.513.435" />
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                  <FormField label="Nomor Kontrak" value="01/HK0201/Aw9.2/V/2025" />
                  <FormField label="SPMK" value="01/SPMK/Aw9.2/V/2025, Tanggal 23 Mei 2025" />
                  <FormField label="Masa Kontrak" value="120 Hari Kalender" />
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                  <FormField label="Tanggal Kontrak" value="22 Mei 2025" />
                  <FormField label="Akhir Kontrak" value="19 September 2025" />
                  <FormField label="Pembayaran Terakhir" value="-" />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Progress */}
            <section>
              <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                Progress
              </h2>
              <div className="space-y-2 lg:space-y-3">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                  <ProgressCard title="Fisik (%)" progress={68} deviation={2.06} target={100} />
                  <ProgressCard
                    title="Saluran (KM)"
                    progress={69020}
                    deviation={1452}
                    target={100000}
                    unit=""
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                  <ProgressCard
                    title="Bangunan (Buah)"
                    progress={29}
                    deviation={58}
                    target={100}
                    unit=""
                  />
                  <ProgressCard title="Keuangan (%)" progress={0} deviation={0} target="-" />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Realisasi */}
            <section>
              <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                Realisasi
              </h2>
              <div className="space-y-2 lg:space-y-3">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                  <DataCard title="Output" data={outputData} />
                  <DataCard title="Tenaga Kerja" data={tenagaKerjaData} />
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                  <DataCard title="Alat" data={alatData} />
                  <DataCard title="Material" data={materialData} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

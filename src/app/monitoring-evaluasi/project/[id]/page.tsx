'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { cn } from '@/lib/utils'

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
  onChange: (value: string) => void
  projectId: string
  fieldName: string
}

const FormField: React.FC<FormFieldProps> = ({ label, value, onChange, projectId, fieldName }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  // Auto-save function with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (localValue !== value) {
        setIsLoading(true)
        try {
          await saveToDatabase(projectId, fieldName, localValue)
          onChange(localValue)
        } catch (error) {
          console.error('Failed to save:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [localValue, value, projectId, fieldName, onChange])

  const saveToDatabase = async (projectId: string, fieldName: string, value: string) => {
    // Simulate API call to save to database
    const response = await fetch('/api/projects/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        fieldName,
        value,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save to database')
    }

    return response.json()
  }

  return (
    <div className="flex flex-col gap-0.5 lg:gap-1">
      <label className="text-[9px] font-medium text-gray-700 lg:text-[10px] xl:text-xs">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          className="w-full border-b border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-700 focus:border-blue-500 focus:outline-none lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-2 xl:text-xs"
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Project data state with auto-save capability
  const [projectData, setProjectData] = useState({
    penyediaJasa: 'PT. Loeh Raya Perkasa',
    pekerjaan: 'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi',
    jenisPaket: 'Fisik',
    jenisPengadaan: 'Kontraktual',
    paguAnggaran: 'RP19.257.871.000',
    nilaiKontrak: 'RP17.008.513.435',
    nomorKontrak: '01/HK0201/Aw9.2/V/2025',
    spmk: '01/SPMK/Aw9.2/V/2025, Tanggal 23 Mei 2025',
    masaKontrak: '120 Hari Kalender',
    tanggalKontrak: '22 Mei 2025',
    akhirKontrak: '19 September 2025',
    pembayaranTerakhir: '-',
  })

  const projectId = (params?.id as string) || '1'

  const updateField = (fieldName: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [fieldName]: value,
    }))
  }

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Full height */}
      <div
        className={`
        fixed left-0 top-0 z-50 h-screen transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 lg:ml-0">
        {/* Mobile Menu Button */}
        <div className="border-b border-gray-200 bg-white p-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Header */}
        <Header
          breadcrumb={{
            level1: 'Monitoring & Evaluasi',
            level2: 'DIR Rawa Mesuji - Rehabilitasi',
          }}
        />

        {/* Content */}
        <main className="p-2 lg:p-3 xl:p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:p-5 xl:p-8">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 pb-2 lg:pb-3">
              <div className="rounded-lg bg-gray-100 p-0.5">
                <div className="flex gap-0.5 overflow-x-auto lg:gap-1">
                  {tabs.map((tab, index) => (
                    <Tab key={index} label={tab} isActive={tab === 'Data Teknis'} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-3 lg:space-y-5 lg:pt-4 xl:space-y-6 xl:pt-6">
              {/* Informasi Umum Proyek */}
              <section>
                <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                  Informasi Umum Proyek
                </h2>
                <div className="space-y-2 lg:space-y-3">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                    <FormField
                      label="Penyedia Jasa"
                      value={projectData.penyediaJasa}
                      onChange={value => updateField('penyediaJasa', value)}
                      projectId={projectId}
                      fieldName="penyediaJasa"
                    />
                    <FormField
                      label="Pekerjaan"
                      value={projectData.pekerjaan}
                      onChange={value => updateField('pekerjaan', value)}
                      projectId={projectId}
                      fieldName="pekerjaan"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                    <FormField
                      label="Jenis Paket"
                      value={projectData.jenisPaket}
                      onChange={value => updateField('jenisPaket', value)}
                      projectId={projectId}
                      fieldName="jenisPaket"
                    />
                    <FormField
                      label="Jenis Pengadaan"
                      value={projectData.jenisPengadaan}
                      onChange={value => updateField('jenisPengadaan', value)}
                      projectId={projectId}
                      fieldName="jenisPengadaan"
                    />
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
                    <FormField
                      label="Pagu Anggaran"
                      value={projectData.paguAnggaran}
                      onChange={value => updateField('paguAnggaran', value)}
                      projectId={projectId}
                      fieldName="paguAnggaran"
                    />
                    <FormField
                      label="Nilai Kontrak"
                      value={projectData.nilaiKontrak}
                      onChange={value => updateField('nilaiKontrak', value)}
                      projectId={projectId}
                      fieldName="nilaiKontrak"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                    <FormField
                      label="Nomor Kontrak"
                      value={projectData.nomorKontrak}
                      onChange={value => updateField('nomorKontrak', value)}
                      projectId={projectId}
                      fieldName="nomorKontrak"
                    />
                    <FormField
                      label="SPMK"
                      value={projectData.spmk}
                      onChange={value => updateField('spmk', value)}
                      projectId={projectId}
                      fieldName="spmk"
                    />
                    <FormField
                      label="Masa Kontrak"
                      value={projectData.masaKontrak}
                      onChange={value => updateField('masaKontrak', value)}
                      projectId={projectId}
                      fieldName="masaKontrak"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                    <FormField
                      label="Tanggal Kontrak"
                      value={projectData.tanggalKontrak}
                      onChange={value => updateField('tanggalKontrak', value)}
                      projectId={projectId}
                      fieldName="tanggalKontrak"
                    />
                    <FormField
                      label="Akhir Kontrak"
                      value={projectData.akhirKontrak}
                      onChange={value => updateField('akhirKontrak', value)}
                      projectId={projectId}
                      fieldName="akhirKontrak"
                    />
                    <FormField
                      label="Pembayaran Terakhir"
                      value={projectData.pembayaranTerakhir}
                      onChange={value => updateField('pembayaranTerakhir', value)}
                      projectId={projectId}
                      fieldName="pembayaranTerakhir"
                    />
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
        </main>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { ScheduleTable } from '@/components/schedule/schedule-table'
import { CSVImportModal } from '@/components/schedule/csv-import-modal'
import { ActionPlanCSVImportModal } from '@/components/action-plan/ActionPlanCSVImportModal'
import { ActionPlanTable } from '@/components/action-plan/action-plan-table'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AIInsights } from '@/components/monitoring/ai-insights'
import { MonitoringMetrics } from '@/components/monitoring/monitoring-metrics'
import { SCurveChart } from '@/components/monitoring/s-curve-chart'
import { ProjectWorkMap } from '@/components/monitoring/project-work-map'
import { AutoSaveField } from '@/components/ui/auto-save-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useProjectDetail } from '@/hooks/useProjectQueries'
import { useCalculatedData } from '@/hooks/useCalculatedData'
import { cn } from '@/lib/utils'
import { formatDateForInput } from '@/utils/dateUtils'
import { Upload } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

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
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get tab from URL search params, default to 'Data Teknis'
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'Data Teknis')

  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false)
  const [actionPlanCsvImportModalOpen, setActionPlanCsvImportModalOpen] = useState(false)

  const projectId = (params?.id as string) || '1'
  const { data: project, isLoading, error } = useProjectDetail(projectId)

  // Calculate cumulative data for the entire project - available immediately when page loads
  const calculatedData = useCalculatedData(projectId) // Update activeTab when URL search params change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Project data state with auto-save capability
  const [projectData, setProjectData] = useState({
    penyediaJasa: '',
    pekerjaan: '',
    jenisPaket: '',
    jenisPengadaan: '',
    paguAnggaran: '',
    nilaiKontrak: '',
    nomorKontrak: '',
    numberOfWeeks: '',
    spmk: '',
    masaKontrak: '',
    tanggalKontrak: '',
    akhirKontrak: '',
    tanggalSpmk: '',
    pembayaranTerakhir: '',
  })

  // Update local state when project data is loaded
  useEffect(() => {
    if (project) {
      setProjectData({
        penyediaJasa: project.penyediaJasa || '',
        pekerjaan: project.pekerjaan || '',
        jenisPaket: project.jenisPaket || '',
        jenisPengadaan: project.jenisPengadaan || '',
        paguAnggaran: project.paguAnggaran || '',
        nilaiKontrak: project.nilaiKontrak || '',
        nomorKontrak: project.nomorKontrak || '',
        numberOfWeeks: project.numberOfWeeks?.toString() || '',
        spmk: project.spmk || '',
        masaKontrak: project.masaKontrak || '',
        tanggalKontrak: formatDateForInput(project.tanggalKontrak),
        akhirKontrak: formatDateForInput(project.akhirKontrak),
        tanggalSpmk: formatDateForInput(project.tanggalSpmk),
        pembayaranTerakhir: project.pembayaranTerakhir || '',
      })
    }
  }, [project])

  const updateField = (fieldName: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const refreshActivities = () => {
    queryClient.invalidateQueries({ queryKey: ['activities', 'list', projectId] })
    queryClient.invalidateQueries({ queryKey: ['action-plan-schedules'] })
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
  }

  const tabs = [
    'Overview',
    'Peta Pekerjaan',
    'Data Teknis',
    'Jadwal',
    'Action Plan',
    'Analisa Kebutuhan',
  ]

  // Use data from API or fallback to empty arrays
  const outputData = project?.outputData || [
    { label: 'Normalisasi', value: '81.398 m2' },
    { label: 'Rehab Saluran', value: '-' },
    { label: 'Rehab Pintu', value: '2' },
    { label: 'Rehab Bangunan', value: '3' },
  ]

  const tenagaKerjaData = project?.tenagaKerjaData || [
    { label: 'Mandor', value: '20' },
    { label: 'Tukang', value: '123' },
    { label: 'Pekerja', value: '134' },
  ]

  const alatData = project?.alatData || [
    { label: 'Excavator STD', value: '5' },
    { label: 'Excavator LA', value: '2' },
    { label: 'Excavator Mini', value: '4' },
    { label: 'Excavator Amphibi', value: '3' },
  ]

  const materialData = project?.materialData || [
    { label: 'Semen', value: '28405' },
    { label: 'Pasir', value: '78280' },
    { label: 'Agregat', value: '89775' },
    { label: 'Pintu', value: '81' },
    { label: 'U-ditch', value: '-' },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="fixed left-0 top-0 z-50 h-screen">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 lg:ml-0">
          <Header />
          <div className="p-4 lg:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="fixed left-0 top-0 z-50 h-screen">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 lg:ml-0">
          <Header />
          <div className="p-4 lg:p-6">
            <div className="py-12 text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-600">Error</h2>
              <p className="mb-4 text-gray-600">{error.message}</p>
              <button
                onClick={() => router.back()}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar className={sidebarOpen ? 'translate-x-0' : ''} />

      {/* Main Content */}
      <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
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
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button
                onClick={() => router.push('/monitoring-evaluasi')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>

              {/* Project Title */}
            </div>
            <div className="flex-1 py-4">
              <h1 className="text-lg font-semibold text-gray-900 lg:text-xl">
                {project?.pekerjaan || 'Detail Proyek'}
              </h1>
              {project?.penyediaJasa && (
                <p className="text-xs text-gray-600 lg:text-base">{project.penyediaJasa}</p>
              )}
            </div>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 pb-2 lg:pb-3">
              <div className="rounded-lg bg-gray-100 p-0.5">
                <div className="flex gap-0.5 overflow-x-auto lg:gap-1">
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      label={tab}
                      isActive={tab === activeTab}
                      onClick={() => setActiveTab(tab)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-3 lg:space-y-5 lg:pt-4 xl:space-y-6 xl:pt-6">
              {/* Render content based on active tab */}
              {activeTab === 'Data Teknis' && (
                <>
                  {/* Informasi Umum Proyek */}
                  <section>
                    <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                      Informasi Umum Proyek
                    </h2>
                    <div className="space-y-2 lg:space-y-3">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                        <AutoSaveField
                          label="Penyedia Jasa"
                          value={projectData.penyediaJasa}
                          onChange={(value: string) => updateField('penyediaJasa', value)}
                          projectId={projectId}
                          fieldName="penyediaJasa"
                        />
                        <AutoSaveField
                          label="Pekerjaan"
                          value={projectData.pekerjaan}
                          onChange={(value: string) => updateField('pekerjaan', value)}
                          projectId={projectId}
                          fieldName="pekerjaan"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                        <AutoSaveField
                          label="Jenis Paket"
                          value={projectData.jenisPaket}
                          onChange={(value: string) => updateField('jenisPaket', value)}
                          projectId={projectId}
                          fieldName="jenisPaket"
                        />
                        <AutoSaveField
                          label="Jenis Pengadaan"
                          value={projectData.jenisPengadaan}
                          onChange={(value: string) => updateField('jenisPengadaan', value)}
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
                        <AutoSaveField
                          label="Pagu Anggaran"
                          value={projectData.paguAnggaran}
                          onChange={(value: string) => updateField('paguAnggaran', value)}
                          projectId={projectId}
                          fieldName="paguAnggaran"
                        />
                        <AutoSaveField
                          label="Nilai Kontrak"
                          value={projectData.nilaiKontrak}
                          onChange={(value: string) => updateField('nilaiKontrak', value)}
                          projectId={projectId}
                          fieldName="nilaiKontrak"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                        <AutoSaveField
                          label="Nomor Kontrak"
                          value={projectData.nomorKontrak}
                          onChange={(value: string) => updateField('nomorKontrak', value)}
                          projectId={projectId}
                          fieldName="nomorKontrak"
                        />
                        <AutoSaveField
                          label="Jumlah Minggu"
                          value={projectData.numberOfWeeks}
                          onChange={(value: string) => updateField('numberOfWeeks', value)}
                          projectId={projectId}
                          fieldName="numberOfWeeks"
                          type="number"
                        />
                        <AutoSaveField
                          label="SPMK"
                          value={projectData.spmk}
                          onChange={(value: string) => updateField('spmk', value)}
                          projectId={projectId}
                          fieldName="spmk"
                        />
                        <AutoSaveField
                          label="Tanggal SPMK"
                          value={projectData.tanggalSpmk}
                          onChange={(value: string) => updateField('tanggalSpmk', value)}
                          projectId={projectId}
                          fieldName="tanggalSpmk"
                          type="date"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
                        <AutoSaveField
                          label="Tanggal Kontrak"
                          value={projectData.tanggalKontrak}
                          onChange={(value: string) => updateField('tanggalKontrak', value)}
                          projectId={projectId}
                          fieldName="tanggalKontrak"
                          type="date"
                        />
                        <AutoSaveField
                          label="Akhir Kontrak"
                          value={projectData.akhirKontrak}
                          onChange={(value: string) => updateField('akhirKontrak', value)}
                          projectId={projectId}
                          fieldName="akhirKontrak"
                          type="date"
                        />
                        <AutoSaveField
                          label="Masa Kontrak"
                          value={projectData.masaKontrak}
                          onChange={(value: string) => updateField('masaKontrak', value)}
                          projectId={projectId}
                          fieldName="masaKontrak"
                        />
                        {/* <AutoSaveField
                          label="Pembayaran Terakhir"
                          value={projectData.pembayaranTerakhir}
                          onChange={(value: string) => updateField('pembayaranTerakhir', value)}
                          projectId={projectId}
                          fieldName="pembayaranTerakhir"
                        /> */}
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
                        <ProgressCard
                          title="Fisik (%)"
                          progress={project?.fisikProgress || 0}
                          deviation={project?.fisikDeviasi || 0}
                          target={project?.fisikTarget || 100}
                        />
                        <ProgressCard
                          title="Saluran (KM)"
                          progress={project?.saluranProgress || 0}
                          deviation={project?.saluranDeviasi || 0}
                          target={project?.saluranTarget || 0}
                          unit=""
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                        <ProgressCard
                          title="Bangunan (Buah)"
                          progress={project?.bangunanProgress || 0}
                          deviation={project?.bangunanDeviasi || 0}
                          target={project?.bangunanTarget || 0}
                          unit=""
                        />
                        <ProgressCard
                          title="Keuangan (%)"
                          progress={project?.keuanganProgress || 0}
                          deviation={project?.keuanganDeviasi || 0}
                          target={project?.keuanganTarget || 0}
                        />
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
                </>
              )}

              {/* Jadwal Tab Content */}
              {activeTab === 'Jadwal' && (
                <div className="space-y-6">
                  {/* Metrics Cards */}
                  <div>
                    <h2 className="mb-4 text-sm font-medium text-gray-900">Progress Overview</h2>
                  </div>

                  {/* Chart and AI Insights */}
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="flex flex-col gap-6 xl:col-span-2">
                      <MonitoringMetrics projectId={projectId} isActionPlanTable={false} />
                      <SCurveChart projectId={projectId} isActionPlanTable={false} />
                    </div>
                    <div className="flex flex-col">
                      <AIInsights />
                    </div>
                  </div>

                  {/* Activity Schedule Table */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-medium text-gray-900">Jadwal Kontrak</h2>
                      <Button
                        onClick={() => setCsvImportModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Import CSV
                      </Button>
                    </div>
                    <ScheduleTable projectId={projectId} calculatedData={calculatedData} />
                  </div>
                </div>
              )}
              {/* Action Plan Content */}
              {activeTab === 'Action Plan' && (
                <div className="space-y-6">
                  {/* Metrics Cards */}
                  <div>
                    <h2 className="mb-4 text-sm font-medium text-gray-900">Progress Overview</h2>
                  </div>

                  {/* Chart and AI Insights */}
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="flex flex-col gap-6 xl:col-span-2">
                      <MonitoringMetrics projectId={projectId} isActionPlanTable={true} />
                      <SCurveChart projectId={projectId} isActionPlanTable={true} />
                    </div>
                    <div className="flex flex-col">
                      <AIInsights />
                    </div>
                  </div>

                  {/* Activity Schedule Table */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-medium text-gray-900">Jadwal Action Plan</h2>
                      <Button
                        onClick={() => setCsvImportModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Import CSV
                      </Button>
                    </div>
                    <ActionPlanTable projectId={projectId} calculatedData={calculatedData} />
                  </div>
                </div>
              )}

              {/* Peta Pekerjaan Tab Content */}
              {activeTab === 'Peta Pekerjaan' && (
                <div className="space-y-6">
                  <div className="relative">
                    <ProjectWorkMap projectId={projectId} />
                  </div>
                </div>
              )}

              {activeTab === 'Analisa Kebutuhan' && (
                <div className="space-y-6">
                  {/* <AnalisaKebutuhanNew projectId={projectId} /> */}
                </div>
              )}

              {/* Other tabs can be implemented here */}
              {activeTab !== 'Data Teknis' &&
                activeTab !== 'Jadwal' &&
                activeTab !== 'Action Plan' &&
                activeTab !== 'Peta Pekerjaan' && (
                  <div className="py-12 text-center">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{activeTab}</h3>
                    <p className="text-gray-600">Konten untuk tab ini sedang dalam pengembangan.</p>
                  </div>
                )}
            </div>
          </div>
        </main>

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={csvImportModalOpen}
          onClose={() => setCsvImportModalOpen(false)}
          projectId={String(params.id)}
          onSuccess={refreshActivities}
        />

        {/* Action Plan CSV Import Modal */}
        <ActionPlanCSVImportModal
          isOpen={actionPlanCsvImportModalOpen}
          onClose={() => setActionPlanCsvImportModalOpen(false)}
          projectId={String(params.id)}
          onSuccess={refreshActivities}
        />
      </div>
    </div>
  )
}

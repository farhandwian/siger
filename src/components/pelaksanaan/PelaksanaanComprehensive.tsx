'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useExecutionSummary } from '@/hooks/useExecutionSummary'
import { SCurveChart } from '@/components/monitoring/SCurveChartNew'
import { AIInsights } from '@/components/monitoring/ai-insights'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Wifi, Cloud, BadgeCheck, Info } from 'lucide-react'
import { ProgressBar } from './ProgressBar'

/**
 * Summary card with exact Figma design - colored backgrounds with left border indicators
 */
function SummaryCard({
  title,
  value,
  bgColor,
  borderColor,
  isLoading = false,
}: {
  title: string
  value: string
  bgColor: string
  borderColor: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card className={`relative overflow-hidden rounded-2xl ${bgColor} border-0`}>
        <div
          className={`absolute left-0 top-1/2 h-20 w-1.5 -translate-y-1/2 ${borderColor} rounded-r`}
        />
        <CardContent className="py-3 pl-5 pr-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 bg-white/20" />
            <Skeleton className="h-6 w-16 bg-white/20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`relative overflow-hidden rounded-2xl ${bgColor} border-0 shadow-sm`}>
      {/* Left border indicator */}
      <div
        className={`absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 ${borderColor} rounded-r`}
      />

      <CardContent className="flex flex-col items-center justify-start gap-1.5 py-3 pl-5 pr-4">
        <div className="flex w-full items-center justify-start">
          <p className="text-sm leading-5 text-gray-400">{title}</p>
        </div>
        <div className="w-full">
          <p className="text-xl font-semibold leading-normal text-gray-700">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Progress Pekerjaan section with S-curve chart showing aggregated data from all projects
 */
function ProgressPekerjaanSection() {
  return (
    <div className="h-full">
      <SCurveChart projectId="1" type="activity" aggregateAllProjects={true} />
    </div>
  )
}

/**
 * Project progress list component matching Figma design
 */
function ProgressSeluruhPekerjaan() {
  // Mock data matching Figma design
  const projects = [
    {
      id: '1',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      progress: 90,
      plannedProgress: 88,
      type: 'Kontraktual',
      area: 'IRA 1',
      contractValue: 'Rp19.211.000.000',
    },
    {
      id: '2',
      title: 'Rehabilitasi Jaringan Utama D.I Kewenangan Daerah di Provinsi Lampung (Paket I)',
      progress: 68,
      plannedProgress: 75,
      type: 'Kontraktual',
      area: 'IRA 2',
      contractValue: 'Rp38.624.955.000',
    },
    {
      id: '3',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan jaringan Irigasi DIR Rawa Jitu dan Rawa Pitu di Kabupaten Mesuji',
      progress: 60,
      plannedProgress: 67,
      type: 'Swakelola',
      area: 'IRA III',
      contractValue: 'Rp29.900.973.824',
    },
    {
      id: '4',
      title: 'D.I. Gilingeng - Pembangunan',
      progress: 65,
      plannedProgress: 70,
      type: 'Kontraktual',
      area: 'IRA 1',
      contractValue: null,
    },
  ]

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardContent className="p-6">
        {/* Header with legend */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Progress Seluruh Pekerjaan</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-500">Realisasi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FFC928]" />
              <span className="text-sm text-gray-500">Rencana</span>
            </div>
          </div>
        </div>

        {/* Project list */}
        <div className="space-y-6">
          {projects.map(project => (
            <div key={project.id} className="space-y-2">
              {/* Project header */}
              <div className="flex items-start justify-between">
                <h4 className="flex-1 text-base font-medium leading-normal text-gray-900">
                  {project.title}
                </h4>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-gray-500">Progress:</span>
                  <span className="font-medium text-gray-900">{project.progress}%</span>
                </div>
              </div>

              {/* Project metadata */}
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <Badge variant="secondary" className="border-blue-200 bg-blue-50 text-blue-700">
                  {project.type}
                </Badge>
                <span>•</span>
                <span>{project.area}</span>
                {project.contractValue && (
                  <>
                    <span>•</span>
                    <span>Nilai Kontrak : {project.contractValue}</span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <ProgressBar planned={project.plannedProgress} actual={project.progress} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Live updates component matching Figma design
 */
function LiveUpdatePanel() {
  const updates = [
    {
      id: '1',
      type: 'weather',
      title: 'Laporan Cuaca',
      time: 'Baru Saja',
      description: 'Terjadi hujan lebat di Kabupaten Mesuji',
      borderColor: 'bg-amber-500',
      icon: Cloud,
    },
    {
      id: '2',
      type: 'report',
      title: 'Laporan Harian',
      time: 'Baru Saja',
      description: 'PPK IRA 1 melaporkan progress harian',
      borderColor: 'bg-emerald-500',
      icon: BadgeCheck,
    },
    {
      id: '3',
      type: 'weather',
      title: 'Laporan Cuaca',
      time: 'Baru Saja',
      description: 'Terjadi hujan lebat di Kabupaten Lampung Timur',
      borderColor: 'bg-amber-500',
      icon: Cloud,
    },
    {
      id: '4',
      type: 'action',
      title: 'Action Plan',
      time: '3 Menit Lalu',
      description: 'PPK IRA 3 mengubah action plan',
      borderColor: 'bg-blue-500',
      icon: Info,
    },
    {
      id: '5',
      type: 'action',
      title: 'Action Plan',
      time: '3 Menit Lalu',
      description: 'PPK IRA 2 mengubah action plan',
      borderColor: 'bg-blue-500',
      icon: Info,
    },
  ]

  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-50 p-2">
              <Wifi className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-medium text-gray-700">Live Update</h3>
          </div>
          <div className="flex h-4 items-center justify-center rounded-full bg-emerald-500 px-1 py-0">
            <span className="text-xs font-medium text-white">3</span>
          </div>
        </div>

        {/* Updates list */}
        <div className="space-y-2">
          {updates.map(update => {
            const IconComponent = update.icon
            return (
              <Card key={update.id} className="relative rounded-xl border-gray-100 bg-gray-50">
                {/* Left border indicator */}
                <div
                  className={`absolute left-0 top-1/2 h-14 w-1.5 -translate-y-1/2 ${update.borderColor} rounded-r`}
                />

                <CardContent className="flex items-center gap-3 py-2 pl-4 pr-3">
                  <IconComponent className="h-4 w-4 flex-shrink-0 text-gray-600" />

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-end justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{update.title}</h4>
                      <span className="text-xs text-gray-400">{update.time}</span>
                    </div>
                    <p className="text-xs text-gray-400">{update.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface PelaksanaanComprehensiveProps {
  className?: string
}

/**
 * Comprehensive pelaksanaan section matching exact Figma design
 * Uses CSS Grid layout for optimal responsive behavior
 * Integrates SCurveChartNew and ai-insights components
 */
export function PelaksanaanComprehensive({ className = '' }: PelaksanaanComprehensiveProps) {
  const { data: executionData, isLoading, isError, error } = useExecutionSummary()

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading pelaksanaan data</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message || 'Failed to fetch execution summary'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <CardContent className="p-6">
        {/* Section Title */}
        <h2 className="mb-6 text-lg font-semibold text-gray-700">Pelaksanaan</h2>

        {/* CSS Grid Layout matching Figma design */}
        <div className="space-y-6">
          {/* Row 1: Summary Cards - 4 columns on large screens */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Proyek"
              value={isLoading ? '-' : executionData?.totalProjects.toString() || '11'}
              bgColor="bg-blue-50"
              borderColor="bg-blue-500"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Total Kontrak"
              value={isLoading ? '-' : executionData?.totalContract || 'Rp. 140.680.140.000'}
              bgColor="bg-yellow-50"
              borderColor="bg-yellow-500"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Progress Rata-Rata"
              value={isLoading ? '-' : `${executionData?.averageProgress || 67.8}%`}
              bgColor="bg-emerald-50"
              borderColor="bg-emerald-500"
              isLoading={isLoading}
            />
            <SummaryCard
              title="Deviasi Rata-Rata"
              value={isLoading ? '-' : `(${executionData?.averageDeviation || -3.5}%)`}
              bgColor="bg-rose-50"
              borderColor="bg-rose-500"
              isLoading={isLoading}
            />
          </div>

          {/* Row 2: Progress Chart + AI Insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 h-full">
              <ProgressPekerjaanSection />
            </div>
            <div className="col-span-1">
              <AIInsights />
            </div>
          </div>

          {/* Row 3: Project Progress List + Live Updates */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_368px]">
            <ProgressSeluruhPekerjaan />
            <LiveUpdatePanel />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

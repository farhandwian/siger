'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExecutionSummary } from '@/hooks/useExecutionSummary'
import { PelaksanaanProgressChart } from './PelaksanaanProgressChart'
import { PelaksanaanAIInsights } from './PelaksanaanAIInsights'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp, Target, Activity, DollarSign } from 'lucide-react'

/**
 * Summary card component for pelaksanaan metrics
 * Matches Figma design with proper spacing and typography
 */
function SummaryCard({
  title,
  value,
  hint,
  icon: IconComponent,
  isLoading = false,
}: {
  title: string
  value: string
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="mb-2 h-8 w-16" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-gray-700 sm:text-lg">{title}</CardTitle>
          {IconComponent && <IconComponent className="h-5 w-5 text-gray-400" />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-1 text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">
          {value}
        </div>
        {hint && <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>}
      </CardContent>
    </Card>
  )
}

/**
 * Project progress list component
 * Shows detailed project status matching Figma design
 */
function ProjectProgressList() {
  // This would be replaced with real project data in a future implementation
  const mockProjects = [
    {
      id: '1',
      name: 'Rehabilitasi Jaringan Irigasi Citanduy',
      location: 'Ciamis, Jawa Barat',
      progress: 75,
      status: 'on-track' as const,
      deviation: 2.5,
    },
    {
      id: '2',
      name: 'Pembangunan Saluran Primer Cipeundeuy',
      location: 'Bandung, Jawa Barat',
      progress: 45,
      status: 'at-risk' as const,
      deviation: -5.2,
    },
    {
      id: '3',
      name: 'Normalisasi Saluran Sekunder Bojongsoang',
      location: 'Bandung, Jawa Barat',
      progress: 90,
      status: 'on-track' as const,
      deviation: 8.1,
    },
  ]

  const statusColors = {
    'on-track': 'bg-green-100 text-green-800',
    'at-risk': 'bg-yellow-100 text-yellow-800',
    delayed: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    'on-track': 'Sesuai Jadwal',
    'at-risk': 'Perlu Perhatian',
    delayed: 'Terlambat',
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-gray-700 sm:text-lg">Detail Progress Proyek</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {mockProjects.map(project => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium leading-tight text-gray-900">
                    {project.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">{project.location}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}
                >
                  {statusLabels[project.status]}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{project.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(project.progress, 0), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Deviasi: {project.deviation > 0 ? '+' : ''}
                    {project.deviation}%
                  </span>
                  <span
                    className={`font-medium ${
                      project.deviation > 0
                        ? 'text-green-600'
                        : project.deviation < -3
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {project.deviation > 0
                      ? 'Lebih Cepat'
                      : project.deviation < -3
                        ? 'Terlambat'
                        : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface PelaksanaanSectionProps {
  className?: string
}

/**
 * Complete pelaksanaan section component
 * Matches exact Figma design with 4-column status cards, S-curve chart, AI insights, and project list
 * Uses real database data through execution summary API
 */
export function PelaksanaanSection({ className = '' }: PelaksanaanSectionProps) {
  const { data: executionData, isLoading, isError, error } = useExecutionSummary()

  if (isError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading pelaksanaan data</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || 'Failed to fetch execution summary'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 4-Column Summary Cards - Matches Figma design exactly */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <SummaryCard
          title="Total Proyek"
          value={isLoading ? '-' : executionData?.totalProjects.toString() || '0'}
          hint="Proyek aktif dalam pelaksanaan"
          icon={Activity}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Nilai Kontrak"
          value={isLoading ? '-' : executionData?.totalContract || 'Rp 0'}
          hint="Total nilai semua kontrak"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Rata-rata Progress"
          value={isLoading ? '-' : `${executionData?.averageProgress || 0}%`}
          hint="Progress keseluruhan proyek"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Rata-rata Deviasi"
          value={
            isLoading
              ? '-'
              : `${(executionData?.averageDeviation || 0) > 0 ? '+' : ''}${executionData?.averageDeviation || 0}%`
          }
          hint="Deviasi dari jadwal rencana"
          icon={Target}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid - Chart and AI Insights */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Progress Chart - Takes 2/3 width on desktop */}
        <div className="xl:col-span-2">
          <PelaksanaanProgressChart className="h-full" />
        </div>

        {/* AI Insights Panel - Takes 1/3 width on desktop */}
        <div className="xl:col-span-1">
          <PelaksanaanAIInsights className="h-full" />
        </div>
      </div>

      {/* Project Progress List - Full width */}
      <ProjectProgressList />
    </div>
  )
}

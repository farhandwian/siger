'use client'

import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { ProgressBar } from '../ui/progress-bar'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/useProjectQueries'
import { useUpdateProjectStatus } from '@/hooks/useProjectQueries'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '../ui/icons'
import { cn } from '@/lib/utils'

interface ProjectData {
  id: string
  title: string
  location: string
  budget: string
  status: 'on-track' | 'at-risk' | 'delayed'
  progress: number
  deviation: number
  target: number
  projectStatus?: 'DRAFT' | 'KONTRAK' | 'DRAFT_ADDENDUM'
}

interface ProjectCardProps {
  project: ProjectData
  className?: string
}

const StatusBadge: React.FC<{ status: ProjectData['status'] }> = ({ status }) => {
  const statusConfig = {
    'on-track': {
      label: 'On Track',
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-500',
    },
    'at-risk': {
      label: 'Rawan Keterlambatan',
      icon: ArrowTrendingDownIcon,
      color: 'text-amber-500',
    },
    delayed: {
      label: 'Terlambat',
      icon: ArrowTrendingDownIcon,
      color: 'text-red-500',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1">
      <Icon className="h-2.5 w-2.5 lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
      <span className={cn('text-[9px] font-normal lg:text-[10px] xl:text-xs', config.color)}>
        {config.label}
      </span>
    </div>
  )
}

const ProjectStatusBadge: React.FC<{ projectStatus: ProjectData['projectStatus'] }> = ({ projectStatus }) => {
  if (!projectStatus) return null

  const statusConfig = {
    'DRAFT': {
      label: 'Draft',
      color: 'bg-yellow-100 text-yellow-800',
    },
    'KONTRAK': {
      label: 'Kontrak',
      color: 'bg-green-100 text-green-800',
    },
    'DRAFT_ADDENDUM': {
      label: 'Draft Addendum',
      color: 'bg-blue-100 text-blue-800',
    },
  }

  const config = statusConfig[projectStatus]

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', config.color)}>
      {config.label}
    </span>
  )
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  const router = useRouter()
  const updateStatusMutation = useUpdateProjectStatus()
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<'FINALISASI' | 'ADDENDUM' | null>(null)

  const handleDetailClick = () => {
    router.push(`/monitoring-evaluasi/project/${project.id}`)
  }

  const handleFinalisasi = () => {
    setPendingAction('FINALISASI')
    setShowConfirmDialog(true)
  }

  const handleBuatAddendum = () => {
    setPendingAction('ADDENDUM')
    setShowConfirmDialog(true)
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return

    try {
      const newStatus = pendingAction === 'FINALISASI' ? 'KONTRAK' : 'DRAFT_ADDENDUM'
      await updateStatusMutation.mutateAsync({
        projectId: project.id,
        status: newStatus,
      })
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setShowConfirmDialog(false)
      setPendingAction(null)
    }
  }

  const handleCancelAction = () => {
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  return (
    <Card className={cn('relative border border-gray-200 shadow-sm', className)}>
      <CardContent className="p-2 lg:p-3 xl:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6 xl:gap-12">
          {/* Project Info */}
          <div className="flex-1 space-y-1.5 lg:space-y-2">
            <div className="space-y-0.5 lg:space-y-1">
              <h3 className="text-[10px] font-medium leading-snug text-gray-700 lg:text-xs xl:text-sm">
                {project.title}
              </h3>
              <div className="flex flex-col gap-1.5 text-[9px] text-gray-700 sm:flex-row sm:items-center sm:gap-3 lg:text-[10px]">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-2 w-2 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3" />
                  <span>{project.location ? project.location : 'Lokasi belum dipilih'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-2 w-2 lg:h-2.5 lg:w-2.5 xl:h-3 xl:w-3" />
                  <span className="truncate">{project.budget}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <ProjectStatusBadge projectStatus={project.projectStatus} />
            </div>
          </div>

          {/* Progress Section */}
          <div className="flex-1 space-y-1.5 lg:min-w-0 lg:space-y-2">
            <div className="grid grid-cols-3 gap-1.5 text-[9px] lg:gap-3 lg:text-[10px] xl:text-xs">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-1.5">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-emerald-500">{project.progress}%</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-1.5">
                <span className="text-gray-500">Deviasi</span>
                <span className="font-medium text-amber-500">{project.deviation}%</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-1.5">
                <span className="text-gray-500">Target</span>
                <span className="font-medium text-gray-700">{project.target}%</span>
              </div>
            </div>
            <ProgressBar
              progress={project.progress}
              deviation={project.deviation}
              target={project.target}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-shrink-0 flex-col gap-2 lg:flex-row lg:items-center">
            {project.projectStatus === 'DRAFT' && (
              <Button
                size="sm"
                onClick={handleFinalisasi}
                disabled={updateStatusMutation.isPending}
                className="bg-green-500 px-2 text-[9px] text-white hover:bg-green-600 disabled:opacity-50 lg:px-2.5 lg:text-[10px] xl:px-3 xl:text-xs"
              >
                {updateStatusMutation.isPending ? '...' : 'Finalisasi'}
              </Button>
            )}
            {project.projectStatus === 'KONTRAK' && (
              <Button
                size="sm"
                onClick={handleBuatAddendum}
                disabled={updateStatusMutation.isPending}
                className="bg-blue-500 px-2 text-[9px] text-white hover:bg-blue-600 disabled:opacity-50 lg:px-2.5 lg:text-[10px] xl:px-3 xl:text-xs"
              >
                {updateStatusMutation.isPending ? '...' : 'Buat Addendum'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDetailClick}
              className="bg-blue-500 px-2 text-[9px] text-white hover:bg-blue-600 lg:px-2.5 lg:text-[10px] xl:px-3 xl:text-xs"
            >
              Detail
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
            <div className="m-4 rounded-lg bg-white p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-900">
                Konfirmasi {pendingAction === 'FINALISASI' ? 'Finalisasi' : 'Buat Addendum'}
              </h3>
              <p className="mt-2 text-xs text-gray-600">
                {pendingAction === 'FINALISASI'
                  ? 'Apakah Anda yakin ingin memfinalisasi proyek ini? Status akan berubah menjadi KONTRAK dan tidak dapat diubah kembali.'
                  : 'Apakah Anda yakin ingin membuat addendum untuk proyek ini? Status akan berubah menjadi DRAFT_ADDENDUM.'}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirmAction}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-500 text-xs text-white hover:bg-green-600"
                >
                  {updateStatusMutation.isPending ? 'Memproses...' : 'Ya'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelAction}
                  disabled={updateStatusMutation.isPending}
                  variant="outline"
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-1/2 h-1.5 w-[calc(100%-12px)] -translate-x-1/2 transform bg-yellow-400 lg:w-[calc(100%-24px)] xl:w-[calc(100%-32px)]" />
        <div className="absolute bottom-0 left-1/2 h-1.5 w-[calc(100%-16px)] -translate-x-1/2 transform bg-yellow-400 lg:w-[calc(100%-32px)]" />
      </CardContent>
    </Card>
  )
}

interface ProjectListProps {
  className?: string
}

export const ProjectList: React.FC<ProjectListProps> = ({ className }) => {
  const { data, isLoading, error } = useProjects({
    limit: 20, // Get more projects for demo
  })

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardContent className="p-2 lg:p-3 xl:p-4">
              <div className="animate-pulse">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6 xl:gap-12">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200"></div>
                    <div className="h-2 w-full rounded bg-gray-200"></div>
                  </div>
                  <div className="h-8 w-16 rounded bg-gray-200"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card className="border border-red-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-red-600">Error: {error.message}</p>
            <Button className="mt-2 text-xs" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const projects = data?.projects || []

  return (
    <div className={cn('space-y-4', className)}>
      {projects.map((project: ProjectData) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

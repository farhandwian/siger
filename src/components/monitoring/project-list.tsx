'use client'

import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { ProgressBar } from '../ui/progress-bar'
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
      <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
      <span className={cn('text-xs font-normal lg:text-sm', config.color)}>{config.label}</span>
    </div>
  )
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  return (
    <Card className={cn('relative border border-gray-200 shadow-sm', className)}>
      <CardContent className="p-3 lg:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8 xl:gap-12">
          {/* Project Info */}
          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <h3 className="text-sm font-medium leading-snug text-gray-700 lg:text-base">
                {project.title}
              </h3>
              <div className="flex flex-col gap-2 text-xs text-gray-700 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="truncate">{project.budget}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={project.status} />
          </div>

          {/* Progress Section */}
          <div className="flex-1 space-y-2 lg:min-w-0">
            <div className="grid grid-cols-3 gap-2 text-xs lg:gap-4 lg:text-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-emerald-500">{project.progress}%</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                <span className="text-gray-500">Deviasi</span>
                <span className="font-medium text-amber-500">{project.deviation}%</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
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

          {/* Detail Button */}
          <div className="flex flex-shrink-0 justify-end lg:block">
            <Button
              size="sm"
              className="bg-blue-500 px-3 text-xs text-white hover:bg-blue-600 lg:px-4 lg:text-sm"
            >
              Detail
            </Button>
          </div>
        </div>

        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-1/2 h-1.5 w-[calc(100%-16px)] -translate-x-1/2 transform bg-yellow-400 lg:w-[calc(100%-32px)]" />
      </CardContent>
    </Card>
  )
}

interface ProjectListProps {
  className?: string
}

export const ProjectList: React.FC<ProjectListProps> = ({ className }) => {
  const projects: ProjectData[] = [
    {
      id: '1',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      location: 'Sumatra',
      budget: 'Rp19.211.000.000',
      status: 'at-risk',
      progress: 68,
      deviation: 2.06,
      target: 100,
    },
    {
      id: '2',
      title: 'Rehabilitasi Jaringan Utama D.I Kewenangan Daerah di Provinsi Lampung (Paket I)',
      location: 'Sumatra',
      budget: 'Rp19.211.000.000',
      status: 'on-track',
      progress: 80,
      deviation: 0.08,
      target: 100,
    },
    {
      id: '3',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan jaringan Irigasi DIR Rawa Jitu dan Rawa Pitu di Kabupaten',
      location: 'Sumatra',
      budget: 'Rp29.900.973.824',
      status: 'delayed',
      progress: 20,
      deviation: 35,
      target: 100,
    },
    {
      id: '4',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan IrigasiDIR Rawa Jitu Di Kabupaten Mesuji',
      location: 'Sumatra',
      budget: 'Rp28.902.316.373',
      status: 'at-risk',
      progress: 68,
      deviation: 2.06,
      target: 100,
    },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

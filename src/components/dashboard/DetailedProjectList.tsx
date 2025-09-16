'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ClipboardList } from 'lucide-react'

interface ProjectProgress {
  id: string
  title: string
  status: 'on-track' | 'at-risk' | 'delayed'
  ira: string
  contractValue: string
  budget?: string
  actualProgress: number
  targetProgress: number
  isDetailed?: boolean
}

interface DetailedProjectListProps {
  className?: string
}

/**
 * Detailed Project List Component
 * Displays comprehensive project progress with:
 * - Progress bars showing actual vs target
 * - Project details (IRA, contract values)
 * - Status badges
 * - Budget information
 */
export function DetailedProjectList({ className }: DetailedProjectListProps) {
  // Demo project data - in real app this would come from API
  const projects: ProjectProgress[] = [
    {
      id: '1',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      status: 'on-track',
      ira: 'IRA 1',
      contractValue: 'Rp19.211.000.000',
      actualProgress: 90,
      targetProgress: 88,
    },
    {
      id: '2',
      title: 'Rehabilitasi Jaringan Utama D.I Kewenangan Daerah di Provinsi Lampung (Paket I)',
      status: 'at-risk',
      ira: 'IRA 2',
      contractValue: 'Rp38.624.955.000',
      actualProgress: 68,
      targetProgress: 72,
    },
    {
      id: '3',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan jaringan Irigasi DIR Rawa Jitu dan Rawa Pitu di Kabupaten Mesuji',
      status: 'delayed',
      ira: 'IRA III',
      contractValue: 'Rp29.900.973.824',
      actualProgress: 60,
      targetProgress: 67,
    },
    {
      id: '4',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      status: 'at-risk',
      ira: 'IRA 1',
      contractValue: 'Rp19.211.000.000',
      budget: 'Rp19.211.361.000',
      actualProgress: 55,
      targetProgress: 60,
      isDetailed: true,
    },
    {
      id: '5',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      status: 'on-track',
      ira: 'IRA 1',
      contractValue: 'Rp19.211.000.000',
      budget: 'Rp19.211.361.000',
      actualProgress: 80,
      targetProgress: 100,
      isDetailed: true,
    },
    {
      id: '6',
      title:
        'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi DIR Rawa Mesuji Atas di Kabupaten Mesuji',
      status: 'on-track',
      ira: 'IRA 1',
      contractValue: 'Rp19.211.000.000',
      budget: 'Rp19.211.361.000',
      actualProgress: 80,
      targetProgress: 100,
      isDetailed: true,
    },
    {
      id: '7',
      title: 'D.I. Gilingeng - Pembangunan',
      status: 'on-track',
      ira: '',
      contractValue: '',
      actualProgress: 65,
      targetProgress: 100,
    },
    {
      id: '8',
      title: 'D.I. Gilingeng - Pembangunan',
      status: 'on-track',
      ira: '',
      contractValue: '',
      actualProgress: 65,
      targetProgress: 100,
    },
    {
      id: '9',
      title: 'D.I. Gilingeng - Pembangunan',
      status: 'on-track',
      ira: '',
      contractValue: '',
      actualProgress: 65,
      targetProgress: 100,
    },
    {
      id: '10',
      title: 'D.I. Gilingeng - Pembangunan',
      status: 'on-track',
      ira: '',
      contractValue: '',
      actualProgress: 65,
      targetProgress: 100,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Track</Badge>
      case 'at-risk':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">At Risk</Badge>
      case 'delayed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Delayed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <span className="text-base sm:text-lg">Progress Seluruh Pekerjaan</span>
        </CardTitle>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Realisasi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-600">Rencana</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-6">
          {projects.map(project => (
            <div key={project.id} className="space-y-3">
              {/* Project Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium leading-5 text-gray-900">{project.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">
                    {project.isDetailed
                      ? `${project.actualProgress}% / ${project.targetProgress}%`
                      : `${project.actualProgress}%`}
                  </span>
                </div>
              </div>

              {/* Project Details */}
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {project.status && getStatusBadge(project.status)}
                {project.ira && (
                  <>
                    <span>•</span>
                    <span>{project.ira}</span>
                  </>
                )}
                {project.contractValue && (
                  <>
                    <span>•</span>
                    <span>Nilai Kontrak : {project.contractValue}</span>
                  </>
                )}
              </div>

              {/* Additional Details for detailed projects */}
              {project.isDetailed && project.budget && (
                <div className="text-xs text-gray-600">
                  <span>Pagu : {project.budget.replace('Rp', '').replace(/\./g, '')}</span>
                  <span className="mx-2">•</span>
                  <span>
                    Nilai Kontrak : {project.contractValue.replace('Rp', '').replace(/\./g, '')}
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress
                  value={project.actualProgress}
                  className={`h-2 ${
                    project.actualProgress >= project.targetProgress
                      ? '[&>div]:bg-green-500'
                      : project.actualProgress >= project.targetProgress * 0.9
                        ? '[&>div]:bg-yellow-500'
                        : '[&>div]:bg-red-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

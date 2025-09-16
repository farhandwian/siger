'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProjectStatus, useUpdateProjectStatus } from '@/hooks/useAddendum'
import { ProjectStatus } from '@/lib/schemas/addendum'
import { CreateAddendumModal } from './create-addendum-modal'
import { ProjectStatusBadge } from './project-status-badge'
import { 
  Plus, 
  Lock, 
  Unlock, 
  FileEdit, 
  AlertTriangle,
  Info 
} from 'lucide-react'

/**
 * ProjectStatusManager Component
 * 
 * Manages project lifecycle status and addendum creation
 * Shows current status, allows status transitions, and provides addendum creation
 */
interface ProjectStatusManagerProps {
  projectId: string
  projectTitle?: string
  className?: string
}

export function ProjectStatusManager({
  projectId,
  projectTitle,
  className = ''
}: ProjectStatusManagerProps) {
  const [isAddendumModalOpen, setIsAddendumModalOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Fetch current project status
  const { data: statusData, isLoading, error } = useProjectStatus(projectId)
  const updateProjectStatus = useUpdateProjectStatus()

  // Handle status updates
  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    setIsUpdatingStatus(true)
    try {
      await updateProjectStatus.mutateAsync({
        projectId,
        data: { status: newStatus }
      })
    } catch (error) {
      // Error handling is done by the mutation
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Status Proyek
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-32 rounded bg-gray-200"></div>
            <div className="h-4 w-48 rounded bg-gray-200"></div>
            <div className="h-10 w-40 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error || !statusData?.success) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Status Proyek
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Gagal memuat status proyek. Silakan coba lagi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { status, currentAddendum, canEditPlan, editableFromWeek } = statusData.data

  // Get available status transitions
  const getAvailableTransitions = (currentStatus: ProjectStatus) => {
    switch (currentStatus) {
      case 'DRAFT':
        return [
          {
            status: 'KONTRAK' as const,
            label: 'Kontrak',
            description: 'Kunci jadwal',
            icon: Lock,
            variant: 'destructive' as const
          }
        ]
      case 'KONTRAK':
        return [
          {
            status: 'DRAFT' as const,
            label: 'Draft',
            description: 'Buka kunci jadwal',
            icon: Unlock,
            variant: 'secondary' as const
          }
        ]
      case 'DRAFT_ADDENDUM':
        return [
          {
            status: 'KONTRAK' as const,
            label: 'Kontrak',
            description: 'Kunci jadwal',
            icon: Lock,
            variant: 'destructive' as const
          }
        ]
      default:
        return []
    }
  }

  const availableTransitions = getAvailableTransitions(status)

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Status Proyek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ProjectStatusBadge status={status} />
              {canEditPlan ? (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                  <Unlock className="h-3 w-3 mr-1" />
                  Dapat Diedit
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                  <Lock className="h-3 w-3 mr-1" />
                  Terkunci
                </Badge>
              )}
            </div>

            {/* Status Description */}
            <div className="text-sm text-gray-600">
              {status === 'DRAFT' && 'Semua jadwal dapat diedit bebas'}
              {status === 'KONTRAK' && 'Jadwal terkunci, tidak dapat diedit'}
              {status === 'DRAFT_ADDENDUM' && currentAddendum && (
                <>
                  Jadwal dapat diedit mulai minggu ke-{editableFromWeek} 
                  (Addendum {currentAddendum.addendumNumber})
                </>
              )}
            </div>
          </div>

          {/* Current Addendum Info */}
          {currentAddendum && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">
                    Addendum {currentAddendum.addendumNumber}: {currentAddendum.title}
                  </div>
                  <div className="mt-1 text-sm text-amber-700">
                    Berlaku mulai minggu ke-{currentAddendum.weekNumber}
                  </div>
                  <div className="text-sm text-amber-600">
                    Tanggal: {new Date(currentAddendum.effectiveDate).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Create Addendum Button */}
            <Button
              onClick={() => setIsAddendumModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Buat Addendum
            </Button>

            {/* Status Transition Buttons */}
            {availableTransitions.map((transition) => {
              const Icon = transition.icon
              return (
                <Button
                  key={transition.status}
                  onClick={() => handleStatusUpdate(transition.status)}
                  disabled={isUpdatingStatus}
                  variant={transition.variant}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {transition.label}
                </Button>
              )
            })}
          </div>

          {/* Status Update Error */}
          {updateProjectStatus.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateProjectStatus.error instanceof Error 
                  ? updateProjectStatus.error.message 
                  : 'Gagal mengubah status proyek'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Addendum Modal */}
      <CreateAddendumModal
        isOpen={isAddendumModalOpen}
        onClose={() => setIsAddendumModalOpen(false)}
        projectId={projectId}
        projectTitle={projectTitle}
      />
    </>
  )
}

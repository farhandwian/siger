'use client'

import { Badge } from '@/components/ui/badge'
import { ProjectStatus } from '@/lib/schemas/addendum'
import { Clock, Lock, FileEdit } from 'lucide-react'

/**
 * ProjectStatusBadge Component
 * 
 * Displays the current project status with appropriate styling and icon
 * Used to show the lifecycle state of the project for schedule editing permissions
 */
interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className = '' }: ProjectStatusBadgeProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          description: 'Semua jadwal dapat diedit',
          variant: 'secondary' as const,
          icon: FileEdit,
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        }
      case 'KONTRAK':
        return {
          label: 'Kontrak',
          description: 'Jadwal terkunci, tidak dapat diedit',
          variant: 'destructive' as const,
          icon: Lock,
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
        }
      case 'DRAFT_ADDENDUM':
        return {
          label: 'Draft Addendum',
          description: 'Jadwal dapat diedit dari minggu addendum',
          variant: 'default' as const,
          icon: Clock,
          className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        }
      default:
        return {
          label: 'Unknown',
          description: 'Status tidak diketahui',
          variant: 'outline' as const,
          icon: FileEdit,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium ${config.className}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    </div>
  )
}

/**
 * ProjectStatusIndicator Component
 * 
 * Enhanced version with tooltip showing detailed status information
 * Includes current addendum information if applicable
 */
interface ProjectStatusIndicatorProps {
  status: ProjectStatus
  currentAddendum?: {
    addendumNumber: number
    title: string
    weekNumber: number
    effectiveDate: Date
  } | null
  className?: string
}

export function ProjectStatusIndicator({ 
  status, 
  currentAddendum, 
  className = '' 
}: ProjectStatusIndicatorProps) {
  const config = (() => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          description: 'Semua jadwal dapat diedit bebas',
          variant: 'secondary' as const,
          icon: FileEdit,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'KONTRAK':
        return {
          label: 'Kontrak',
          description: 'Jadwal terkunci, tidak dapat diedit',
          variant: 'destructive' as const,
          icon: Lock,
          className: 'bg-red-50 text-red-700 border-red-200'
        }
      case 'DRAFT_ADDENDUM':
        return {
          label: 'Draft Addendum',
          description: currentAddendum 
            ? `Jadwal dapat diedit mulai minggu ke-${currentAddendum.weekNumber}`
            : 'Jadwal dapat diedit dari minggu addendum',
          variant: 'default' as const,
          icon: Clock,
          className: 'bg-amber-50 text-amber-700 border-amber-200'
        }
      default:
        return {
          label: 'Unknown',
          description: 'Status tidak diketahui',
          variant: 'outline' as const,
          icon: FileEdit,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }
  })()

  const Icon = config.icon

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={config.variant}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${config.className}`}
        >
          <Icon className="h-4 w-4" />
          {config.label}
        </Badge>
      </div>

      {/* Status Description */}
      <p className="text-sm text-gray-600">
        {config.description}
      </p>

      {/* Current Addendum Info */}
      {currentAddendum && status === 'DRAFT_ADDENDUM' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="font-medium text-amber-800">
            Addendum {currentAddendum.addendumNumber}: {currentAddendum.title}
          </div>
          <div className="mt-1 text-amber-700">
            Berlaku mulai minggu ke-{currentAddendum.weekNumber} 
            ({new Date(currentAddendum.effectiveDate).toLocaleDateString('id-ID')})
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProjectOptions, useCreateReport } from '@/hooks/useReports'
import { CreateWeeklyReport } from '@/lib/schemas/reports'
import { X, FileText } from 'lucide-react'

interface CreateReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal component for creating new weekly reports
 * Matches the Figma design with Pilih Proyek and Periode Laporan dropdowns
 */
export function CreateReportModal({ isOpen, onClose, onSuccess }: CreateReportModalProps) {
  const { data: projectOptions, isLoading: isLoadingProjects } = useProjectOptions()
  const createMutation = useCreateReport()

  const [formData, setFormData] = useState<CreateWeeklyReport>({
    projectId: '',
    weekNumber: 1,
    startDate: '',
    endDate: '',
    status: 'draft',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate week period options for the current year
  const generateWeekPeriods = () => {
    const currentYear = new Date().getFullYear()
    const periods = []

    for (let week = 1; week <= 52; week++) {
      // Calculate start date of the week (assuming week 1 starts on January 1st)
      const startOfYear = new Date(currentYear, 0, 1)
      const startDate = new Date(startOfYear)
      startDate.setDate(startDate.getDate() + (week - 1) * 7)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }

      periods.push({
        week,
        label: `Minggu Ke-${week} (${formatDate(startDate)} - ${formatDate(endDate)})`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
    }

    return periods
  }

  const weekPeriods = generateWeekPeriods()

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        projectId: '',
        weekNumber: 1,
        startDate: '',
        endDate: '',
        status: 'draft',
      })
      setErrors({})
    }
  }, [isOpen])

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required'
    }

    if (formData.weekNumber < 1 || formData.weekNumber > 52) {
      newErrors.weekNumber = 'Please select a valid week period'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    // TODO: Implement actual report creation logic
    console.log('Creating report with data:', formData)

    // For now, just close the modal and show success
    onSuccess()
    onClose()
  }

  // Handle project selection
  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({ ...prev, projectId }))

    // Clear error for this field
    if (errors.projectId) {
      setErrors(prev => ({ ...prev, projectId: '' }))
    }
  }

  // Handle week period selection
  const handleWeekPeriodChange = (weekNumber: string) => {
    const week = parseInt(weekNumber)
    const selectedPeriod = weekPeriods.find(p => p.week === week)

    if (selectedPeriod) {
      setFormData(prev => ({
        ...prev,
        weekNumber: week,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
      }))

      // Clear error for this field
      if (errors.weekNumber) {
        setErrors(prev => ({ ...prev, weekNumber: '' }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increased modal width: use full width up to max-w-4xl on large screens.
        Keeps responsive behavior: on smaller screens it will naturally shrink. */}
      <DialogContent className="w-full min-w-[500px] max-w-4xl gap-0 rounded-2xl bg-white p-0">
        {/* Header - matching Figma design */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6">
          <DialogTitle className="text-lg font-medium text-gray-900">Buat Laporan</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form Content */}

        {/* Use a wider inner container so content breathes inside the enlarged modal */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Proyek */}
            <div className="space-y-1">
              <Label htmlFor="projectId" className="text-sm font-medium text-gray-700">
                Pilih Proyek
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={handleProjectChange}
                disabled={isLoadingProjects}
              >
                <SelectTrigger
                  className={`w-full border-gray-200 bg-white shadow-sm ${
                    errors.projectId ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Pilih proyek..." />
                </SelectTrigger>
                <SelectContent className="max-w-[680px]">
                  {projectOptions?.data?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{project.name}</span>
                        {project.location && (
                          <span className="text-xs text-gray-500">{project.location}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
            </div>

            {/* Periode Laporan */}
            <div className="space-y-1">
              <Label htmlFor="weekPeriod" className="text-sm font-medium text-gray-700">
                Periode Laporan
              </Label>
              <Select value={formData.weekNumber.toString()} onValueChange={handleWeekPeriodChange}>
                <SelectTrigger
                  className={`w-full border-gray-200 bg-white shadow-sm ${
                    errors.weekNumber ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Pilih periode laporan..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {weekPeriods.slice(0, 20).map(period => (
                    <SelectItem key={period.week} value={period.week.toString()}>
                      <span className="text-sm text-gray-500">{period.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weekNumber && <p className="text-xs text-red-500">{errors.weekNumber}</p>}
            </div>

            {/* Error Message */}
            {createMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createMutation.error?.message || 'Failed to create report. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 bg-[#ffc928] font-medium text-[#364878] shadow-sm hover:bg-[#ffc928]/90"
              >
                <FileText className="h-5 w-5" />
                {createMutation.isPending ? 'Creating...' : 'Buat Laporan'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

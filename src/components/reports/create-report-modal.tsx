'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
import { useProjectOptions, useProjectDetails, useCreateReport } from '@/hooks/useReports'
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
  const createMutation = useCreateReport() // Use the new hook

  const [formData, setFormData] = useState<{ projectId: string; weekNumber: number }>({
    projectId: '',
    weekNumber: 1,
  })

  // Fetch project details when a project is selected
  const { data: projectDetails } = useProjectDetails(formData.projectId || undefined)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate week period options based on project dates (tanggalSpmk to akhirKontrak)
  const generateWeekPeriods = () => {
    // Type the periods array properly
    const periods: Array<{
      week: number
      label: string
      startDate: string
      endDate: string
    }> = []

    // Only generate periods if project is selected and has required dates
    if (!projectDetails?.data?.tanggalSpmk || !projectDetails?.data?.akhirKontrak) {
      return periods
    }

    // Parse project start date from tanggalSpmk
    const projectStartDate = new Date(projectDetails.data.tanggalSpmk)
    const projectEndDate = new Date(projectDetails.data.akhirKontrak)

    // Calculate the total number of weeks between start and end date
    const timeDiff = projectEndDate.getTime() - projectStartDate.getTime()
    const totalWeeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7))

    // Use project's numberOfWeeks if available, otherwise use calculated weeks
    const maxWeeks = projectDetails.data.numberOfWeeks || totalWeeks

    for (let week = 1; week <= maxWeeks; week++) {
      // Calculate start date of the week (week 1 starts from tanggalSpmk)
      const startDate = new Date(projectStartDate)
      startDate.setDate(projectStartDate.getDate() + (week - 1) * 7)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)

      // Don't allow weeks that go beyond the project end date
      if (startDate > projectEndDate) {
        break
      }

      // Ensure end date doesn't exceed project end date
      if (endDate > projectEndDate) {
        endDate.setTime(projectEndDate.getTime())
      }

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

    const maxWeeks = projectDetails?.data?.numberOfWeeks || 52
    if (formData.weekNumber < 1 || formData.weekNumber > maxWeeks) {
      newErrors.weekNumber = `Please select a valid week period (1-${maxWeeks})`
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

    try {
      // Use the weekly reports API endpoint for creating reports with calculation logic
      await createMutation.mutateAsync({
        projectId: formData.projectId,
        weekNumber: formData.weekNumber,
      })

      onSuccess()
      onClose()
    } catch (error) {
      // Error is handled by the mutation's error state
      // Error will be displayed through the createMutation.isError check below
    }
  }

  // Handle project selection
  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectId,
      // Reset week selection when project changes
      weekNumber: 1,
    }))

    // Clear errors for project and week fields
    if (errors.projectId || errors.weekNumber) {
      setErrors(prev => ({
        ...prev,
        projectId: '',
        weekNumber: '',
      }))
    }
  }

  // Handle week period selection
  const handleWeekPeriodChange = (weekNumber: string) => {
    const week = parseInt(weekNumber)

    setFormData(prev => ({
      ...prev,
      weekNumber: week,
    }))

    // Clear error for this field
    if (errors.weekNumber) {
      setErrors(prev => ({ ...prev, weekNumber: '' }))
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
                {projectDetails?.data && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Max: {projectDetails.data.numberOfWeeks || 52} minggu)
                  </span>
                )}
              </Label>
              <Select
                value={formData.weekNumber.toString()}
                onValueChange={handleWeekPeriodChange}
                disabled={!formData.projectId}
              >
                <SelectTrigger
                  className={`w-full border-gray-200 bg-white shadow-sm ${
                    errors.weekNumber ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue
                    placeholder={
                      !formData.projectId
                        ? 'Pilih proyek terlebih dahulu...'
                        : 'Pilih periode laporan...'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {weekPeriods.map(period => (
                    <SelectItem key={period.week} value={period.week.toString()}>
                      <span className="text-sm text-gray-500">{period.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weekNumber && <p className="text-xs text-red-500">{errors.weekNumber}</p>}
              {!formData.projectId && (
                <p className="text-xs text-gray-500">
                  Pilih proyek terlebih dahulu untuk melihat periode yang tersedia
                </p>
              )}
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

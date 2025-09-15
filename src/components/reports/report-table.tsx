'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { WeeklyReport, Pagination } from '@/lib/schemas/reports'
import { useDownloadReport } from '@/hooks/useReports'
import { cn } from '@/lib/utils'

interface ReportTableProps {
  data: WeeklyReport[]
  pagination?: Pagination
  isLoading: boolean
  error: Error | null
  onPageChange: (page: number) => void
}

/**
 * Table component for displaying weekly reports
 * Includes report data, action buttons, and pagination
 */
export function ReportTable({ 
  data, 
  pagination, 
  isLoading, 
  error, 
  onPageChange 
}: ReportTableProps) {
  const downloadMutation = useDownloadReport()

  // Handle view report action
  const handleViewReport = (report: WeeklyReport) => {
    // TODO: Implement report viewing logic (open in modal or navigate to detail page)
    console.log('View report:', report.id)
  }

  // Handle download report action
  const handleDownloadReport = async (report: WeeklyReport) => {
    try {
      await downloadMutation.mutateAsync({
        reportId: report.id,
        fileName: `laporan-${report.projectName}-minggu-${report.weekNumber}.pdf`,
      })
    } catch (error) {
      console.error('Download failed:', error)
      // TODO: Show error toast notification
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Table Header */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="bg-slate-700 text-white">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-1">
                <Skeleton className="h-4 w-8 bg-slate-600" />
              </div>
              <div className="col-span-6">
                <Skeleton className="h-4 w-16 bg-slate-600" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-16 bg-slate-600" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-12 bg-slate-600" />
              </div>
            </div>
          </div>

          {/* Table Body Skeleton */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-1">
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="col-span-6">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="col-span-2 flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || 'Failed to load reports. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Eye className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-sm text-gray-500 mb-4">
            No weekly reports match your current filters. Try adjusting your search or filters.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-700 text-white">
          <div className="grid grid-cols-12 gap-4 px-6 py-4">
            <div className="col-span-1">
              <h3 className="text-xs font-bold">No</h3>
            </div>
            <div className="col-span-6">
              <h3 className="text-xs font-bold">Proyek</h3>
            </div>
            <div className="col-span-3">
              <h3 className="text-xs font-bold">Periode</h3>
            </div>
            <div className="col-span-2 text-center">
              <h3 className="text-xs font-bold">Aksi</h3>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {data.map((report, index) => {
            const rowNumber = pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1
            
            return (
              <div key={report.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50">
                {/* Row Number */}
                <div className="col-span-1">
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {rowNumber}.
                  </span>
                </div>

                {/* Project Name */}
                <div className="col-span-6">
                  <h4 className="text-sm font-medium text-gray-700 leading-5">
                    {report.projectName}
                  </h4>
                </div>

                {/* Period */}
                <div className="col-span-3">
                  <div className="text-xs text-gray-700 space-x-1">
                    <span>Minggu ke-{report.weekNumber}</span>
                    <span className="text-gray-400">|</span>
                    <span>{report.reportPeriod.split(' | ')[1]}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex gap-2 justify-center">
                  <Button
                    size="sm"
                    onClick={() => handleViewReport(report)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Lihat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadReport(report)}
                    disabled={downloadMutation.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {downloadMutation.isPending ? 'Downloading...' : 'Unduh'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationComponent
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

interface PaginationComponentProps {
  pagination: Pagination
  onPageChange: (page: number) => void
}

function PaginationComponent({ pagination, onPageChange }: PaginationComponentProps) {
  const { page, totalPages } = pagination

  // Calculate page range to show
  const getPageRange = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {getPageRange().map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span key={index} className="px-3 py-2 text-sm text-gray-500">
                ...
              </span>
            )
          }

          const isCurrentPage = pageNum === page

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum as number)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg",
                isCurrentPage 
                  ? "bg-[#ffc928] text-[#1a365d] hover:bg-[#ffc928]/90" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReportHeader } from '@/components/reports/report-header'
import { ReportFilters } from '@/components/reports/report-filters'
import { ReportTable } from '@/components/reports/report-table'
import { CreateReportModal } from '@/components/reports/create-report-modal'
import { useReports } from '@/hooks/useReports'
import { ReportQuery } from '@/lib/schemas/reports'

/**
 * Laporan Mingguan Pekerjaan (Weekly Work Reports) Page
 *
 * This page displays a list of weekly work reports with:
 * - Header with title and create report button
 * - Filters for search, project selection, and period selection
 * - Table displaying reports with view and download actions
 * - Pagination for navigating through results
 */
export default function LaporanPage() {
  const { isAuthenticated, isLoading, permissions } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // State for filters and pagination
  const [filters, setFilters] = useState<Partial<ReportQuery>>({
    page: 1,
    limit: 10,
    search: '',
    projectId: '',
    startDate: '',
    endDate: '',
  })

  // Fetch reports data with current filters
  const {
    data: reportsData,
    isLoading: isLoadingReports,
    error: reportsError,
  } = useReports(filters)

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ReportQuery>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Handle successful report creation
  const handleReportCreated = () => {
    setIsCreateModalOpen(false)
    // Data will be automatically refetched due to React Query invalidation
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated (handled by middleware)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Alert>
          <AlertDescription>Please sign in to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed positioning handled in component */}
      <Sidebar className={sidebarOpen ? 'translate-x-0' : ''} />

      {/* Main Content - Use padding instead of margin for better layout */}
      <div className="min-h-screen pl-0 lg:pl-44 xl:pl-64">
        {/* Mobile Menu Button - Reduced padding */}
        <div className="border-b border-gray-200 bg-white p-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>

        {/* Header */}
        <Header
          breadcrumb={{
            level1: 'Laporan',
            level2: 'Mingguan Pekerjaan',
          }}
        />

        {/* Content - Reduced padding, enlarged card content */}
        <main className="p-2 lg:p-3 xl:p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:p-5 xl:p-8">
            {/* Report Header */}
            <ReportHeader
              onCreateReport={() => setIsCreateModalOpen(true)}
              canCreateReports={permissions?.canCreateProjects || true} // Adjust permission as needed
            />

            {/* Divider */}
            <div className="my-3 border-t border-gray-200 lg:my-4 xl:my-6" />

            {/* Report Filters */}
            <ReportFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Report Table */}
            <div className="mt-4 lg:mt-6">
              <ReportTable
                data={reportsData?.data || []}
                pagination={reportsData?.pagination}
                isLoading={isLoadingReports}
                error={reportsError}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleReportCreated}
      />
    </div>
  )
}

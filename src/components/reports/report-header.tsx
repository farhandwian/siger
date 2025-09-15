'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ReportHeaderProps {
  onCreateReport: () => void
  canCreateReports: boolean
}

/**
 * Header component for the Reports page
 * Contains the page title and create report button
 */
export function ReportHeader({ onCreateReport, canCreateReports }: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      {/* Page Title */}
      <h1 className="text-base font-medium text-gray-900 sm:text-lg lg:text-xl">
        Laporan Mingguan Pekerjaan
      </h1>

      {/* Create Report Button */}
      <Button
        onClick={onCreateReport}
        disabled={!canCreateReports}
        className="flex items-center gap-2 rounded-lg bg-[#ffc928] px-4 py-2.5 text-sm font-medium text-[#1a365d] hover:bg-[#ffc928]/90 focus:bg-[#ffc928]/90 disabled:cursor-not-allowed disabled:opacity-50"
        title={
          !canCreateReports
            ? 'You do not have permission to create reports'
            : 'Create a new weekly report'
        }
      >
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Buat Laporan Mingguan</span>
        <span className="sm:hidden">Buat Laporan</span>
      </Button>
    </div>
  )
}

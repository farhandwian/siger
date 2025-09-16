'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReportPreviewModal } from '@/components/reports/report-preview-modal'

/**
 * Test component to demonstrate the weekly report functionality
 */
export default function WeeklyReportTest() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Report Test</h1>
          <p className="text-gray-600 mt-2">
            Test the weekly report preview modal with dummy data to verify UI functionality.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Features</h2>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li>✅ Sticky table headers with proper z-index</li>
            <li>✅ Merged table rows for sub-activities (rowSpan)</li>
            <li>🔄 Using dummy data for UI testing</li>
            <li>🔄 Excel export placeholder (shows alert)</li>
            <li>✅ Responsive design matching design system</li>
            <li>✅ Proper table structure and styling</li>
            <li>✅ Status badges and formatting</li>
          </ul>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Open Weekly Report Preview
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Dummy Data Preview</h3>
          <p className="text-blue-700 text-sm">
            The modal now uses hardcoded dummy data for testing purposes. The report includes:
          </p>
          <ul className="text-yellow-700 text-sm mt-2 space-y-1">
            <li>• Project: Rehabilitasi/Peningkatan Jaringan Irigasi DIDIRI</li>
            <li>• Week 2 (August 14-20, 2025)</li>
            <li>• 3 main activities with multiple sub-activities</li>
            <li>• Complete progress tracking and status information</li>
          </ul>
        </div>
      </div>

      <ReportPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={null}
      />
    </div>
  )
}
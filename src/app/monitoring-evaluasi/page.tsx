'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SummaryCards } from '@/components/monitoring/summary-cards'
import { ProjectList } from '@/components/monitoring/project-list'
import { Button } from '@/components/ui/button'

export default function MonitoringEvaluasiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Full height */}
      <div
        className={`
        fixed left-0 top-0 z-50 h-screen transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 lg:ml-0">
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
            level1: 'Monitoring & Evaluasi',
            level2: 'Data Teknis',
          }}
        />

        {/* Content - Reduced padding, enlarged card content */}
        <main className="p-2 lg:p-3 xl:p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:p-5 xl:p-8">
            {/* Summary Section */}
            <div className="space-y-3 lg:space-y-4 xl:space-y-6">
              <div>
                <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                  Rangkuman Evaluasi
                </h2>
                <SummaryCards />
              </div>

              {/* Divider */}
              <div className="my-3 border-t border-gray-200 lg:my-4 xl:my-6" />

              {/* Project List Section */}
              <div>
                <h2 className="mb-2 text-[10px] font-medium text-gray-900 lg:mb-3 lg:text-xs xl:text-sm">
                  Daftar Pekerjaan
                </h2>
                <ProjectList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

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

      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-0 z-50 h-full transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 lg:ml-0">
        {/* Mobile Menu Button */}
        <div className="border-b border-gray-200 bg-white p-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Content */}
        <main className="p-4 lg:p-6 xl:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:p-6">
            {/* Summary Section */}
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h2 className="mb-3 text-base font-medium text-gray-900 lg:mb-4 lg:text-lg">
                  Rangkuman Evaluasi
                </h2>
                <SummaryCards />
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-gray-200 lg:my-8" />

              {/* Project List Section */}
              <div>
                <h2 className="mb-3 text-base font-medium text-gray-900 lg:mb-4 lg:text-lg">
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

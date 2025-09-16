'use client'

import React, { useState } from 'react'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Map } from 'lucide-react'
import { UsulanSection } from '@/components/dashboard/UsulanSection'
import { PelaksanaanComprehensive } from '@/components/pelaksanaan'
import { PelaksanaanMap } from '@/components/dashboard/PelaksanaanMap'
import { useAuth } from '@/hooks/useAuth'

// Loading components
function MapSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Peta Pelaksanaan Proyek
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-10 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed positioning handled in component */}
      <Sidebar />

      {/* Main Content - Use padding instead of margin for better layout */}
      <div className="flex min-h-screen flex-col pl-0 lg:pl-44 xl:pl-64">
        {/* Header */}
        <Header
          title="Dashboard SIGER"
          breadcrumb={{
            level1: 'Dashboard',
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div className="space-y-6 lg:space-y-8">
              {/* Map Section */}
              <section className="space-y-4">
                <Card className="rounded-2xl">
                  <CardContent className="min-w-[400px] p-0">
                    <Suspense fallback={<MapSkeleton />}>
                      <PelaksanaanMap className="w-full" />
                    </Suspense>
                  </CardContent>
                </Card>
              </section>

              {/* Usulan Section */}
              <section className="space-y-4">
                <Suspense fallback={<SectionSkeleton />}>
                  <UsulanSection />
                </Suspense>
              </section>

              {/* Pelaksanaan Section */}
              <section className="space-y-6">
                {/* New Integrated Pelaksanaan Section */}
                <Suspense fallback={<SectionSkeleton />}>
                  <PelaksanaanComprehensive />
                </Suspense>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

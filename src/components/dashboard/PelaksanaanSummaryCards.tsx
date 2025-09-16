'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Building2, DollarSign, TrendingUp, Target } from 'lucide-react'
import { ProjectSummaryResponseSchema } from '@/lib/schemas/usulan'

// Hook to fetch project summary data
function useProjectSummary() {
  return useQuery({
    queryKey: ['project-summary'],
    queryFn: async () => {
      const response = await fetch('/api/projects/summary')
      if (!response.ok) {
        throw new Error('Failed to fetch project summary')
      }
      const data = await response.json()
      return ProjectSummaryResponseSchema.parse(data)
    },
    staleTime: 30_000, // 30 seconds
  })
}

// Format currency helper
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp. ${(value / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '')}T`
  } else if (value >= 1_000_000) {
    return `Rp. ${(value / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`
  } else if (value >= 1_000) {
    return `Rp. ${(value / 1_000).toFixed(3).replace(/\.?0+$/, '')}K`
  }
  return `Rp. ${value.toLocaleString('id-ID')}`
}

// Individual summary card component matching Figma design
function SummaryCard({
  title,
  value,
  icon: Icon,
  bgColor,
  borderColor,
  iconColor,
}: {
  title: string
  value: string | number
  icon: any
  bgColor: string
  borderColor: string
  iconColor: string
}) {
  return (
    <div
      className={`relative ${bgColor} flex min-w-0 flex-1 flex-col gap-1.5 rounded-[16px] px-5 py-3 shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)]`}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <div className="text-sm font-normal leading-[20px] text-gray-400">{title}</div>
        </div>
        <div className="break-words text-xl font-semibold leading-normal text-gray-700">
          {value}
        </div>
      </div>
      <div
        className={`absolute ${borderColor} left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r`}
      />
    </div>
  )
}

// Loading skeleton for cards
function SummaryCardSkeleton() {
  return (
    <div className="relative flex flex-1 flex-col gap-1.5 rounded-[16px] bg-gray-50 px-5 py-3 shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r bg-gray-300" />
    </div>
  )
}

export function PelaksanaanSummaryCards() {
  const { data, isLoading, isError, error } = useProjectSummary()

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ringkasan Pelaksanaan</h2>
        </div>
        <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ringkasan Pelaksanaan</h2>
        </div>
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gagal memuat data pelaksanaan</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'Terjadi kesalahan saat mengambil data summary'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const summary = data.data

  // The data already includes calculated averages
  const avgProgress = summary.progressRataRata
  const avgDeviation = summary.deviasiRataRata

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ringkasan Pelaksanaan</h2>
        <div className="text-xs text-gray-500 sm:text-sm">
          Data real-time dari {summary.totalProyek} proyek aktif
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row">
        {/* Total Projects */}
        <SummaryCard
          title="Total Proyek"
          value={summary.totalProyek}
          icon={Building2}
          bgColor="bg-blue-50"
          borderColor="bg-blue-500"
          iconColor="text-blue-600"
        />

        {/* Total Contract Value */}
        <SummaryCard
          title="Total Kontrak"
          value={formatCurrency(summary.totalKontrak)}
          icon={DollarSign}
          bgColor="bg-yellow-50"
          borderColor="bg-yellow-500"
          iconColor="text-yellow-600"
        />

        {/* Average Progress */}
        <SummaryCard
          title="Progress Rata-Rata"
          value={`${Math.round(avgProgress)}%`}
          icon={TrendingUp}
          bgColor="bg-emerald-50"
          borderColor="bg-emerald-500"
          iconColor="text-emerald-600"
        />

        {/* Average Deviation */}
        <SummaryCard
          title="Deviasi Rata-Rata"
          value={`(${Math.abs(Math.round(avgDeviation * 100) / 100)}%)`}
          icon={Target}
          bgColor="bg-rose-50"
          borderColor="bg-rose-500"
          iconColor="text-rose-600"
        />
      </div>
    </div>
  )
}

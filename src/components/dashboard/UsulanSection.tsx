'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Static dummy data for usulan statistics
const USULAN_STATUS_DATA = {
  total: 22,
  menungguVerifikasi: 5,
  diterima: 11,
  ditolak: 6,
}

// Static dummy data for accepted proposals breakdown
const USULAN_DITERIMA_DATA = {
  totalAnggaran: 'Rp. 145.987.140.000',
  categories: [
    {
      name: 'Pembangunan',
      totalUsulan: 4,
      totalOutcome: '150 Ha',
    },
    {
      name: 'Rehabilitasi',
      totalUsulan: 4,
      totalOutcome: '250 Ha',
    },
    {
      name: 'Peningkatan',
      totalUsulan: 3,
      totalOutcome: '200 Ha',
    },
  ],
}

// Reusable StatusCard component using shadcn/ui
/**
 * Summary card with exact Figma design - colored backgrounds with left border indicators
 */
function SummaryCard({
  title,
  value,
  bgColor,
  borderColor,
  isLoading = false,
}: {
  title: string
  value: string
  bgColor: string
  borderColor: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card className={`relative overflow-hidden rounded-2xl ${bgColor} border-0`}>
        <div
          className={`absolute left-0 top-1/2 h-20 w-1.5 -translate-y-1/2 ${borderColor} rounded-r`}
        />
        <CardContent className="py-3 pl-5 pr-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 bg-white/20" />
            <Skeleton className="h-6 w-16 bg-white/20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`relative overflow-hidden rounded-2xl ${bgColor} border-0 shadow-sm`}>
      <div
        className={`absolute left-0 top-1/2 h-20 w-1.5 -translate-y-1/2 ${borderColor} rounded-r`}
      />
      <CardContent className="py-3 pl-5 pr-4">
        <div className="space-y-2">
          <p className="text-sm leading-5 text-gray-400">{title}</p>
          <p className="text-xl font-semibold text-gray-700">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// StatusCard component for both status cards and budget cards
function StatusCard({
  title,
  value,
  bgColor = 'bg-white',
  indicatorColor,
  className = '',
}: {
  title: string
  value: string | number
  bgColor?: string
  indicatorColor: string
  className?: string
}) {
  const displayValue = typeof value === 'number' ? `${value} Usulan` : value

  return (
    <Card className={`relative flex-1 rounded-2xl shadow-sm ${bgColor} ${className}`}>
      <CardContent className="px-5 py-3">
        <div className="space-y-2">
          <p className="text-sm leading-5 text-gray-400">{title}</p>
          <p className="text-xl font-semibold text-gray-700">{displayValue}</p>
        </div>
        <div
          className={`absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 ${indicatorColor}`}
        />
      </CardContent>
    </Card>
  )
}

// Reusable StatisticItem component for the category breakdown
function StatisticItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-700">{value}</p>
    </div>
  )
}

export function UsulanSection() {
  // Use static dummy data for now
  const statusStats = USULAN_STATUS_DATA

  // Status cards configuration for cleaner rendering
  const statusCards = [
    {
      title: 'Total Usulan',
      value: `${statusStats.total} Usulan`,
      bgColor: 'bg-blue-50',
      borderColor: 'bg-blue-500',
    },
    {
      title: 'Menunggu Verifikasi',
      value: `${statusStats.menungguVerifikasi} Usulan`,
      bgColor: 'bg-white border border-gray-200',
      borderColor: 'bg-yellow-500',
    },
    {
      title: 'Diterima',
      value: `${statusStats.diterima} Usulan`,
      bgColor: 'bg-emerald-50',
      borderColor: 'bg-emerald-500',
    },
    {
      title: 'Ditolak',
      value: `${statusStats.ditolak} Usulan`,
      bgColor: 'bg-red-50',
      borderColor: 'bg-red-500',
    },
  ]

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* Main Title */}
        <h2 className="text-lg font-semibold text-gray-700">Usulan</h2>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map(card => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              bgColor={card.bgColor}
              borderColor={card.borderColor}
            />
          ))}
        </div>

        {/* Usulan Diterima Section */}
        <Card className="rounded-2xl border border-gray-200 bg-white">
          <CardContent className="space-y-2 p-3">
            <div className="px-4 py-2.5">
              <h3 className="text-lg font-semibold text-gray-700">Usulan Diterima</h3>
            </div>

            <div className="flex gap-4">
              {/* Total Anggaran Card */}
              <Card className="relative flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardContent className="px-4 py-3">
                  <div className="space-y-2">
                    <p className="text-sm leading-5 text-gray-700">Total Anggaran</p>
                    <p className="text-xl font-bold text-gray-700">
                      {USULAN_DITERIMA_DATA.totalAnggaran}
                    </p>
                  </div>
                  <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 bg-[#364878]" />
                </CardContent>
              </Card>

              {/* Category Cards */}
              {USULAN_DITERIMA_DATA.categories.map(category => (
                <Card
                  key={category.name}
                  className="relative flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <CardContent className="px-4 py-3">
                    <div className="space-y-2">
                      <p className="text-sm leading-5 text-gray-700">{category.name}</p>
                      <div className="flex gap-4">
                        <StatisticItem label="Total Usulan" value={category.totalUsulan} />
                        <StatisticItem label="Total Outcome" value={category.totalOutcome} />
                      </div>
                    </div>
                    <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 bg-[#364878]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

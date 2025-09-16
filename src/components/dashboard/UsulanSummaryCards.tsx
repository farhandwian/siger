'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

// Dummy data for usulan summary (since business process unclear per user requirement)
const DUMMY_USULAN_DATA = {
  totalUsulan: 42,
  menungguVerifikasi: 15,
  diterima: 23,
  ditolak: 4,
  totalAnggaran: 15750000000, // 15.75 billion
}

// Format currency helper
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}T`
  } else if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}M`
  } else if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(1)}K`
  }
  return `Rp ${value.toLocaleString('id-ID')}`
}

// Individual summary card component
function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  hint?: string
  icon?: any
  trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          {Icon && <Icon className="h-5 w-5 text-gray-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold sm:text-3xl lg:text-4xl">{value}</div>
          {trend && (
            <div className={`text-sm ${trendColors[trend]}`}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'neutral' && '→'}
            </div>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export function UsulanSummaryCards() {
  const data = DUMMY_USULAN_DATA

  // Calculate approval rate for trend indication
  const approvalRate = data.totalUsulan > 0 ? (data.diterima / data.totalUsulan) * 100 : 0
  const approvalTrend = approvalRate >= 70 ? 'up' : approvalRate >= 40 ? 'neutral' : 'down'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ringkasan Usulan</h2>
        <div className="text-xs text-gray-500 sm:text-sm">Data dummy untuk demo dashboard</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {/* Total Usulan */}
        <SummaryCard
          title="Total Usulan"
          value={data.totalUsulan}
          hint="Usulan yang diajukan"
          icon={FileText}
          trend="neutral"
        />

        {/* Menunggu Verifikasi */}
        <SummaryCard
          title="Menunggu Verifikasi"
          value={data.menungguVerifikasi}
          hint="Perlu ditinjau"
          icon={Clock}
          trend="neutral"
        />

        {/* Diterima */}
        <SummaryCard
          title="Diterima"
          value={data.diterima}
          hint={`${Math.round(approvalRate)}% tingkat persetujuan`}
          icon={CheckCircle}
          trend={approvalTrend}
        />

        {/* Ditolak */}
        <SummaryCard
          title="Ditolak"
          value={data.ditolak}
          hint="Usulan tidak disetujui"
          icon={XCircle}
          trend="down"
        />
      </div>

      {/* Total Budget Card */}
      <div className="mt-6">
        <Card className="rounded-2xl border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-blue-900 sm:text-lg">
              <FileText className="h-5 w-5" />
              Total Anggaran Usulan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-900 sm:text-4xl lg:text-5xl">
              {formatCurrency(data.totalAnggaran)}
            </div>
            <p className="mt-2 text-sm text-blue-700">
              Kebutuhan anggaran keseluruhan dari {data.totalUsulan} usulan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

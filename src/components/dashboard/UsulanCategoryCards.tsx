'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Building, TrendingUp } from 'lucide-react'

// Dummy data for usulan category breakdown (since business process unclear per user requirement)
const DUMMY_CATEGORY_DATA = {
  pembangunan: {
    count: 18,
    budget: 8500000000, // 8.5 billion
    avgOutcome: 125.5,
    description: 'Infrastruktur baru',
  },
  rehabilitasi: {
    count: 16,
    budget: 4750000000, // 4.75 billion
    avgOutcome: 89.2,
    description: 'Perbaikan infrastruktur',
  },
  peningkatan: {
    count: 8,
    budget: 2500000000, // 2.5 billion
    avgOutcome: 156.8,
    description: 'Upgrade kapasitas',
  },
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

// Individual category card component
function CategoryCard({
  title,
  count,
  budget,
  avgOutcome,
  description,
  icon: Icon,
  color,
}: {
  title: string
  count: number
  budget: number
  avgOutcome: number
  description: string
  icon: any
  color: string
}) {
  return (
    <Card className={`rounded-2xl border-l-4 ${color}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Icon className="h-5 w-5 text-gray-600" />
          {title}
        </CardTitle>
        <p className="text-xs text-gray-600 sm:text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Jumlah Usulan:</span>
          <span className="text-lg font-semibold">{count}</span>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Anggaran:</span>
          <span className="text-lg font-semibold">{formatCurrency(budget)}</span>
        </div>

        {/* Average Outcome */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rata-rata Outcome:</span>
          <span className="text-lg font-semibold">{avgOutcome.toFixed(1)} Ha</span>
        </div>

        {/* Budget per project */}
        <div className="border-t border-gray-100 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Rata-rata per usulan:</span>
            <span className="text-sm font-medium text-gray-700">
              {formatCurrency(budget / count)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UsulanCategoryCards() {
  const totalCount = Object.values(DUMMY_CATEGORY_DATA).reduce((sum, cat) => sum + cat.count, 0)
  const totalBudget = Object.values(DUMMY_CATEGORY_DATA).reduce((sum, cat) => sum + cat.budget, 0)

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Kategori Kegiatan</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{totalCount} total usulan</span>
          <span>•</span>
          <span>{formatCurrency(totalBudget)} total anggaran</span>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
        <CategoryCard
          title="Pembangunan"
          count={DUMMY_CATEGORY_DATA.pembangunan.count}
          budget={DUMMY_CATEGORY_DATA.pembangunan.budget}
          avgOutcome={DUMMY_CATEGORY_DATA.pembangunan.avgOutcome}
          description={DUMMY_CATEGORY_DATA.pembangunan.description}
          icon={Building}
          color="border-l-blue-500"
        />

        <CategoryCard
          title="Rehabilitasi"
          count={DUMMY_CATEGORY_DATA.rehabilitasi.count}
          budget={DUMMY_CATEGORY_DATA.rehabilitasi.budget}
          avgOutcome={DUMMY_CATEGORY_DATA.rehabilitasi.avgOutcome}
          description={DUMMY_CATEGORY_DATA.rehabilitasi.description}
          icon={Wrench}
          color="border-l-amber-500"
        />

        <CategoryCard
          title="Peningkatan"
          count={DUMMY_CATEGORY_DATA.peningkatan.count}
          budget={DUMMY_CATEGORY_DATA.peningkatan.budget}
          avgOutcome={DUMMY_CATEGORY_DATA.peningkatan.avgOutcome}
          description={DUMMY_CATEGORY_DATA.peningkatan.description}
          icon={TrendingUp}
          color="border-l-emerald-500"
        />
      </div>

      {/* Note about dummy data */}
      <div className="mt-4 rounded-lg border-l-4 border-l-gray-400 bg-gray-50 p-3">
        <p className="text-xs text-gray-600">
          <strong>Catatan:</strong> Data di atas adalah data dummy untuk keperluan demo dashboard.
          Data kategori kegiatan akan diintegrasikan dengan sistem usulan yang sebenarnya setelah
          proses bisnis usulan lebih jelas.
        </p>
      </div>
    </div>
  )
}

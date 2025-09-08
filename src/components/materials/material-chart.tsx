'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Material } from '@/hooks/useMaterialQueries'

interface MaterialChartProps {
  materials: Material[]
  selectedMaterial: string
  onMaterialChange: (material: string) => void
}

export function MaterialChart({
  materials,
  selectedMaterial,
  onMaterialChange,
}: MaterialChartProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Find the current material
  const currentMaterial = materials.find(m => m.jenisMaterial === selectedMaterial) || materials[0]

  // Update parent component when material selection changes
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterial) {
      onMaterialChange(materials[0].jenisMaterial)
    }
  }, [materials, selectedMaterial, onMaterialChange])

  // Initialize selected month based on current material's start date
  useEffect(() => {
    if (
      currentMaterial?.tanggalMulai &&
      selectedMonth === new Date().getMonth() + 1 &&
      selectedYear === new Date().getFullYear()
    ) {
      const startDate = new Date(currentMaterial.tanggalMulai)
      setSelectedMonth(startDate.getMonth() + 1)
      setSelectedYear(startDate.getFullYear())
    }
  }, [currentMaterial?.id])

  // Get current month for display
  const currentMonth = new Date(selectedYear, selectedMonth - 1)
    .toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  // Generate chart data based on selected month and material schedules
  const chartData = useMemo(() => {
    if (
      !currentMaterial?.schedules ||
      !currentMaterial?.tanggalMulai ||
      !currentMaterial?.tanggalSelesai
    ) {
      return []
    }

    const materialStart = new Date(currentMaterial.tanggalMulai)
    const materialEnd = new Date(currentMaterial.tanggalSelesai)

    // Get first and last day of selected month
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
    const monthEnd = new Date(selectedYear, selectedMonth, 0) // Last day of month

    // Use the overlapping period between material dates and selected month
    const startDate = materialStart > monthStart ? materialStart : monthStart
    const endDate = materialEnd < monthEnd ? materialEnd : monthEnd

    // Only generate dates if there's an overlap
    if (startDate > endDate) {
      return []
    }

    const dates = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push({
        date: currentDate.toISOString().split('T')[0],
        display: currentDate.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
        }),
        fullDate: new Date(currentDate),
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Sort schedules by date to ensure proper cumulative calculation
    const sortedSchedules = [...(currentMaterial.schedules || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Calculate cumulative values for each date in the selected month
    return dates.map(dateObj => {
      // Calculate cumulative rencana up to this date (from all schedules, not just current month)
      const rencanaKumulatif = sortedSchedules
        .filter(schedule => schedule.date <= dateObj.date)
        .reduce((sum, schedule) => sum + (schedule.rencana || 0), 0)

      // Calculate cumulative realisasi up to this date (from all schedules, not just current month)
      const realisasiKumulatif = sortedSchedules
        .filter(schedule => schedule.date <= dateObj.date)
        .reduce((sum, schedule) => sum + (schedule.realisasi || 0), 0)

      return {
        date: dateObj.display,
        rencanaKumulatif,
        realisasiKumulatif,
      }
    })
  }, [currentMaterial, selectedMonth, selectedYear])

  if (!currentMaterial) {
    return (
      <Card className="border border-gray-200 bg-transparent">
        <CardHeader className="space-y-0">
          <CardTitle className="text-lg text-gray-700">Kurva-S Material</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center text-gray-500">
            Tidak ada data material untuk ditampilkan
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 bg-transparent">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-700">
            Kurva-S: {currentMaterial.jenisMaterial}
          </CardTitle>
          <div className="text-sm text-gray-500">
            Target: {currentMaterial.volumeTarget.toLocaleString('id-ID')}{' '}
            {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Material Selection and Month Filter */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Material Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Material:</label>
            <select
              value={selectedMaterial}
              onChange={e => onMaterialChange(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              {materials.map(material => (
                <option key={material.id} value={material.jenisMaterial}>
                  {material.jenisMaterial}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="w-48">
            <div className="relative">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12)
                        setSelectedYear(selectedYear - 1)
                      } else {
                        setSelectedMonth(selectedMonth - 1)
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">{currentMonth}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1)
                        setSelectedYear(selectedYear + 1)
                      } else {
                        setSelectedMonth(selectedMonth + 1)
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center justify-end gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-400" />
            <span className="text-sm font-medium text-gray-500">Rencana Kumulatif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FFC928]" />
            <span className="text-sm font-medium text-gray-500">Realisasi Kumulatif</span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-gray-500">
            Tidak ada data untuk bulan {currentMonth.toLowerCase()}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={chartData}
              margin={{
                left: 20,
                right: 12,
                top: 12,
                bottom: 30,
              }}
            >
              <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
              <XAxis
                dataKey="date"
                tickLine={true}
                axisLine={true}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{
                  value: 'Tanggal',
                  position: 'insideBottom',
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' },
                }}
              />
              <YAxis
                tickLine={true}
                axisLine={true}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={value => value.toLocaleString('id-ID')}
                label={{
                  value: `Volume Kumulatif (${currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fill: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                  offset: 10,
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg">
                        <p className="font-medium text-gray-900">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value?.toLocaleString('id-ID')}{' '}
                            {currentMaterial.volumeSatuan === 'm3'
                              ? 'm³'
                              : currentMaterial.volumeSatuan}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                dataKey="rencanaKumulatif"
                type="monotone"
                stroke="#60A5FA"
                strokeWidth={3}
                dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2 }}
                name="Rencana Kumulatif"
              />
              <Line
                dataKey="realisasiKumulatif"
                type="monotone"
                stroke="#FFC928"
                strokeWidth={3}
                dot={{ fill: '#FFC928', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#FFC928', strokeWidth: 2 }}
                name="Realisasi Kumulatif"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Target Volume</div>
            <div className="text-sm font-medium">
              {currentMaterial.volumeTarget.toLocaleString('id-ID')}{' '}
              {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Rencana Kumulatif Akhir</div>
            <div className="text-sm font-medium text-blue-600">
              {chartData.length > 0
                ? chartData[chartData.length - 1]?.rencanaKumulatif?.toLocaleString('id-ID') || 0
                : 0}{' '}
              {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Realisasi Kumulatif Akhir</div>
            <div className="text-sm font-medium text-yellow-600">
              {chartData.length > 0
                ? chartData[chartData.length - 1]?.realisasiKumulatif?.toLocaleString('id-ID') || 0
                : 0}{' '}
              {currentMaterial.volumeSatuan === 'm3' ? 'm³' : currentMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Persentase Tercapai</div>
            <div className="text-sm font-medium">
              {currentMaterial.volumeTarget > 0 && chartData.length > 0
                ? (
                    ((chartData[chartData.length - 1]?.realisasiKumulatif || 0) /
                      currentMaterial.volumeTarget) *
                    100
                  ).toFixed(1)
                : '0'}
              %
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

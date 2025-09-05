'use client'

import { useMemo } from 'react'
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
}

export function MaterialChart({ materials }: MaterialChartProps) {
  // For now, we'll show chart for the first material
  // In the future, this could be enhanced to show selected material
  const selectedMaterial = materials[0]

  const chartData = useMemo(() => {
    if (
      !selectedMaterial ||
      !selectedMaterial.schedules ||
      !selectedMaterial.tanggalMulai ||
      !selectedMaterial.tanggalSelesai
    )
      return []

    // Generate date range for the project duration
    const start = new Date(selectedMaterial.tanggalMulai)
    const end = new Date(selectedMaterial.tanggalSelesai)
    const dates = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    let cumulativeRencana = 0
    let cumulativeRealisasi = 0

    return dates.map((date, index) => {
      const dateStr = date.toISOString().split('T')[0]
      const schedule = selectedMaterial.schedules?.find(
        (s: any) => s.tanggal && s.tanggal.toISOString().split('T')[0] === dateStr
      )

      if (schedule) {
        cumulativeRencana += schedule.rencana
        cumulativeRealisasi += schedule.realisasi
      }

      return {
        date: date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
        }),
        rencana: Math.round(cumulativeRencana),
        realisasi: Math.round(cumulativeRealisasi),
      }
    })
  }, [selectedMaterial])

  if (!selectedMaterial) {
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
            Kurva-S: {selectedMaterial.jenisMaterial}
          </CardTitle>
          <div className="text-sm text-gray-500">
            Target: {selectedMaterial.volumeTarget.toLocaleString('id-ID')}{' '}
            {selectedMaterial.volumeSatuan === 'm3' ? 'm³' : selectedMaterial.volumeSatuan}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex items-center justify-end gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-400" />
            <span className="text-sm font-medium text-gray-500">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FFC928]" />
            <span className="text-sm font-medium text-gray-500">Realisasi</span>
          </div>
        </div>

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
                value: `Volume (${selectedMaterial.volumeSatuan === 'm3' ? 'm³' : selectedMaterial.volumeSatuan})`,
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
                          {selectedMaterial.volumeSatuan === 'm3'
                            ? 'm³'
                            : selectedMaterial.volumeSatuan}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              dataKey="rencana"
              type="monotone"
              stroke="#60A5FA"
              strokeWidth={3}
              dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2 }}
              name="Rencana"
            />
            <Line
              dataKey="realisasi"
              type="monotone"
              stroke="#FFC928"
              strokeWidth={3}
              dot={{ fill: '#FFC928', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#FFC928', strokeWidth: 2 }}
              name="Realisasi"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Target Volume</div>
            <div className="text-sm font-medium">
              {selectedMaterial.volumeTarget.toLocaleString('id-ID')}{' '}
              {selectedMaterial.volumeSatuan === 'm3' ? 'm³' : selectedMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total Rencana</div>
            <div className="text-sm font-medium text-blue-600">
              {chartData.length > 0
                ? chartData[chartData.length - 1]?.rencana?.toLocaleString('id-ID') || 0
                : 0}{' '}
              {selectedMaterial.volumeSatuan === 'm3' ? 'm³' : selectedMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total Realisasi</div>
            <div className="text-sm font-medium text-yellow-600">
              {chartData.length > 0
                ? chartData[chartData.length - 1]?.realisasi?.toLocaleString('id-ID') || 0
                : 0}{' '}
              {selectedMaterial.volumeSatuan === 'm3' ? 'm³' : selectedMaterial.volumeSatuan}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Persentase</div>
            <div className="text-sm font-medium">
              {selectedMaterial.volumeTarget > 0 && chartData.length > 0
                ? (
                    ((chartData[chartData.length - 1]?.realisasi || 0) /
                      selectedMaterial.volumeTarget) *
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

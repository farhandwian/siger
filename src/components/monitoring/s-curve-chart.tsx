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
import { useSCurveData } from '@/hooks/useSCurveData'

interface SCurveChartProps {
  projectId?: string
}

export function SCurveChart({ projectId = '1' }: SCurveChartProps) {
  const { data: sCurveData, isLoading, isEmpty } = useSCurveData(projectId)

  const chartData = useMemo(() => {
    if (!sCurveData || sCurveData.length === 0) return []

    // Add a timestamp for debugging real-time updates
    console.log('S-Curve data updated at:', new Date().toLocaleTimeString(), sCurveData)

    return sCurveData.map(dataPoint => ({
      week: dataPoint.weekLabel,
      weekNumber: dataPoint.weekNumber,
      rencana: Math.round(dataPoint.rencana * 100) / 100, // Round to 2 decimal places
      realisasi: Math.round(dataPoint.realisasi * 100) / 100,
      deviation: Math.round(dataPoint.deviation * 100) / 100,
    }))
  }, [sCurveData])

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100
    const maxRencana = Math.max(...chartData.map(d => d.rencana))
    const maxRealisasi = Math.max(...chartData.map(d => d.realisasi))
    const max = Math.max(maxRencana, maxRealisasi)
    // Add 10% padding and round up to next 10
    return Math.ceil((max * 1.1) / 10) * 10
  }, [chartData])

  const chartConfig = useMemo(() => {
    return {
      rencana: {
        label: 'Rencana',
        color: '#BFDBFE',
      },
      realisasi: {
        label: 'Realisasi',
        color: '#FFC928',
      },
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="border border-gray-200 bg-transparent">
        <CardHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
              <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    )
  }

  if (isEmpty) {
    return (
      <Card className="border border-gray-200 bg-transparent">
        <CardHeader className="space-y-0">
          <CardTitle className="text-lg">Kurva-S</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center rounded border border-gray-200 bg-gray-50">
            <p className="text-gray-500">Belum ada data jadwal untuk ditampilkan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 bg-transparent">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-700">Kurva-S (Kumulatif Progress)</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">Data: {chartData.length} minggu</div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex items-center justify-end gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#BFDBFE' }} />
            <span className="text-sm font-medium text-gray-500">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FFC928' }} />
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
              dataKey="week"
              tickLine={true}
              axisLine={true}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={value => value.replace('Minggu ', '')}
              label={{
                value: 'Minggu Ke-',
                position: 'insideBottom',
                offset: -10,
                style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' },
              }}
            />
            <YAxis
              tickLine={true}
              axisLine={true}
              tickCount={6}
              domain={[0, maxValue]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={value => `${value}%`}
              label={{
                value: 'Progress (%)',
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
                  const dataPoint = chartData.find(d => d.week === label)
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <p className="font-medium text-gray-900">{label}</p>
                      {payload.map(entry => (
                        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {entry.value}%
                        </p>
                      ))}
                      {dataPoint && (
                        <p className="mt-2 border-t pt-2 text-sm text-gray-600">
                          Deviasi: {dataPoint.deviation > 0 ? '+' : ''}
                          {dataPoint.deviation}%
                        </p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              dataKey="rencana"
              type="monotone"
              stroke="#BFDBFE"
              strokeWidth={3}
              dot={{ fill: '#BFDBFE', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#BFDBFE', strokeWidth: 2 }}
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
      </CardContent>
    </Card>
  )
}

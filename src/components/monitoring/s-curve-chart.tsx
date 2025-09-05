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
import { useMonitoringData } from '@/hooks/use-monitoring-data'

export function SCurveChart() {
  const { sCurve } = useMonitoringData()

  const chartData = useMemo(() => {
    if (!sCurve.data) return []

    // Add a timestamp for debugging real-time updates
    console.log('S-Curve data updated at:', new Date().toLocaleTimeString(), sCurve.data)

    return sCurve.data.weeks.map((week, index) => ({
      week: `Minggu ${week}`,
      rencana: Math.round(sCurve.data.planned[index] || 0),
      realisasi: Math.round(sCurve.data.actual[index] || 0),
    }))
  }, [sCurve.data])

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

  if (sCurve.isLoading) {
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

  if (sCurve.isError) {
    return (
      <Card className="border border-gray-200 bg-transparent">
        <CardHeader className="space-y-0">
          <CardTitle className="text-lg">Kurva-S</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center rounded border border-red-200 bg-red-50">
            <p className="text-red-700">Error loading chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 bg-transparent">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-700">Kurva-S</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Update: {new Date().toLocaleTimeString('id-ID')}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Live</span>
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
              label={{ value: 'Minggu Ke-', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' } }}
            />
            <YAxis
              tickLine={true}
              axisLine={true}
              tickCount={6}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={value => `${value}%`}
              label={{ 
                value: 'Progress (%)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '14px', fontWeight: '500' },
                offset: 10
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <p className="font-medium text-gray-900">{label}</p>
                      {payload.map(entry => (
                        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {entry.value}%
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

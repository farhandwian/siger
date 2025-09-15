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
import { useExecutionSummary } from '@/hooks/useExecutionSummary'
import { useSCurveData } from '@/hooks/useSCurveData'

interface PelaksanaanProgressChartProps {
  projectId?: string
  className?: string
}

/**
 * Progress chart component for pelaksanaan section
 * Shows project execution progress with real data from database
 * Matches Figma design with responsive heights and shadcn card styling
 */
export function PelaksanaanProgressChart({
  projectId = '1',
  className = '',
}: PelaksanaanProgressChartProps) {
  // Use S-curve data hook for progress tracking
  const {
    data: sCurveData,
    isLoading: isChartLoading,
    isEmpty: isChartEmpty,
  } = useSCurveData(projectId)

  // Get execution summary for additional context
  const { data: summaryData, isLoading: isSummaryLoading } = useExecutionSummary()

  const chartData = useMemo(() => {
    if (!sCurveData || sCurveData.length === 0) return []

    // Transform S-curve data for pelaksanaan progress display
    return sCurveData.map(dataPoint => ({
      week: dataPoint.weekLabel,
      weekNumber: dataPoint.weekNumber,
      planned: Math.round(dataPoint.rencana * 100) / 100,
      actual: Math.round(dataPoint.realisasi * 100) / 100,
      deviation: Math.round(dataPoint.deviation * 100) / 100,
    }))
  }, [sCurveData])

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100
    const maxPlanned = Math.max(...chartData.map(d => d.planned))
    const maxActual = Math.max(...chartData.map(d => d.actual))
    const max = Math.max(maxPlanned, maxActual)
    // Add 10% padding and round up to next 10
    return Math.ceil((max * 1.1) / 10) * 10
  }, [chartData])

  const isLoading = isChartLoading || isSummaryLoading

  if (isLoading) {
    return (
      <Card className={`rounded-2xl ${className}`}>
        <CardHeader className="pb-2">
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 animate-pulse rounded-xl bg-gray-100 sm:h-72 lg:h-80 xl:h-96" />
        </CardContent>
      </Card>
    )
  }

  if (isChartEmpty) {
    return (
      <Card className={`rounded-2xl ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Progress Pekerjaan</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 sm:h-72 lg:h-80 xl:h-96">
            <p className="text-sm text-gray-500">Belum ada data progress untuk ditampilkan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-gray-700 sm:text-lg">Progress Pekerjaan</CardTitle>
          <div className="flex items-center gap-4">
            <div className="hidden text-xs text-gray-400 sm:block">
              {chartData.length} minggu data
            </div>
            {summaryData && (
              <div className="hidden text-xs text-gray-500 lg:block">
                Rata-rata: {summaryData.averageProgress}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Legend - responsive design */}
        <div className="mb-4 flex items-center justify-end gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-300" />
            <span className="text-xs font-medium text-gray-500 sm:text-sm">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-500 sm:text-sm">Realisasi</span>
          </div>
        </div>

        {/* Chart with responsive heights matching Figma design */}
        <div className="h-64 sm:h-72 lg:h-80 xl:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                left: 20,
                right: 16,
                top: 8,
                bottom: 8,
              }}
            >
              <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
              <XAxis
                dataKey="week"
                tickLine={true}
                axisLine={true}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={value => value.replace('Minggu ', 'W')}
              />
              <YAxis
                tickLine={true}
                axisLine={true}
                tickCount={6}
                domain={[0, maxValue]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={value => `${value}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = chartData.find(d => d.week === label)
                    return (
                      <div className="rounded-xl border bg-white p-3 shadow-lg">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        {payload.map(entry => (
                          <p key={entry.dataKey} className="text-sm text-gray-700">
                            {entry.name}: {entry.value}%
                          </p>
                        ))}
                        {dataPoint && (
                          <p className="mt-2 border-t pt-2 text-xs text-gray-600">
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
                dataKey="planned"
                type="monotone"
                stroke="#93C5FD"
                strokeWidth={2}
                dot={false}
                name="Rencana"
              />
              <Line
                dataKey="actual"
                type="monotone"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Realisasi"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

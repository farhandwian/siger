'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

interface ProgressDataPoint {
  month: string
  target: number
  actual: number
}

interface ProgressChartProps {
  className?: string
  isLoading?: boolean
  error?: string | null
}

/**
 * Progress Chart Component (Kurva-S)
 * Displays S-curve chart showing target vs actual project progress over time
 * Uses Recharts for responsive visualization
 */
export function ProgressChart({ className, isLoading = false, error = null }: ProgressChartProps) {
  // Demo progress data - in real app this would come from API
  const progressData: ProgressDataPoint[] = [
    { month: 'Jan 2024', target: 5, actual: 3 },
    { month: 'Feb 2024', target: 12, actual: 8 },
    { month: 'Mar 2024', target: 22, actual: 18 },
    { month: 'Apr 2024', target: 35, actual: 28 },
    { month: 'May 2024', target: 48, actual: 42 },
    { month: 'Jun 2024', target: 58, actual: 55 },
    { month: 'Jul 2024', target: 68, actual: 65 },
    { month: 'Aug 2024', target: 76, actual: 72 },
    { month: 'Sep 2024', target: 82, actual: 78 },
    { month: 'Oct 2024', target: 88, actual: 85 },
    { month: 'Nov 2024', target: 94, actual: 90 },
    { month: 'Dec 2024', target: 100, actual: 96 },
  ]

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" data-color={entry.color}>
              <span className={entry.color === '#3b82f6' ? 'text-blue-500' : 'text-emerald-500'}>
                {entry.name}: {entry.value}%
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className={`rounded-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-base sm:text-lg">Progress Pekerjaan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl sm:h-72 lg:h-80 xl:h-96" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`rounded-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-base sm:text-lg">Progress Pekerjaan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Unable to load chart</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-base sm:text-lg">Progress Pekerjaan</span>
          </CardTitle>
          <p className="text-sm text-gray-600">Kurva-S progress keseluruhan proyek</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600">Realisasi</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-64 sm:h-72 lg:h-80 xl:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                domain={[0, 100]}
                label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Target line */}
              <Line
                type="monotone"
                dataKey="target"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Rencana"
                connectNulls={true}
              />

              {/* Actual line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Realisasi"
                connectNulls={true}
              />

              {/* 100% reference line */}
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Periode (Bulan)</p>
        </div>
      </CardContent>
    </Card>
  )
}

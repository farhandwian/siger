'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCalculatedData } from '@/hooks/useCalculatedData'
import { useProject } from '@/hooks/useActivityQueries'

interface SCurveChartProps {
  projectId: string
  isActionPlanTable?: boolean
}

export function SCurveChart({ projectId, isActionPlanTable = false }: SCurveChartProps) {
  const { getCalculatedValueForWeek, isLoading } = useCalculatedData(projectId)
  const { data: project } = useProject(projectId)

  // Prepare chart data based on the table type
  const chartData = useMemo(() => {
    if (!project) return []

    const maxWeeks = project.numberOfWeeks || 20
    const data = []

    // Calculate current week based on contract start date
    const currentDate = new Date()
    const contractStart = project.tanggalKontrak ? new Date(project.tanggalKontrak) : new Date()
    const weeksPassed = Math.max(
      0,
      Math.floor((currentDate.getTime() - contractStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    )
    const currentWeek = Math.min(weeksPassed + 1, maxWeeks) // +1 because week 1 starts immediately

    for (let week = 1; week <= maxWeeks; week++) {
      if (isActionPlanTable) {
        // For Action Plan tab: show Action Plan vs Realization
        data.push({
          week,
          'Action Plan': getCalculatedValueForWeek(week, 'cumulative-action-plan'),
          'Realization': week <= currentWeek ? getCalculatedValueForWeek(week, 'cumulative-realization') : null,
        })
      } else {
        // For Schedule tab: show Plan vs Realization
        data.push({
          week,
          'Plan': getCalculatedValueForWeek(week, 'cumulative-plan'),
          'Realization': week <= currentWeek ? getCalculatedValueForWeek(week, 'cumulative-realization') : null,
        })
      }
    }

    return data
  }, [project, getCalculatedValueForWeek, isActionPlanTable])

  // Calculate current week for reference line
  const currentWeek = useMemo(() => {
    if (!project) return 0

    const currentDate = new Date()
    const contractStart = project.tanggalKontrak ? new Date(project.tanggalKontrak) : new Date()
    const weeksPassed = Math.max(
      0,
      Math.floor((currentDate.getTime() - contractStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    )
    const maxWeeks = project.numberOfWeeks || 20
    return Math.min(weeksPassed + 1, maxWeeks) // +1 because week 1 starts immediately
  }, [project])

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            S-Curve Chart
            {isActionPlanTable && ' (Action Plan)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 sm:h-72 lg:h-80 xl:h-96">
            <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show message if no data available
  if (!project || chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            S-Curve Chart
            {isActionPlanTable && ' (Action Plan)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center space-y-2">
              <p>No data available for S-curve chart</p>
              <p className="text-sm text-gray-400">
                {projectId ? `Project ID: ${projectId}` : 'No project selected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base lg:text-lg">
            S-Curve Chart
            {isActionPlanTable && ' (Action Plan)'}
          </CardTitle>
          
          {/* Custom Legend */}
          <div className="ml-auto flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-1 lg:gap-2">
              <div className="h-2 w-2 rounded-full bg-[#BFDBFE] lg:h-2.5 lg:w-2.5" />
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                {isActionPlanTable ? 'Action Plan' : 'Rencana'}
              </span>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FFC928] lg:h-2.5 lg:w-2.5" />
              <span className="text-[9px] text-gray-500 lg:text-[10px] xl:text-xs">
                Realisasi
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <div className="h-64 sm:h-72 lg:h-80 xl:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                label={{ value: 'Week', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(label) => `Week ${label}`}
                formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              />
              
              {/* Current week reference line */}
              <ReferenceLine 
                x={currentWeek} 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{ 
                  value: "Minggu ini", 
                  position: "top",
                  style: { fontSize: '10px', fill: '#ef4444' }
                }}
              />
              
              {isActionPlanTable ? (
                <>
                  {/* Action Plan vs Realization for Action Plan tab */}
                  <Line
                    type="monotone"
                    dataKey="Action Plan"
                    stroke="#BFDBFE"
                    strokeWidth={2}
                    dot={{ fill: '#BFDBFE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Realization"
                    stroke="#FFC928"
                    strokeWidth={2}
                    dot={{ fill: '#FFC928', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  {/* Plan vs Realization for Schedule tab */}
                  <Line
                    type="monotone"
                    dataKey="Plan"
                    stroke="#BFDBFE"
                    strokeWidth={2}
                    dot={{ fill: '#BFDBFE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Realization"
                    stroke="#FFC928"
                    strokeWidth={2}
                    dot={{ fill: '#FFC928', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Default export for backward compatibility
export default SCurveChart

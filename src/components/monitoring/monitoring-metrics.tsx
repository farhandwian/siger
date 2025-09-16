'use client'

import { Card } from '@/components/ui/card'
import { useCalculatedData } from '@/hooks/useCalculatedData'
import { useProject } from '@/hooks/useActivityQueries'
import { TrendingUp, AlertTriangle, Calendar } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  subtitle,
  showProgress = false,
  current,
  total,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  subtitle?: string
  showProgress?: boolean
  current?: number
  total?: number
  icon?: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <Card className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{title}</div>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div className="text-xl font-semibold text-gray-700">{value}</div>
        {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
      </div>

      {/* Progress Bar */}
      {showProgress && current && total && (
        <div className="h-2 w-full rounded bg-blue-200">
          <div
            className="h-2 rounded bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min((current / total) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Trend indicator */}
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
          <span>Real-time update</span>
        </div>
      )}
    </div>

    {/* Left border indicator */}
    <div className="absolute left-0 top-1/2 h-20 w-1.5 -translate-y-1/2 rounded-r bg-blue-900" />
  </Card>
)

export function MonitoringMetrics({ 
  projectId = '1', 
  isActionPlanTable = false 
}: { 
  projectId?: string
  isActionPlanTable?: boolean 
}) {
  const { getCalculatedValueForWeek, isLoading } = useCalculatedData(projectId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  const loading = isLoading || projectLoading

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    )
  }

  if (!project) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="col-span-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
          Belum ada data jadwal untuk menampilkan metrik
        </div>
      </div>
    )
  }

  const totalWeeks = project.numberOfWeeks || 20
  
  // Use the last week (most recent completed week)
  const lastWeek = totalWeeks
  
  // Get cumulative realization for current progress
  const currentProgress = getCalculatedValueForWeek(lastWeek, 'cumulative-realization')
  
  // Get final week cumulative plan as total target
  const totalTarget = getCalculatedValueForWeek(totalWeeks, 'cumulative-plan')
  
  // Get deviation based on table type (plan vs action plan)
  const deviation = getCalculatedValueForWeek(
    lastWeek, 
    isActionPlanTable ? 'deviation-action-plan' : 'deviation-plan'
  )
  
  // Calculate schedule progress
  const scheduleProgress = totalWeeks > 0 ? (lastWeek / totalWeeks) * 100 : 0
  
  const progressPercentage = totalTarget > 0 ? ((currentProgress / totalTarget) * 100).toFixed(1) : '0.0'

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Cumulative Progress Card */}
      <MetricCard
        title="Progress Kumulatif Aktual"
        value={`${currentProgress.toFixed(1)}%`}
        subtitle={`Target: ${totalTarget.toFixed(1)}% (${progressPercentage}%)`}
        showProgress={true}
        current={currentProgress}
        total={totalTarget}
        icon={TrendingUp}
        trend="up"
      />

      {/* Cumulative Deviation Card */}
      <MetricCard
        title="Deviasi Kumulatif"
        value={`${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`}
        subtitle="Rencana vs Realisasi"
        icon={AlertTriangle}
        trend={deviation > 0 ? 'up' : deviation < 0 ? 'down' : 'neutral'}
      />

      {/* Schedule Progress Card */}
      <MetricCard
        title="Progres Waktu Kontrak"
        value={`${scheduleProgress.toFixed(1)}%`}
        subtitle={`Minggu ${lastWeek} dari ${totalWeeks}`}
        showProgress={true}
        current={lastWeek}
        total={totalWeeks}
        icon={Calendar}
        trend="neutral"
      />
    </div>
  )
}

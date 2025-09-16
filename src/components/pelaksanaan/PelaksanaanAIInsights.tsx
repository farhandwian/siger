'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExecutionSummary } from '@/hooks/useExecutionSummary'
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react'
import { useMemo } from 'react'

interface PelaksanaanInsight {
  id: string
  type: 'progress' | 'contract' | 'deviation' | 'milestone'
  title: string
  description: string
  value?: string
  color: 'green' | 'blue' | 'red' | 'yellow'
}

const InsightCard = ({ insight }: { insight: PelaksanaanInsight }) => {
  const colorClasses = {
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      title: 'text-emerald-700',
      text: 'text-emerald-600',
      indicator: 'bg-emerald-500',
      icon: TrendingUp,
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      title: 'text-blue-700',
      text: 'text-blue-600',
      indicator: 'bg-blue-500',
      icon: Target,
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      title: 'text-red-700',
      text: 'text-red-600',
      indicator: 'bg-red-500',
      icon: AlertTriangle,
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      title: 'text-yellow-700',
      text: 'text-yellow-600',
      indicator: 'bg-yellow-500',
      icon: Calendar,
    },
  }

  const colors = colorClasses[insight.color]
  const IconComponent = colors.icon

  return (
    <Card
      className={`relative p-3 ${colors.bg} ${colors.border} rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={`text-sm font-medium ${colors.title} leading-tight`}>{insight.title}</div>
          <IconComponent className={`h-4 w-4 ${colors.title} flex-shrink-0`} />
        </div>

        {insight.value && (
          <div className={`text-lg font-semibold ${colors.title}`}>{insight.value}</div>
        )}

        <div className={`text-xs leading-relaxed ${colors.text}`}>{insight.description}</div>
      </div>

      {/* Left border indicator */}
      <div
        className={`absolute left-0 top-1/2 h-16 w-1.5 -translate-y-1/2 ${colors.indicator} rounded-r`}
      />
    </Card>
  )
}

interface PelaksanaanAIInsightsProps {
  className?: string
}

/**
 * AI Insights component for pelaksanaan section
 * Analyzes execution data and provides real-time insights
 * Matches Figma design with rounded cards and proper spacing
 */
export function PelaksanaanAIInsights({ className = '' }: PelaksanaanAIInsightsProps) {
  const { data: executionData, isLoading, isError, refetch } = useExecutionSummary()

  // Generate insights based on real execution data
  const insights = useMemo((): PelaksanaanInsight[] => {
    if (!executionData) return []

    const generatedInsights: PelaksanaanInsight[] = []

    // Progress insight
    if (executionData.averageProgress > 0) {
      if (executionData.averageProgress >= 80) {
        generatedInsights.push({
          id: 'progress-good',
          type: 'progress',
          title: 'Progress Sangat Baik',
          description: 'Mayoritas proyek menunjukkan kemajuan yang sangat baik dan sesuai target.',
          value: `${executionData.averageProgress}%`,
          color: 'green',
        })
      } else if (executionData.averageProgress >= 60) {
        generatedInsights.push({
          id: 'progress-moderate',
          type: 'progress',
          title: 'Progress Dalam Target',
          description:
            'Progress proyek berjalan sesuai rencana dengan beberapa area yang perlu perhatian.',
          value: `${executionData.averageProgress}%`,
          color: 'blue',
        })
      } else {
        generatedInsights.push({
          id: 'progress-low',
          type: 'progress',
          title: 'Progress Perlu Ditingkatkan',
          description: 'Beberapa proyek mengalami keterlambatan dan membutuhkan akselerasi.',
          value: `${executionData.averageProgress}%`,
          color: 'yellow',
        })
      }
    }

    // Contract value insight
    generatedInsights.push({
      id: 'contract-value',
      type: 'contract',
      title: 'Total Nilai Kontrak',
      description: `Mengelola ${executionData.totalProjects} proyek dengan nilai kontrak total yang signifikan.`,
      value: executionData.totalContract,
      color: 'blue',
    })

    // Deviation insight
    if (executionData.averageDeviation !== 0) {
      if (Math.abs(executionData.averageDeviation) <= 5) {
        generatedInsights.push({
          id: 'deviation-minimal',
          type: 'deviation',
          title: 'Deviasi Minimal',
          description: 'Deviasi rata-rata proyek masih dalam batas toleransi yang dapat diterima.',
          value: `${executionData.averageDeviation > 0 ? '+' : ''}${executionData.averageDeviation}%`,
          color: 'green',
        })
      } else if (executionData.averageDeviation > 5) {
        generatedInsights.push({
          id: 'deviation-ahead',
          type: 'deviation',
          title: 'Proyek Lebih Cepat',
          description:
            'Beberapa proyek menunjukkan progress lebih cepat dari jadwal yang direncanakan.',
          value: `+${executionData.averageDeviation}%`,
          color: 'green',
        })
      } else {
        generatedInsights.push({
          id: 'deviation-behind',
          type: 'deviation',
          title: 'Perlu Akselerasi',
          description: 'Terdapat keterlambatan rata-rata yang memerlukan tindakan korektif segera.',
          value: `${executionData.averageDeviation}%`,
          color: 'red',
        })
      }
    }

    // Project count insight
    if (executionData.totalProjects > 0) {
      generatedInsights.push({
        id: 'project-management',
        type: 'milestone',
        title: 'Manajemen Proyek',
        description: `Sedang mengelola ${executionData.totalProjects} proyek aktif dengan sistem monitoring terintegrasi.`,
        color: 'blue',
      })
    }

    return generatedInsights.slice(0, 4) // Limit to 4 insights for better UI
  }, [executionData])

  if (isLoading) {
    return (
      <Card className={`h-full rounded-2xl border border-gray-200 ${className}`}>
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className={`h-full rounded-2xl border border-gray-200 ${className}`}>
        <div className="flex h-full flex-col items-center justify-center p-4">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-center text-sm text-red-700">Error loading insights</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`h-full overflow-y-auto rounded-2xl border border-gray-200 transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-purple-100 p-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-700">AI Insights</h3>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Real-time analysis</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-purple-500 text-purple-500 hover:bg-purple-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Insights List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>

          {insights.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <Sparkles className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-center text-sm">No insights available</p>
              <p className="mt-1 text-center text-xs">AI analysis will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

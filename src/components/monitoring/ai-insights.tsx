'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMonitoringData } from '@/hooks/use-monitoring-data'
import { Sparkles, RefreshCw, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface AIInsight {
  id: string
  type: 'milestone' | 'acceleration' | 'delay'
  title: string
  project: string
  timeAgo: string
  description: string
  color: 'green' | 'blue' | 'red'
}

const InsightCard = ({ insight }: { insight: AIInsight }) => {
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
      icon: TrendingUp,
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      title: 'text-red-700',
      text: 'text-red-600',
      indicator: 'bg-red-500',
      icon: AlertTriangle,
    },
  }

  const colors = colorClasses[insight.color]
  const IconComponent = colors.icon

  return (
    <Card
      className={`relative p-3 ${colors.bg} ${colors.border} rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className={`text-sm font-medium ${colors.title}`}>{insight.title}</div>
            <IconComponent className={`h-4 w-4 ${colors.title} flex-shrink-0`} />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <span className="truncate">{insight.project}</span>
            </div>
            {/* <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{insight.timeAgo}</span>
            </div> */}
          </div>
        </div>

        <div className={`text-xs leading-relaxed ${colors.text}`}>{insight.description}</div>
      </div>

      {/* Left border indicator */}
      <div
        className={`absolute left-0 top-1/2 h-20 w-1.5 -translate-y-1/2 ${colors.indicator} rounded-r`}
      />
    </Card>
  )
}

export function AIInsights() {
  const { aiInsights, refreshAll } = useMonitoringData()

  if (aiInsights.isLoading) {
    return (
      <Card className="h-full rounded-2xl border border-gray-200">
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (aiInsights.isError) {
    return (
      <Card className="h-full rounded-2xl border border-gray-200">
        <div className="flex h-full flex-col items-center justify-center p-4">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-center text-red-700">Error loading AI insights</p>
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-y-auto rounded-2xl border border-gray-200 transition-shadow hover:shadow-md">
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
            onClick={refreshAll}
            disabled={aiInsights.isLoading}
            className="border-purple-500 text-purple-500 hover:bg-purple-50"
          >
            <RefreshCw className={`h-4 w-4 ${aiInsights.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Insights List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {aiInsights.data?.map(insight => <InsightCard key={insight.id} insight={insight} />) ||
              []}
          </div>

          {(!aiInsights.data || aiInsights.data.length === 0) && !aiInsights.isLoading && (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <Sparkles className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-center">No insights available</p>
              <p className="mt-1 text-center text-xs">AI analysis will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

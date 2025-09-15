// Example: Optimized S-Curve Component using the new API
'use client'

import React from 'react'
import { useOptimizedSCurveData } from '@/hooks/useOptimizedSCurveData'

interface OptimizedSCurveChartProps {
  projectId: string
}

export function OptimizedSCurveChart({ projectId }: OptimizedSCurveChartProps) {
  const { data, isLoading, error } = useOptimizedSCurveData(projectId)

  if (isLoading) {
    return <div>Loading S-curve data...</div>
  }

  if (error) {
    return <div>Error loading S-curve data: {error.message}</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">
          {data.projectInfo.name || 'Project S-Curve'}
        </h3>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Weeks:</span>
            <div className="font-medium">{data.summary.totalWeeks}</div>
          </div>
          <div>
            <span className="text-gray-500">Final Plan:</span>
            <div className="font-medium">{data.summary.finalPlan.toFixed(2)}%</div>
          </div>
          <div>
            <span className="text-gray-500">Final Actual:</span>
            <div className="font-medium">{data.summary.finalActual.toFixed(2)}%</div>
          </div>
          <div>
            <span className="text-gray-500">Deviation:</span>
            <div className={`font-medium ${data.summary.finalDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.finalDeviation > 0 ? '+' : ''}{data.summary.finalDeviation.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-medium mb-2">Weekly Progress</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.sCurveData.map((point) => (
            <div key={point.weekNumber} className="flex justify-between items-center py-1 border-b last:border-b-0">
              <span className="text-sm">{point.weekLabel}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-600">Plan: {point.rencana.toFixed(1)}%</span>
                <span className="text-green-600">Actual: {point.realisasi.toFixed(1)}%</span>
                <span className={`${point.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {point.deviation > 0 ? '+' : ''}{point.deviation.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Example: Bulk Update Schedule Plans
export function BulkScheduleUpdateExample({ projectId }: { projectId: string }) {
  const { data: schedulePlans } = useSchedulePlans({ projectId })
  const bulkMutation = useBulkSchedulePlans()

  const handleBulkUpdate = async () => {
    if (!schedulePlans) return

    // Example: Update multiple schedule plans at once
    const updates = schedulePlans.map(plan => ({
      subActivityId: plan.subActivityId,
      month: plan.month,
      year: plan.year,
      week: plan.week,
      percentage: (plan.percentage || 0) + 5 // Add 5% to each
    }))

    try {
      await bulkMutation.mutateAsync(updates)
      console.log('Bulk update successful!')
    } catch (error) {
      console.error('Bulk update failed:', error)
    }
  }

  return (
    <button 
      onClick={handleBulkUpdate}
      disabled={bulkMutation.isPending}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {bulkMutation.isPending ? 'Updating...' : 'Bulk Update (+5%)'}
    </button>
  )
}

// Import statement for use in other components
import { useSchedulePlans, useBulkSchedulePlans } from '@/hooks/useSchedulePlans'

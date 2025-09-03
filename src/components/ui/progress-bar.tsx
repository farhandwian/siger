import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  deviation: number
  target: number
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  deviation = 0,
  target = 100,
  className,
}) => {
  const progressPercentage = Math.min((progress / target) * 100, 100)
  const expectedProgress = Math.min(progressPercentage + deviation, 100)

  return (
    <div className={cn('relative h-3 w-full rounded-md bg-gray-100 lg:h-[18px]', className)}>
      {/* Expected progress bar (amber) - showing where we should be */}
      <div
        className="absolute left-0 top-0 h-full rounded-md bg-amber-500"
        style={{ width: `${expectedProgress}%` }}
      />
      {/* Actual progress bar (emerald) */}
      <div
        className="absolute left-0 top-0 z-10 h-full rounded-md bg-emerald-500"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  )
}

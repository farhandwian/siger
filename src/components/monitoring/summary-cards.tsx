'use client'

import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string
  variant?: 'default' | 'success'
  className?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  variant = 'default',
  className,
}) => {
  return (
    <Card
      className={cn(
        'relative border shadow-sm',
        variant === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white',
        className
      )}
    >
      <CardContent className="p-3 lg:p-4">
        <div className="space-y-1 lg:space-y-2">
          <div className="text-xs font-normal text-gray-700 lg:text-sm">{title}</div>
          <div className="text-lg font-bold text-gray-700 lg:text-xl">{value}</div>
        </div>
        {/* Left border accent */}
        <div
          className={cn(
            'absolute left-0 top-1/2 h-16 w-1.5 -translate-y-1/2 transform rounded-r lg:h-20',
            variant === 'success' ? 'bg-emerald-500' : 'bg-blue-900'
          )}
        />
      </CardContent>
    </Card>
  )
}

interface SummaryCardsProps {
  className?: string
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ className }) => {
  const summaryData = [
    { title: 'Performa Waktu', value: '95%' },
    { title: 'Efektifitas Pekerjaan', value: '95%' },
    { title: 'Quality Index', value: '85%' },
    { title: 'Nilai Keseluruhan', value: '90', variant: 'success' as const },
  ]

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4', className)}>
      {summaryData.map((item, index) => (
        <SummaryCard key={index} title={item.title} value={item.value} variant={item.variant} />
      ))}
    </div>
  )
}

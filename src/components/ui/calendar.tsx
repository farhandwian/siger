import * as React from 'react'
import { cn } from '@/lib/utils'

// Simple calendar component for date range selection
interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void
  numberOfMonths?: number
  className?: string
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Generate calendar days
  const days = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onSelect?.(date)
    } else if (mode === 'range') {
      const currentSelection = selected as { from?: Date; to?: Date } | undefined

      if (!currentSelection?.from || (currentSelection.from && currentSelection.to)) {
        // Start new range
        onSelect?.({ from: date, to: undefined })
      } else if (currentSelection.from && !currentSelection.to) {
        // Complete range
        if (date >= currentSelection.from) {
          onSelect?.({ from: currentSelection.from, to: date })
        } else {
          onSelect?.({ from: date, to: currentSelection.from })
        }
      }
    }
  }

  const isSelected = (date: Date) => {
    if (mode === 'single') {
      const selectedDate = selected as Date | undefined
      return (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      )
    } else {
      const range = selected as { from?: Date; to?: Date } | undefined
      if (!range?.from) return false

      if (range.to) {
        return date >= range.from && date <= range.to
      } else {
        return date.getTime() === range.from.getTime()
      }
    }
  }

  const isInRange = (date: Date) => {
    if (mode !== 'range') return false
    const range = selected as { from?: Date; to?: Date } | undefined
    return range?.from && range?.to && date > range.from && date < range.to
  }

  const isRangeStart = (date: Date) => {
    if (mode !== 'range') return false
    const range = selected as { from?: Date; to?: Date } | undefined
    return range?.from && date.getTime() === range.from.getTime()
  }

  const isRangeEnd = (date: Date) => {
    if (mode !== 'range') return false
    const range = selected as { from?: Date; to?: Date } | undefined
    return range?.to && date.getTime() === range.to.getTime()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  return (
    <div className={cn('rounded-lg border bg-white p-4 shadow-lg', className)}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigateMonth('prev')} className="rounded p-1 hover:bg-gray-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-sm font-semibold">
          {monthNames[month]} {year}
        </h2>

        <button onClick={() => navigateMonth('next')} className="rounded p-1 hover:bg-gray-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => handleDateClick(date)}
                className={cn(
                  'h-full w-full rounded-md text-xs transition-colors hover:bg-blue-100',
                  isSelected(date) && 'bg-blue-500 text-white hover:bg-blue-600',
                  isInRange(date) && 'bg-blue-100',
                  isRangeStart(date) && 'bg-blue-500 text-white hover:bg-blue-600',
                  isRangeEnd(date) && 'bg-blue-500 text-white hover:bg-blue-600',
                  date.toDateString() === today.toDateString() && 'border border-blue-500'
                )}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

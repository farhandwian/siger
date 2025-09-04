import { format, parse, eachWeekOfInterval, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { id } from 'date-fns/locale'

export interface WeekRange {
  week: number
  range: string
  startDate: Date
  endDate: Date
}

export interface MonthData {
  month: number
  name: string
  weeks: WeekRange[]
}

/**
 * Generate month and week data based on contract dates
 */
export function generateMonthsFromContract(
  tanggalKontrak: string | null,
  akhirKontrak: string | null
): MonthData[] {
  if (!tanggalKontrak || !akhirKontrak) {
    // Fallback to default data if contract dates are not available
    return getDefaultMonths()
  }

  try {
    // Parse dates - assuming format "DD/MM/YYYY" or "DD-MM-YYYY"
    const startDate = parseDateString(tanggalKontrak)
    const endDate = parseDateString(akhirKontrak)

    if (!startDate || !endDate || startDate >= endDate) {
      return getDefaultMonths()
    }

    // Get all weeks in the interval
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 } // Monday as start of week
    )

    // Group weeks by month
    const monthsMap = new Map<string, WeekRange[]>()

    weeks.forEach((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const month = weekStart.getMonth() + 1 // 1-12
      const year = weekStart.getFullYear()
      const monthKey = `${year}-${month}`

      const weekData: WeekRange = {
        week: index + 1,
        range: `${format(weekStart, 'dd')} - ${format(weekEnd, 'dd')}`,
        startDate: weekStart,
        endDate: weekEnd,
      }

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, [])
      }
      monthsMap.get(monthKey)!.push(weekData)
    })

    // Convert to array and sort
    const months: MonthData[] = []
    const sortedMonthKeys = Array.from(monthsMap.keys()).sort()

    sortedMonthKeys.forEach(monthKey => {
      const [year, month] = monthKey.split('-').map(Number)
      const monthWeeks = monthsMap.get(monthKey)!

      // Renumber weeks within each month
      monthWeeks.forEach((week, index) => {
        week.week = index + 1
      })

      months.push({
        month,
        name: getMonthName(month),
        weeks: monthWeeks,
      })
    })

    return months.length > 0 ? months : getDefaultMonths()
  } catch (error) {
    console.error('Error parsing contract dates:', error)
    return getDefaultMonths()
  }
}

/**
 * Parse date string in various formats
 */
function parseDateString(dateStr: string): Date | null {
  const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']

  for (const formatStr of formats) {
    try {
      const parsed = parse(dateStr, formatStr, new Date())
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    } catch (error) {
      // Continue to next format
    }
  }

  return null
}

/**
 * Get month name in Indonesian
 */
function getMonthName(month: number): string {
  const monthNames = [
    'JANUARI',
    'FEBRUARI',
    'MARET',
    'APRIL',
    'MEI',
    'JUNI',
    'JULI',
    'AGUSTUS',
    'SEPTEMBER',
    'OKTOBER',
    'NOVEMBER',
    'DESEMBER',
  ]
  return monthNames[month - 1] || 'UNKNOWN'
}

/**
 * Default months data (fallback)
 */
function getDefaultMonths(): MonthData[] {
  return [
    {
      month: 5,
      name: 'MEI',
      weeks: [
        {
          week: 1,
          range: '23 - 25',
          startDate: new Date(2024, 4, 23),
          endDate: new Date(2024, 4, 25),
        },
        {
          week: 2,
          range: '26 - 01',
          startDate: new Date(2024, 4, 26),
          endDate: new Date(2024, 5, 1),
        },
      ],
    },
    {
      month: 6,
      name: 'JUNI',
      weeks: [
        {
          week: 1,
          range: '02 - 08',
          startDate: new Date(2024, 5, 2),
          endDate: new Date(2024, 5, 8),
        },
        {
          week: 2,
          range: '09 - 15',
          startDate: new Date(2024, 5, 9),
          endDate: new Date(2024, 5, 15),
        },
        {
          week: 3,
          range: '16 - 22',
          startDate: new Date(2024, 5, 16),
          endDate: new Date(2024, 5, 22),
        },
        {
          week: 4,
          range: '23 - 29',
          startDate: new Date(2024, 5, 23),
          endDate: new Date(2024, 5, 29),
        },
      ],
    },
    {
      month: 7,
      name: 'JULI',
      weeks: [
        {
          week: 1,
          range: '30 - 06',
          startDate: new Date(2024, 5, 30),
          endDate: new Date(2024, 6, 6),
        },
        {
          week: 2,
          range: '07 - 13',
          startDate: new Date(2024, 6, 7),
          endDate: new Date(2024, 6, 13),
        },
        {
          week: 3,
          range: '14 - 20',
          startDate: new Date(2024, 6, 14),
          endDate: new Date(2024, 6, 20),
        },
        {
          week: 4,
          range: '21 - 27',
          startDate: new Date(2024, 6, 21),
          endDate: new Date(2024, 6, 27),
        },
      ],
    },
  ]
}

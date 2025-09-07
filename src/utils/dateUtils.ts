import { format, parse, addDays, startOfMonth, endOfMonth, getDay } from 'date-fns'
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
 * Convert date string to HTML date input format (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return ''

  const date = parseDateString(dateStr)
  if (!date) return dateStr

  return format(date, 'yyyy-MM-dd')
}

/**
 * Convert HTML date input format to display format
 */
export function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return ''

  const date = parseDateString(dateStr)
  if (!date) return dateStr

  return format(date, 'dd/MM/yyyy')
}

/**
 * Generate month and week data based on contract dates
 * Uses Monday-Sunday week rules with Thursday ownership for cross-month weeks
 */
export function generateMonthsFromContract(
  tanggalKontrak: string | null,
  akhirKontrak: string | null
): MonthData[] {
  if (!tanggalKontrak || !akhirKontrak) {
    return getDefaultMonths()
  }

  try {
    const startDate = parseDateString(tanggalKontrak)
    const endDate = parseDateString(akhirKontrak)

    if (!startDate || !endDate || startDate >= endDate) {
      return getDefaultMonths()
    }

    const year = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1
    const endMonth = endDate.getMonth() + 1
    const endYear = endDate.getFullYear()

    const months: MonthData[] = []

    // Generate full month structure first
    let currentMonth = startMonth
    let currentYear = year

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthWeeks = generateWeeksForMonth(currentMonth, currentYear)

      months.push({
        month: currentMonth,
        name: getMonthName(currentMonth),
        weeks: monthWeeks,
      })

      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    // Trim first and last months based on contract dates
    if (months.length > 0) {
      // Trim first month
      const firstMonth = months[0]
      firstMonth.weeks = firstMonth.weeks.filter(week => {
        return week.endDate >= startDate
      })

      // Adjust first week start date if needed
      if (firstMonth.weeks.length > 0) {
        const firstWeek = firstMonth.weeks[0]
        if (firstWeek.startDate < startDate) {
          firstWeek.startDate = startDate
          firstWeek.range = `${format(startDate, 'dd')}–${format(firstWeek.endDate, 'dd')}`
        }
      }

      // Trim last month
      const lastMonth = months[months.length - 1]
      lastMonth.weeks = lastMonth.weeks.filter(week => {
        return week.startDate <= endDate
      })

      // Adjust last week end date if needed
      if (lastMonth.weeks.length > 0) {
        const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1]
        if (lastWeek.endDate > endDate) {
          lastWeek.endDate = endDate
          lastWeek.range = `${format(lastWeek.startDate, 'dd')}–${format(endDate, 'dd')}`
        }
      }

      // Remove empty months
      return months.filter(month => month.weeks.length > 0)
    }

    return getDefaultMonths()
  } catch (error) {
    console.error('Error parsing contract dates:', error)
    return getDefaultMonths()
  }
}

/**
 * Generate weeks for a specific month using Monday-Sunday rule
 * Thursday ownership rule for cross-month weeks
 */
function generateWeeksForMonth(month: number, year: number): WeekRange[] {
  const weeks: WeekRange[] = []

  // Get all potential Monday dates that could belong to this month
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month - 1 + 1, 0) // Last day of month

  // Start from the Monday of the week containing the 1st of the month
  let currentMonday = getMonday(firstDay)

  // Keep going until we've covered all possible weeks for this month
  let weekNumber = 1

  while (currentMonday <= lastDay) {
    const sunday = addDays(currentMonday, 6)
    const thursday = addDays(currentMonday, 3)

    // Check if Thursday belongs to this month (ownership rule)
    if (thursday.getMonth() === month - 1 && thursday.getFullYear() === year) {
      weeks.push({
        week: weekNumber,
        range: `${format(currentMonday, 'dd')}–${format(sunday, 'dd')}`,
        startDate: currentMonday,
        endDate: sunday,
      })
      weekNumber++
    }

    currentMonday = addDays(currentMonday, 7)
  }

  return weeks
}

/**
 * Get the Monday of the week containing the given date
 */
function getMonday(date: Date): Date {
  const day = getDay(date) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromMonday = day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6
  return addDays(date, -daysFromMonday)
}

/**
 * Parse date string in various formats
 */
function parseDateString(dateStr: string): Date | null {
  // Handle HTML date input format (YYYY-MM-DD) first
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00')
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Handle other formats
  const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'MM/dd/yyyy']

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
 * Default months data (fallback) - Updated for 2025 validation
 */
function getDefaultMonths(): MonthData[] {
  return [
    {
      month: 6,
      name: 'JUNI',
      weeks: [
        {
          week: 1,
          range: '02–08',
          startDate: new Date(2025, 5, 2),
          endDate: new Date(2025, 5, 8),
        },
        {
          week: 2,
          range: '09–15',
          startDate: new Date(2025, 5, 9),
          endDate: new Date(2025, 5, 15),
        },
        {
          week: 3,
          range: '16–22',
          startDate: new Date(2025, 5, 16),
          endDate: new Date(2025, 5, 22),
        },
        {
          week: 4,
          range: '23–29',
          startDate: new Date(2025, 5, 23),
          endDate: new Date(2025, 5, 29),
        },
      ],
    },
    {
      month: 7,
      name: 'JULI',
      weeks: [
        {
          week: 1,
          range: '30–06',
          startDate: new Date(2025, 5, 30),
          endDate: new Date(2025, 6, 6),
        },
        {
          week: 2,
          range: '07–13',
          startDate: new Date(2025, 6, 7),
          endDate: new Date(2025, 6, 13),
        },
        {
          week: 3,
          range: '14–20',
          startDate: new Date(2025, 6, 14),
          endDate: new Date(2025, 6, 20),
        },
        {
          week: 4,
          range: '21–27',
          startDate: new Date(2025, 6, 21),
          endDate: new Date(2025, 6, 27),
        },
        {
          week: 5,
          range: '28–03',
          startDate: new Date(2025, 6, 28),
          endDate: new Date(2025, 7, 3),
        },
      ],
    },
    {
      month: 8,
      name: 'AGUSTUS',
      weeks: [
        {
          week: 1,
          range: '04–10',
          startDate: new Date(2025, 7, 4),
          endDate: new Date(2025, 7, 10),
        },
        {
          week: 2,
          range: '11–17',
          startDate: new Date(2025, 7, 11),
          endDate: new Date(2025, 7, 17),
        },
        {
          week: 3,
          range: '18–24',
          startDate: new Date(2025, 7, 18),
          endDate: new Date(2025, 7, 24),
        },
        {
          week: 4,
          range: '25–31',
          startDate: new Date(2025, 7, 25),
          endDate: new Date(2025, 7, 31),
        },
      ],
    },
    {
      month: 9,
      name: 'SEPTEMBER',
      weeks: [
        {
          week: 1,
          range: '01–07',
          startDate: new Date(2025, 8, 1),
          endDate: new Date(2025, 8, 7),
        },
        {
          week: 2,
          range: '08–14',
          startDate: new Date(2025, 8, 8),
          endDate: new Date(2025, 8, 14),
        },
        {
          week: 3,
          range: '15–21',
          startDate: new Date(2025, 8, 15),
          endDate: new Date(2025, 8, 21),
        },
        {
          week: 4,
          range: '22–28',
          startDate: new Date(2025, 8, 22),
          endDate: new Date(2025, 8, 28),
        },
      ],
    },
  ]
}

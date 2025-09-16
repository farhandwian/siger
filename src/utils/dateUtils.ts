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
 * Extract actual week periods from scheduleplan data (not just date range)
 * This accounts for partial months and varying week counts per month
 */
export function getActualPeriodsFromSchedulePlanData(activities: any[]): MonthData[] | null {
  if (!activities || activities.length === 0) {
    return null
  }

  const periodMap = new Map<string, { month: number; year: number; week: number; count: number }>()

  // Collect all unique periods from scheduleplan data
  activities.forEach((activity, activityIndex) => {
    // Check main activity scheduleplans
    if (activity.scheduleplans) {
      activity.scheduleplans.forEach((scheduleplan: any, scheduleplanIndex: number) => {
        if (scheduleplan.month && scheduleplan.year && scheduleplan.week) {
          const key = `${scheduleplan.year}-${scheduleplan.month.toString().padStart(2, '0')}-W${scheduleplan.week}`
          const existing = periodMap.get(key)
          periodMap.set(key, {
            month: scheduleplan.month,
            year: scheduleplan.year,
            week: scheduleplan.week,
            count: (existing?.count || 0) + 1,
          })
        }
      })
    }

    // Check sub-activity scheduleplans
    if (activity.subActivities) {
      activity.subActivities.forEach((subActivity: any, subIndex: number) => {
        if (subActivity.scheduleplans) {
          subActivity.scheduleplans.forEach((scheduleplan: any, scheduleplanIndex: number) => {
            if (scheduleplan.month && scheduleplan.year && scheduleplan.week) {
              const key = `${scheduleplan.year}-${scheduleplan.month.toString().padStart(2, '0')}-W${scheduleplan.week}`
              const existing = periodMap.get(key)
              periodMap.set(key, {
                month: scheduleplan.month,
                year: scheduleplan.year,
                week: scheduleplan.week,
                count: (existing?.count || 0) + 1,
              })
            }
          })
        }
      })
    }
  })

  if (periodMap.size === 0) return null

  // Group periods by month
  const monthGroups = new Map<number, { month: number; year: number; weeks: Set<number> }>()

  periodMap.forEach(period => {
    const existing = monthGroups.get(period.month)
    if (existing) {
      existing.weeks.add(period.week)
    } else {
      monthGroups.set(period.month, {
        month: period.month,
        year: period.year,
        weeks: new Set([period.week]),
      })
    }
  })

  // Convert to MonthData format with actual weeks only
  const months: MonthData[] = []

  // Sort months by month number
  const sortedMonths = Array.from(monthGroups.values()).sort((a, b) => a.month - b.month)

  sortedMonths.forEach(monthGroup => {
    const sortedWeeks = Array.from(monthGroup.weeks).sort((a, b) => a - b)

    const weeks: WeekRange[] = sortedWeeks.map(weekNum => {
      // Generate appropriate date range for the week
      // This is approximate since we don't have exact dates from scheduleplan data
      const weekStartDay = (weekNum - 1) * 7 + 1
      const weekEndDay = Math.min(
        weekStartDay + 6,
        getDaysInMonth(monthGroup.month, monthGroup.year)
      )

      return {
        week: weekNum,
        range: `${weekStartDay.toString().padStart(2, '0')}–${weekEndDay.toString().padStart(2, '0')}`,
        startDate: new Date(monthGroup.year, monthGroup.month - 1, weekStartDay),
        endDate: new Date(monthGroup.year, monthGroup.month - 1, weekEndDay),
      }
    })

    months.push({
      month: monthGroup.month,
      name: getMonthName(monthGroup.month),
      weeks: weeks,
    })
  })

  return months
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Generate months with weeks based on actual scheduleplan data
 * This respects partial months and varying week counts from imported data
 */
export function generateMonthsFromSchedulePlanData(activities?: any[]): MonthData[] {
  // First try to get actual periods from scheduleplan data
  if (activities) {
    const actualPeriods = getActualPeriodsFromSchedulePlanData(activities)
    if (actualPeriods && actualPeriods.length > 0) {
      return actualPeriods
    }
  }

  // Fallback: if no scheduleplan data, generate default range

  return generateMonthsFromRange(5, 2025, 9, 2025) // May to September 2025
}

/**
 * Generate months from a specific date range
 */
export function generateMonthsFromRange(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): MonthData[] {
  const months: MonthData[] = []

  let currentMonth = startMonth
  let currentYear = startYear

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const monthName = getMonthName(currentMonth)
    const weeks = generateWeeksForMonth(currentMonth, currentYear)

    months.push({
      month: currentMonth,
      name: monthName,
      weeks: weeks,
    })

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return months
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
 * Generate month and week data based on contract dates or scheduleplan data
 * Uses Monday-Sunday week rules with Thursday ownership for cross-month weeks
 */
export function generateMonthsFromContract(
  tanggalKontrak: string | null,
  akhirKontrak: string | null,
  activities?: any[] // Optional activities parameter to check for scheduleplan data
): MonthData[] {
  // First, try to generate from actual scheduleplan data
  if (activities && activities.length > 0) {
    const scheduleplanMonths = generateMonthsFromSchedulePlanData(activities)
    if (scheduleplanMonths && scheduleplanMonths.length > 0) {
      return scheduleplanMonths
    }
  }

  // Fall back to contract dates
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

// Sequential Week Interface - for linear week progression
export interface SequentialWeek {
  weekNumber: number
  startDate: Date
  endDate: Date
  range: string
  month: number
  year: number
  weekInMonth: number
  isLastWeekOfMonth: boolean
}

/**
 * Parse Indonesian date format (e.g., "23 Mei 2025")
 */
function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Indonesian month mapping
  const indonesianMonths: { [key: string]: string } = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  }

  try {
    // Handle Indonesian format (contains month names)
    const indonesianPattern = /(\d{1,2})\s+(\w+)\s+(\d{4})/i
    const indonesianMatch = dateStr.match(indonesianPattern)

    if (indonesianMatch) {
      const [, day, monthName, year] = indonesianMatch
      const monthNum = indonesianMonths[monthName.toLowerCase()]
      if (monthNum) {
        const formattedDate = `${year}-${monthNum}-${day.padStart(2, '0')}`
        const date = new Date(formattedDate)
        return date
      }
    }

    // Handle standard formats
    if (dateStr.includes('-')) {
      // Check if it's YYYY-MM-DD or DD-MM-YYYY
      const parts = dateStr.split('-')
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        return new Date(dateStr)
      } else {
        // DD-MM-YYYY format
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      }
    } else if (dateStr.includes('/')) {
      // DD/MM/YYYY format
      const parts = dateStr.split('/')
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    }

    // Try direct parsing as fallback
    return new Date(dateStr)
  } catch (error) {
    console.error('❌ Error parsing Indonesian date:', dateStr, error)
    return null
  }
}

/**
 * Generate sequential weeks starting from SPMK date
 * This creates a linear progression of weeks regardless of month boundaries
 */
export function generateSequentialWeeks(
  spmkDate: string | null,
  totalWeeks: number = 30
): SequentialWeek[] {
  if (!spmkDate) {
    // Fallback to May 19, 2025 so that W2 aligns with CSV Period 1 (May 26-June 1)
    const fallbackStart = new Date('2025-05-19')
    const weeks = generateSequentialWeeksFromDate(fallbackStart, totalWeeks)
    return addLastWeekOfMonthFlags(weeks)
  }

  try {
    const startDate = parseIndonesianDate(spmkDate)
    if (!startDate) {
      throw new Error('Failed to parse SPMK date')
    }

    const weeks = generateSequentialWeeksFromDate(startDate, totalWeeks)
    return addLastWeekOfMonthFlags(weeks)
  } catch (error) {
    console.error('❌ Error parsing SPMK date, using fallback:', error)
    // Fallback to May 19, 2025 so that W2 aligns with CSV Period 1 (May 26-June 1)
    const fallbackStart = new Date('2025-05-19')
    const weeks = generateSequentialWeeksFromDate(fallbackStart, totalWeeks)
    return addLastWeekOfMonthFlags(weeks)
  }
}

/**
 * Helper function to determine if a week is at the end of a month (for month separators)
 */
function addLastWeekOfMonthFlags(weeks: SequentialWeek[]): SequentialWeek[] {
  // Group weeks by month-year key
  const monthGroups: { [key: string]: SequentialWeek[] } = {}
  
  weeks.forEach(week => {
    const currentMonthKey = `${week.year}-${week.month}`
    if (!monthGroups[currentMonthKey]) {
      monthGroups[currentMonthKey] = []
    }
    monthGroups[currentMonthKey].push(week)
  })
  
  // Mark the last week of each month
  return weeks.map(week => {
    const currentMonthKey = `${week.year}-${week.month}`
    const monthGroup = monthGroups[currentMonthKey]
    const lastWeek = monthGroup[monthGroup.length - 1]
    
    return {
      ...week,
      isLastWeekOfMonth: lastWeek.weekNumber === week.weekNumber
    }
  })
}

/**
 * Generate sequential weeks from a specific start date
 */
function generateSequentialWeeksFromDate(startDate: Date, totalWeeks: number): SequentialWeek[] {
  const weeks: SequentialWeek[] = []

  // Find the Monday of the week containing the start date
  const getMonday = (date: Date): Date => {
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6
    const monday = new Date(date)
    monday.setDate(date.getDate() - daysFromMonday)
    return monday
  }

  let currentMonday = getMonday(startDate)

  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = new Date(currentMonday)
    const weekEnd = new Date(currentMonday)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday

    // Use Thursday to determine which month this week belongs to
    const thursday = new Date(currentMonday)
    thursday.setDate(currentMonday.getDate() + 3)

    const month = thursday.getMonth() + 1
    const year = thursday.getFullYear()

    // Calculate week number within the month
    const weekInMonth = getWeekInMonth(thursday)

    // const range = `${weekStart.getDate().toString().padStart(2, '0')}-${weekEnd.getDate().toString().padStart(2, '0')} ${getMonthNameIndonesian(month)}`
    const range = `${weekStart.getDate().toString().padStart(2, '0')}-${weekEnd.getDate().toString().padStart(2, '0')}`

    weeks.push({
      weekNumber: i + 1,
      startDate: weekStart,
      endDate: weekEnd,
      range,
      month,
      year,
      weekInMonth,
    })

    // Move to next Monday
    currentMonday.setDate(currentMonday.getDate() + 7)
  }

  return weeks
}

/**
 * Calculate which week of the month a given date falls in
 * Uses the same algorithm as CSV import to ensure consistency
 */
function getWeekInMonth(date: Date): number {
  const month = date.getMonth() + 1 // Convert to 1-based month
  const year = date.getFullYear()

  // Find the Monday of the week containing this date
  const getMonday = (date: Date): Date => {
    const day = date.getDay()
    const daysFromMonday = day === 0 ? 6 : day - 1
    const monday = new Date(date)
    monday.setDate(date.getDate() - daysFromMonday)
    return monday
  }

  const targetMonday = getMonday(date)
  const thursday = new Date(targetMonday)
  thursday.setDate(targetMonday.getDate() + 3)

  // Use Thursday to determine which month this week belongs to (ISO week rule)
  const thursdayMonth = thursday.getMonth() + 1
  const thursdayYear = thursday.getFullYear()

  // If Thursday is not in the target month, this week doesn't belong to this month
  if (thursdayMonth !== month || thursdayYear !== year) {
    // Fallback calculation for edge cases
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const firstMonday = getMonday(firstDayOfMonth)
    const weeksDiff = Math.floor(
      (targetMonday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    return weeksDiff + 1
  }

  // Calculate week number within the month using same logic as CSV import
  let week = 1
  const firstDayOfMonth = new Date(year, month - 1, 1)
  let currentMonday = getMonday(firstDayOfMonth)

  while (currentMonday <= thursday) {
    const currentThursday = new Date(currentMonday)
    currentThursday.setDate(currentMonday.getDate() + 3)

    // If this Thursday belongs to our target month
    if (currentThursday.getMonth() === month - 1 && currentThursday.getFullYear() === year) {
      if (currentMonday.getTime() === targetMonday.getTime()) {
        break // Found our week number
      }
      week++
    }

    currentMonday.setDate(currentMonday.getDate() + 7)
  }

  return week
}

/**
 * Get Indonesian month name
 */
function getMonthNameIndonesian(month: number): string {
  const months = [
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
  return months[month - 1] || 'Unknown'
}

// Test script to validate the new weekly division rules
// Run with: node test-weekly-division.js

const { format, addDays, getDay } = require('date-fns')

function getMonday(date) {
  const day = getDay(date) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromMonday = day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6
  return addDays(date, -daysFromMonday)
}

function generateWeeksForMonth(month, year) {
  const weeks = []

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

// Test the validation cases for 2025
console.log('=== 2025 Weekly Division Validation ===\n')

const testMonths = [
  { month: 6, name: 'JUNI', expected: ['02–08', '09–15', '16–22', '23–29'] },
  { month: 7, name: 'JULI', expected: ['30–06', '07–13', '14–20', '21–27', '28–03'] },
  { month: 8, name: 'AGUSTUS', expected: ['04–10', '11–17', '18–24', '25–31'] },
  { month: 9, name: 'SEPTEMBER', expected: ['01–07', '08–14', '15–21', '22–28'] },
]

testMonths.forEach(({ month, name, expected }) => {
  const weeks = generateWeeksForMonth(month, 2025)
  const actual = weeks.map(w => w.range)

  console.log(`${name}:`)
  console.log(`  Expected: ${expected.join(', ')}`)
  console.log(`  Actual:   ${actual.join(', ')}`)
  console.log(`  Match:    ${JSON.stringify(expected) === JSON.stringify(actual) ? '✅' : '❌'}`)
  console.log('')
})

// Test contract example: 22 May 2025 to 19 September 2025
console.log('=== Contract Example: 22 May 2025 to 19 September 2025 ===\n')

function simulateContractWeeks(startDate, endDate) {
  const year = startDate.getFullYear()
  const startMonth = startDate.getMonth() + 1
  const endMonth = endDate.getMonth() + 1
  const endYear = endDate.getFullYear()

  const months = []

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

  return []
}

function getMonthName(month) {
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

const contractStart = new Date(2025, 4, 22) // May 22, 2025
const contractEnd = new Date(2025, 8, 19) // September 19, 2025

const contractMonths = simulateContractWeeks(contractStart, contractEnd)

contractMonths.forEach(month => {
  console.log(`${month.name}: ${month.weeks.map(w => w.range).join(', ')}`)
})

// Debug the exact week calculations
const getMonday = (date) => {
  const day = date.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(date)
  monday.setDate(date.getDate() - daysFromMonday)
  return monday
}

// CSV Week Calculation (exact copy from CSV import)
const csvWeekCalculation = (targetDate) => {
  const monday = getMonday(targetDate)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)

  const month = thursday.getMonth() + 1
  const year = thursday.getFullYear()

  let week = 1
  const firstDayOfMonth = new Date(year, month - 1, 1)
  let currentMonday = getMonday(firstDayOfMonth)

  console.log(`🔍 CSV Week Calculation for ${targetDate.toISOString().slice(0, 10)}:`)
  console.log(`  - Monday of week: ${monday.toISOString().slice(0, 10)}`)
  console.log(`  - Thursday of week: ${thursday.toISOString().slice(0, 10)}`)
  console.log(`  - Thursday belongs to Month ${month}, Year ${year}`)
  console.log(`  - First day of month: ${firstDayOfMonth.toISOString().slice(0, 10)}`)
  console.log(`  - First Monday of month: ${currentMonday.toISOString().slice(0, 10)}`)

  while (currentMonday <= thursday) {
    const currentThursday = new Date(currentMonday)
    currentThursday.setDate(currentMonday.getDate() + 3)

    console.log(`  - Checking Monday ${currentMonday.toISOString().slice(0, 10)} (Thursday: ${currentThursday.toISOString().slice(0, 10)})`)

    if (currentThursday.getMonth() === month - 1 && currentThursday.getFullYear() === year) {
      console.log(`    ✓ Thursday is in target month ${month}`)
      if (currentMonday.getTime() === monday.getTime()) {
        console.log(`    ✓ Found match! Week number: ${week}`)
        break
      }
      week++
      console.log(`    → Moving to week ${week}`)
    } else {
      console.log(`    ✗ Thursday not in target month (in month ${currentThursday.getMonth() + 1})`)
    }

    currentMonday.setDate(currentMonday.getDate() + 7)
  }

  return { month, year, week }
}

console.log('=== DEBUGGING WEEK CALCULATIONS ===')

// Test with the specific date: May 26, 2025 (Monday)
const testDate = new Date('2025-05-26')
console.log(`\nTesting date: ${testDate.toISOString().slice(0, 10)} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][testDate.getDay()]})`)

const csvResult = csvWeekCalculation(testDate)
console.log(`\n📊 CSV Result: Month ${csvResult.month}, Week ${csvResult.week}`)

console.log('\n=== CHECKING MONDAY CALCULATIONS ===')
// Check if the Monday calculation is consistent
const monday = getMonday(testDate)
console.log(`Original date: ${testDate.toISOString().slice(0, 10)}`)
console.log(`Monday of that week: ${monday.toISOString().slice(0, 10)}`)
console.log(`Are they the same? ${testDate.getTime() === monday.getTime()}`)

// Check what happens with the first day of May 2025
console.log('\n=== MAY 2025 WEEK STRUCTURE ===')
const may1 = new Date('2025-05-01')
console.log(`May 1, 2025 is a ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][may1.getDay()]}`)

for (let day = 1; day <= 31; day++) {
  const date = new Date(`2025-05-${day.toString().padStart(2, '0')}`)
  const monday = getMonday(date)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  
  // Calculate week number for this day
  let week = 1
  const firstDayOfMonth = new Date(2025, 4, 1) // May 2025
  let currentMonday = getMonday(firstDayOfMonth)

  while (currentMonday <= thursday) {
    const currentThursday = new Date(currentMonday)
    currentThursday.setDate(currentMonday.getDate() + 3)

    if (currentThursday.getMonth() === 4 && currentThursday.getFullYear() === 2025) { // May is month 4 (0-based)
      if (currentMonday.getTime() === monday.getTime()) {
        break
      }
      week++
    }

    currentMonday.setDate(currentMonday.getDate() + 7)
  }
  
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  console.log(`May ${day} (${dayName}): Monday ${monday.toISOString().slice(5, 10)}, Thursday ${thursday.toISOString().slice(5, 10)} → Week ${week}`)
}

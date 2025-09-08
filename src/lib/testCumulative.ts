// Test file for cumulative calculations
// This file can be deleted after testing

import { calculateCumulativeData, getCumulativeValue } from './cumulativeCalculations'
import type { Activity } from './schemas'

// Sample test data
const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Test Activity 1',
    order: 1,
    subActivities: [
      {
        id: 'sub1',
        name: 'Sub Activity 1',
        weight: 50,
        order: 1,
        schedules: [
          { month: 6, week: 1, year: 2025, planPercentage: 5, actualPercentage: 5 },
          { month: 6, week: 2, year: 2025, planPercentage: 10, actualPercentage: 8 },
        ],
      },
      {
        id: 'sub2',
        name: 'Sub Activity 2',
        weight: 30,
        order: 2,
        schedules: [
          { month: 6, week: 1, year: 2025, planPercentage: 3, actualPercentage: 3 },
          { month: 6, week: 2, year: 2025, planPercentage: 7, actualPercentage: 7 },
        ],
      },
    ],
  },
]

const mockMonths = [
  {
    month: 6,
    weeks: [{ week: 1 }, { week: 2 }],
  },
]

// Test cumulative calculations
export function testCumulativeCalculations() {
  console.log('Testing cumulative calculations...')

  const cumulativeData = calculateCumulativeData(mockActivities, mockMonths, 2025)

  console.log('Cumulative data:', cumulativeData)

  // Test getCumulativeValue function
  const week1Plan = getCumulativeValue(cumulativeData, 6, 1, 'plan')
  const week1Actual = getCumulativeValue(cumulativeData, 6, 1, 'actual')
  const week2Plan = getCumulativeValue(cumulativeData, 6, 2, 'plan')
  const week2Actual = getCumulativeValue(cumulativeData, 6, 2, 'actual')

  console.log('Week 1 - Plan:', week1Plan, 'Actual:', week1Actual)
  console.log('Week 2 - Plan:', week2Plan, 'Actual:', week2Actual)

  // Expected results:
  // Week 1: Plan = 8 (5+3), Actual = 8 (5+3)
  // Week 2: Plan = 25 (8 + 10+7), Actual = 23 (8 + 8+7)

  return cumulativeData
}

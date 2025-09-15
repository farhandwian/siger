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
    projectId: 'proj1',
    createdAt: new Date(),
    updatedAt: new Date(),
    subActivities: [
      {
        id: 'sub1',
        name: 'Sub Activity 1',
        weight: 50,
        order: 1,
        activityId: 'act1',
        satuan: 'unit',
        volume: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        schedules: [
          { 
            id: 'sp1', 
            subActivityId: 'sub1',
            weekNumber: 1,
            plan: 5,
            actionPlan: 5,
            realization: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'sp2', 
            subActivityId: 'sub1',
            weekNumber: 2,
            plan: 10,
            actionPlan: 8,
            realization: 7,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        ],
      },
      {
        id: 'sub2',
        name: 'Sub Activity 2',
        weight: 30,
        order: 2,
        activityId: 'act1',
        satuan: 'unit',
        volume: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        schedules: [
          { 
            id: 'sp3', 
            subActivityId: 'sub2',
            weekNumber: 1,
            plan: 3,
            actionPlan: 4,
            realization: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'sp4', 
            subActivityId: 'sub2',
            weekNumber: 2,
            plan: 7,
            actionPlan: 6,
            realization: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          },
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

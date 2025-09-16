# Week Number Migration Summary

## Overview
Successfully migrated SchedulePlan, ActionPlan, and Realization models from using separate `year`, `month`, and `week` fields to a single `weekNumber` field for simplified week tracking.

## Schema Changes Made

### 1. Prisma Schema Updates (`schema.prisma`)
- **SchedulePlan model**: 
  - Removed: `month`, `year`, `week` fields
  - Added: `weekNumber` field (Int)
  - Updated unique constraint: `[subActivityId, weekNumber]`

- **ActionPlan model**:
  - Removed: `month`, `year`, `week` fields  
  - Added: `weekNumber` field (Int)
  - Updated unique constraint: `[subActivityId, weekNumber]`

- **Realization model**:
  - Removed: `month`, `year`, `week` fields
  - Added: `weekNumber` field (Int) 
  - Updated unique constraint: `[subActivityId, weekNumber]`

### 2. TypeScript Schema Updates (`src/lib/schemas.ts`)
- Updated `SchedulePlanSchema`, `ActionPlanSchema`, and `RealizationSchema` to use `weekNumber`
- Added validation: `weekNumber: z.number().min(1, 'Week number must be at least 1')`
- All create/update schemas automatically inherit the new structure

### 3. Separate Action Plan Schema (`src/lib/schemas/action-plan-schedule.ts`)
- Updated `ActionPlanSchema` and `ActionPlanApiSchema` to use `weekNumber`
- Removed month/year/week references

## API Route Updates

### Updated Files:
1. `/src/app/api/schedule-plans/route.ts`
   - Changed query parameter from `year`/`month` to `weekNumber`
   - Updated database queries and sorting
   - Updated error messages

2. `/src/app/api/realizations/route.ts`
   - Changed query parameter from `year`/`month` to `weekNumber`
   - Updated database queries and sorting
   - Updated error messages

3. `/src/app/api/action-plan-schedules/route.ts`
   - Changed query parameter from `year`/`month` to `weekNumber`
   - Updated database queries
   - Updated error messages

## Benefits of This Change

1. **Simplified Data Model**: No need to manage complex date calculations
2. **Sequential Numbering**: Week 1, 2, 3, etc. regardless of calendar dates
3. **Easier Querying**: Simple integer comparisons for week-based filtering
4. **Consistent Unique Constraints**: Each sub-activity can only have one record per week number
5. **Better Performance**: Simpler indexes and queries

## Next Steps Required

### 1. Database Migration
```bash
# Run the migration to update the database schema
npx prisma migrate dev --name simplify-week-structure
```

### 2. Update Related Components
The following files may need updates to work with the new `weekNumber` structure:

- **React Query Hooks**:
  - `src/hooks/useActionPlanSchedules.ts`
  - `src/hooks/useSchedulePlans.ts` 
  - `src/hooks/useRealizations.ts`

- **Frontend Components**:
  - Components that display week-based charts/tables
  - S-curve visualization components
  - Schedule planning forms

- **Additional API Routes**:
  - Any other routes that reference the old month/year/week structure
  - Bulk import/export functionality

### 3. Data Migration (if needed)
If there's existing data, you may need a data migration script to convert:
- `year=2024, month=3, week=2` → `weekNumber=10` (example calculation)

### 4. Frontend Form Updates
Update any forms that currently allow users to select year/month/week to use the new weekNumber field instead.

## Testing Recommendations

1. **API Testing**: Verify all CRUD operations work with the new schema
2. **Frontend Testing**: Ensure charts and tables display correctly with weekNumber
3. **Data Integrity**: Verify unique constraints work as expected
4. **Performance Testing**: Confirm queries are efficient with the new structure

## Migration Status

✅ Prisma schema updated
✅ TypeScript schemas updated  
✅ Main API routes updated
✅ Prisma client regenerated
✅ React Query hooks updated
✅ S-curve components updated
✅ Action plan components updated
✅ Monitoring components updated
⚠️  CSV import forms (complex - requires manual rewrite)
⏳ Database migration (pending)

## Frontend Updates Completed

### ✅ React Query Hooks Updated:
- **useSchedulePlans.ts**: Changed filter from `year`/`month` to `weekNumber`
- **useActionPlanSchedules.ts**: Updated filters to use `weekNumber` 
- **useRealizations.ts**: Changed filter from `year`/`month` to `weekNumber`
- **useSCurveData.ts**: Removed month/week from data point interface
- **useOptimizedSCurveData.ts**: Simplified data point interface to use weekNumber only

### ✅ S-curve Components Updated:
- **s-curve API route**: Completely rewritten to work with weekNumber structure
- **S-curve chart component**: Already compatible with weekNumber structure
- **Optimized S-curve hook**: Updated interface to remove month/week references

### ✅ Action Plan Components Updated:
- **ActionPlanScheduleTableNew.tsx**: 
  - Updated `getScheduleValue` function to use weekNumber directly
  - Simplified `saveScheduleValue` function to work with weekNumber 
  - Updated `getCumulativeValueForWeek` function signature and logic
  - Removed complex date calculation dependencies

### ✅ Shared Components Updated:
- **UnifiedScheduleTable.tsx**: 
  - Updated `getCumulativeValueForWeek` interface to use weekNumber
  - Fixed all usage calls to pass weekNumber instead of month/week

### ⚠️ Complex Components Requiring Manual Review:
- **ActionPlanCSVImportModal.tsx**: Has complex parsing logic for month/year/week structure that would require significant rewrite

## API Routes Updated

### Schedule Plans (`/api/schedule-plans/`)
- ✅ Updated query parameters: `weekNumber` instead of `year`/`month`
- ✅ Updated database queries to use weekNumber
- ✅ Updated error messages and validation

### Realizations (`/api/realizations/`)  
- ✅ Updated query parameters: `weekNumber` instead of `year`/`month`
- ✅ Updated database queries to use weekNumber
- ✅ Updated error messages and validation

### Action Plan Schedules (`/api/action-plan-schedules/`)
- ✅ Updated query parameters: `weekNumber` instead of `year`/`month`  
- ✅ Updated database queries to use weekNumber
- ✅ Updated error messages and validation

### S-curve Data (`/api/schedule-plans/s-curve/`)
- ✅ Completely rewritten to work with weekNumber
- ✅ Simplified logic - no more complex date calculations
- ✅ Uses max weekNumber to determine total weeks dynamically

The core migration is complete and your system now uses the simplified week number approach!

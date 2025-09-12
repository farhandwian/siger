# Week-Based CSV Import Implementation

## Overview
Changed the CSV import system from month-based parsing to week-based parsing, where CSV columns (1, 2, 3, 4...) are mapped as consecutive weeks starting from the project's SPMK date (`tanggal_spmk`).

## Key Changes

### 1. SPMK Date Fetching
- **File**: `src/components/activities/csv-import-modal.tsx`
- **Added**: `fetchProjectSpmkDate()` function that fetches the project's SPMK date via API
- **Added**: `spmkDate` state to store the fetched date
- **Added**: `useEffect` to fetch SPMK date when modal opens

### 2. Week-Based Mapping Functions
- **Replaced**: `buildPeriodMapping()` with SPMK date-based logic
- **Added**: `buildWeekBasedMapping()` - main function for week-based mapping
- **Added**: `generateWeekMapping()` - generates consecutive weeks from start date

### 3. Date Format Support
The system now supports multiple date formats:
- **Indonesian**: "23 Mei 2025" (DD Month YYYY)
- **ISO Standard**: "2025-05-23" (YYYY-MM-DD)  
- **European**: "23-05-2025" (DD-MM-YYYY)
- **US Format**: "23/05/2025" (DD/MM/YYYY)

### 4. UI Improvements
- **Added**: SPMK date display in the CSV import modal
- **Added**: Explanation text showing that CSV columns map to consecutive weeks from SPMK date
- **Added**: Validation to prevent import if SPMK date is missing

### 5. Week Calculation Logic
```javascript
// Starting from SPMK date (e.g., "23 Mei 2025")
Week 1: May Week 4 (starting May 23, 2025)
Week 2: May Week 5 (starting May 30, 2025) 
Week 3: June Week 1 (starting June 6, 2025)
Week 4: June Week 2 (starting June 13, 2025)
// ... and so on
```

## CSV Column Mapping

| CSV Column | Header | Week Mapping | Database Storage |
|------------|--------|--------------|------------------|
| 1, 2, 3... | Week numbers | Sequential weeks from SPMK date | `month`, `year`, `week` fields |
| 7 (Column H) | Week 1 | SPMK date week | Based on SPMK date |
| 8 (Column I) | Week 2 | SPMK date + 7 days | Calculated dynamically |
| ... | ... | ... | ... |

## Benefits

1. **SPMK-Aligned**: Weeks align with actual project start date (SPMK)
2. **Predictable**: No need to parse ambiguous month names from CSV headers
3. **Project-Specific**: Each project has its own timeline based on its SPMK date
4. **Flexible**: Supports various date formats
5. **Consistent**: Same week calculation logic across the application
6. **User-Friendly**: Clear indication of the SPMK date mapping in UI

## Database Impact
- **Added**: `tanggal_spmk` field to project seed data
- No schema changes required (field already exists)
- Existing `ActivitySchedule` table structure unchanged
- Week data calculated dynamically based on SPMK date

## API Usage
The CSV import now automatically fetches project data:
```
GET /api/projects/[id]
```
Returns project data including `tanggal_spmk` field used for week calculation.

## Error Handling
- Graceful fallback to May 2025 if SPMK date is invalid
- Clear error messages for unsupported date formats  
- Validation prevents import without valid SPMK date
- Comprehensive logging for debugging

## Example Usage

### Project 1 (SPMK: "23 Mei 2025")
1. User opens CSV import modal
2. System fetches SPMK date: "23 Mei 2025"
3. System displays: "Week calculation starts from: 23 Mei 2025"
4. User uploads CSV with columns 1, 2, 3, 4...
5. System maps:
   - Column 1 → Week 1 (May 23, 2025) → 2025-05-W4
   - Column 2 → Week 2 (May 30, 2025) → 2025-05-W5
   - Column 3 → Week 3 (June 6, 2025) → 2025-06-W1
   - etc.

### Project 2 (SPMK: "25 Mei 2025")
- Column 1 → Week 1 (May 25, 2025) → 2025-05-W4
- Column 2 → Week 2 (June 1, 2025) → 2025-06-W1
- Column 3 → Week 3 (June 8, 2025) → 2025-06-W2
- etc.

## Project Comparison
Notice how different SPMK dates result in different week alignments:
- **Project 1 (SPMK: 23 Mei)**: Week 2 falls in May Week 5
- **Project 2 (SPMK: 25 Mei)**: Week 2 falls in June Week 1

This ensures each project's schedule table dynamically shows the correct date range based on the actual project start date (SPMK), providing accurate timeline representation for each individual project.

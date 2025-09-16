-- Performance optimization indexes for Realizations API
-- Add these indexes to improve query performance

-- Index for filtering realizations by project (most common query pattern)
-- This supports the nested query: subActivity.activity.projectId
CREATE INDEX IF NOT EXISTS "realizations_project_lookup_idx" 
ON "realizations" ("sub_activity_id");

-- Index for time-based filtering (year, month, week combinations)
CREATE INDEX IF NOT EXISTS "realizations_time_filter_idx" 
ON "realizations" ("year", "month", "week");

-- Composite index for the most common query pattern (project + time)
CREATE INDEX IF NOT EXISTS "realizations_project_time_idx" 
ON "realizations" ("sub_activity_id", "year", "month", "week");

-- Index for sub_activities to improve JOIN performance
CREATE INDEX IF NOT EXISTS "sub_activities_activity_lookup_idx" 
ON "sub_activities" ("activity_id");

-- Index for activities to improve project filtering
CREATE INDEX IF NOT EXISTS "activities_project_lookup_idx" 
ON "activities" ("project_id");

-- Covering index for the most frequent select fields
CREATE INDEX IF NOT EXISTS "realizations_covering_idx" 
ON "realizations" ("sub_activity_id", "year", "month", "week") 
INCLUDE ("id", "percentage", "created_at", "updated_at");

/*
How to apply these indexes:

1. Connect to your PostgreSQL database
2. Run these CREATE INDEX statements
3. Monitor query performance with EXPLAIN ANALYZE

Expected improvements:
- 30-50% reduction in query time for projectId filters
- Better performance for time-range queries
- Improved JOIN performance across related tables
*/

-- Phase 01 schema changes
-- 1. Drop timer columns from wins table (STOPWATCH REMOVED)
-- 2. Add category column to journal_entries

-- Drop timer columns from wins
ALTER TABLE wins DROP COLUMN IF EXISTS timer_elapsed_seconds;
ALTER TABLE wins DROP COLUMN IF EXISTS timer_started_at;

-- Add category column to journal_entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'daily'
    CHECK (category IN ('daily', 'milestone', 'financial'));

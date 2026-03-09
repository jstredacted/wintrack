-- Migration: 001_initial_schema
-- Creates wins, check_ins, and journal_entries tables with RLS policies.
-- Run in Supabase Dashboard -> SQL Editor -> New query -> paste and run.

-- ============================================================
-- wins
-- ============================================================
CREATE TABLE IF NOT EXISTS wins (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  title                 text NOT NULL,
  win_date              text NOT NULL,  -- YYYY-MM-DD in user's local timezone (set by client using getLocalDateString())
  created_at            timestamptz NOT NULL DEFAULT now(),
  timer_elapsed_seconds integer NOT NULL DEFAULT 0,
  timer_started_at      timestamptz
);

ALTER TABLE wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wins_select" ON wins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wins_insert" ON wins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wins_update" ON wins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wins_delete" ON wins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- check_ins
-- ============================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  win_id     uuid NOT NULL REFERENCES wins(id) ON DELETE CASCADE,
  completed  boolean NOT NULL DEFAULT false,
  note       text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "check_ins_select" ON check_ins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "check_ins_insert" ON check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_update" ON check_ins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_delete" ON check_ins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- journal_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries_select" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_entries_insert" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_update" ON journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_delete" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

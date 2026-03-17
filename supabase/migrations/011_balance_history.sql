-- Migration: 011_balance_history
-- Creates balance_changes table for audit trail of manual balance overrides.

CREATE TABLE IF NOT EXISTS balance_changes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  month_id     uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  old_balance  numeric(14,2) NOT NULL,
  new_balance  numeric(14,2) NOT NULL,
  delta        numeric(14,2) NOT NULL,     -- new_balance - old_balance (computed for convenience)
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE balance_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "balance_changes_select" ON balance_changes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "balance_changes_insert" ON balance_changes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "balance_changes_delete" ON balance_changes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS balance_changes_month_idx ON balance_changes(month_id, created_at DESC);

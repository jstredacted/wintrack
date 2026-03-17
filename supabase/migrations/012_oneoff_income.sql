-- Migration: 012_oneoff_income
-- Creates oneoff_income table for one-time bonus/extra income entries.

CREATE TABLE IF NOT EXISTS oneoff_income (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  month_id    uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  date        date NOT NULL,
  note        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE oneoff_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oneoff_income_select" ON oneoff_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "oneoff_income_insert" ON oneoff_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oneoff_income_update" ON oneoff_income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oneoff_income_delete" ON oneoff_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS oneoff_income_month_idx ON oneoff_income(month_id);

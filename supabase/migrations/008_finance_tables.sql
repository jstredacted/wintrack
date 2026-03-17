-- Migration: 008_finance_tables
-- Creates months, income_sources, and monthly_income tables with RLS policies.
-- Finance core tables for balance tracking, budgets, and income management.

-- ============================================================
-- months — one row per calendar month
-- ============================================================
CREATE TABLE IF NOT EXISTS months (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  year             int NOT NULL CHECK (year >= 2000 AND year <= 3000),
  month            int NOT NULL CHECK (month BETWEEN 1 AND 12),
  starting_balance numeric(14,2) NOT NULL DEFAULT 0,
  current_balance  numeric(14,2) NOT NULL DEFAULT 0,
  budget_limit     numeric(14,2) NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "months_select" ON months FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "months_insert" ON months FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "months_update" ON months FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "months_delete" ON months FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- income_sources — user-configured income streams (Settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS income_sources (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  name              text NOT NULL,
  amount            numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency          text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  conversion_method text NOT NULL DEFAULT 'none' CHECK (conversion_method IN ('wise', 'paypal', 'none')),
  payday_day        int CHECK (payday_day BETWEEN 1 AND 31),
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_sources_select" ON income_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "income_sources_insert" ON income_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_sources_update" ON income_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_sources_delete" ON income_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- monthly_income — per-month instances of income sources
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_income (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  month_id          uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  income_source_id  uuid NOT NULL REFERENCES income_sources(id) ON DELETE CASCADE,
  expected_amount   numeric(14,2) NOT NULL,
  currency          text NOT NULL DEFAULT 'USD',
  conversion_method text NOT NULL DEFAULT 'none',
  exchange_rate     numeric(10,4),
  fee_amount        numeric(14,2),
  net_php           numeric(14,2),
  received          boolean NOT NULL DEFAULT false,
  received_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, income_source_id)
);

ALTER TABLE monthly_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_income_select" ON monthly_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "monthly_income_insert" ON monthly_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_income_update" ON monthly_income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_income_delete" ON monthly_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS months_user_year_month_idx ON months(user_id, year, month);
CREATE INDEX IF NOT EXISTS income_sources_user_active_idx ON income_sources(user_id, active);
CREATE INDEX IF NOT EXISTS monthly_income_month_id_idx ON monthly_income(month_id);

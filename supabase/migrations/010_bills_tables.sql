-- Migration: 010_bills_tables
-- Creates bill_templates and monthly_bills tables with RLS policies.
-- Bills management: recurring bill definitions + per-month instances.

-- ============================================================
-- bill_templates: recurring bill definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  amount           numeric(14,2) NOT NULL CHECK (amount >= 0),
  due_day          int NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  recurrence_type  text NOT NULL DEFAULT 'ongoing'
    CHECK (recurrence_type IN ('one_time', 'recurring_n', 'recurring_until', 'ongoing')),
  recurrence_count int,                    -- for 'recurring_n': total number of months
  recurrence_end   text,                   -- for 'recurring_until': 'YYYY-MM'
  start_month      text NOT NULL,          -- 'YYYY-MM': first month this bill appears
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bill_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bill_templates_select" ON bill_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bill_templates_insert" ON bill_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bill_templates_update" ON bill_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bill_templates_delete" ON bill_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- monthly_bills: per-month bill instances
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_bills (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  month_id          uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  bill_template_id  uuid NOT NULL REFERENCES bill_templates(id) ON DELETE CASCADE,
  name              text NOT NULL,          -- Snapshot from template
  amount            numeric(14,2) NOT NULL, -- Snapshot from template
  due_day           int NOT NULL,
  paid              boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, bill_template_id)
);

ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_bills_select" ON monthly_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "monthly_bills_insert" ON monthly_bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_bills_update" ON monthly_bills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_bills_delete" ON monthly_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS bill_templates_user_active_idx ON bill_templates(user_id, active);
CREATE INDEX IF NOT EXISTS monthly_bills_month_id_idx ON monthly_bills(month_id);
CREATE INDEX IF NOT EXISTS monthly_bills_template_idx ON monthly_bills(bill_template_id);

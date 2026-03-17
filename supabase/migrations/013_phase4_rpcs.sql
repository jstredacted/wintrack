-- Migration: 013_phase4_rpcs
-- RPC functions for Phase 4: bills, balance history, one-off income, year overview.

-- Toggle bill paid/unpaid, adjusting balance atomically
CREATE OR REPLACE FUNCTION apply_bill_paid(
  p_monthly_bill_id uuid,
  p_paid boolean
)
RETURNS monthly_bills
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  bill_row monthly_bills;
BEGIN
  SELECT * INTO bill_row FROM monthly_bills WHERE id = p_monthly_bill_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_bill_not_found';
  END IF;

  IF p_paid THEN
    UPDATE monthly_bills SET paid = true, paid_at = now()
    WHERE id = p_monthly_bill_id
    RETURNING * INTO bill_row;

    UPDATE months SET current_balance = current_balance - bill_row.amount
    WHERE id = bill_row.month_id;
  ELSE
    UPDATE months SET current_balance = current_balance + bill_row.amount
    WHERE id = bill_row.month_id;

    UPDATE monthly_bills SET paid = false, paid_at = NULL
    WHERE id = p_monthly_bill_id
    RETURNING * INTO bill_row;
  END IF;

  RETURN bill_row;
END;
$$;

-- Populate monthly_bills from active bill_templates for a month
CREATE OR REPLACE FUNCTION populate_monthly_bills(p_user_id uuid, p_month_id uuid, p_year int, p_month int)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  inserted_count int;
  current_month_str text;
BEGIN
  current_month_str := p_year || '-' || lpad(p_month::text, 2, '0');

  WITH eligible_templates AS (
    SELECT bt.*
    FROM bill_templates bt
    WHERE bt.user_id = p_user_id
      AND bt.active = true
      AND bt.start_month <= current_month_str
      AND (
        bt.recurrence_type = 'ongoing'
        OR (bt.recurrence_type = 'one_time' AND bt.start_month = current_month_str)
        OR (bt.recurrence_type = 'recurring_until' AND bt.recurrence_end >= current_month_str)
        OR (bt.recurrence_type = 'recurring_n' AND (
          SELECT count(*) FROM monthly_bills mb WHERE mb.bill_template_id = bt.id
        ) < bt.recurrence_count)
      )
  ),
  new_bills AS (
    INSERT INTO monthly_bills (user_id, month_id, bill_template_id, name, amount, due_day)
    SELECT
      et.user_id, p_month_id, et.id, et.name, et.amount, et.due_day
    FROM eligible_templates et
    ON CONFLICT (month_id, bill_template_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO inserted_count FROM new_bills;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

-- Override balance with history logging
CREATE OR REPLACE FUNCTION apply_balance_override(
  p_month_id uuid,
  p_new_balance numeric,
  p_note text DEFAULT NULL
)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  month_row months;
  old_bal numeric(14,2);
BEGIN
  SELECT * INTO month_row FROM months WHERE id = p_month_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'month_not_found';
  END IF;

  old_bal := month_row.current_balance;

  -- Log the change
  INSERT INTO balance_changes (user_id, month_id, old_balance, new_balance, delta, note)
  VALUES (month_row.user_id, p_month_id, old_bal, p_new_balance, p_new_balance - old_bal, p_note);

  -- Apply the override
  UPDATE months SET current_balance = p_new_balance
  WHERE id = p_month_id
  RETURNING * INTO month_row;

  RETURN month_row;
END;
$$;

-- Revert a balance change (delete entry + adjust balance)
CREATE OR REPLACE FUNCTION revert_balance_change(p_change_id uuid)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  change_row balance_changes;
  month_row months;
BEGIN
  SELECT * INTO change_row FROM balance_changes WHERE id = p_change_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'balance_change_not_found';
  END IF;

  -- Revert: subtract the delta that was applied
  UPDATE months SET current_balance = current_balance - change_row.delta
  WHERE id = change_row.month_id
  RETURNING * INTO month_row;

  -- Delete the change entry
  DELETE FROM balance_changes WHERE id = p_change_id;

  RETURN month_row;
END;
$$;

-- Add one-off income (inserts row + adds to balance)
CREATE OR REPLACE FUNCTION apply_oneoff_income(
  p_user_id uuid,
  p_month_id uuid,
  p_amount numeric,
  p_date date,
  p_note text
)
RETURNS oneoff_income
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row oneoff_income;
BEGIN
  INSERT INTO oneoff_income (user_id, month_id, amount, date, note)
  VALUES (p_user_id, p_month_id, p_amount, p_date, p_note)
  RETURNING * INTO income_row;

  UPDATE months SET current_balance = current_balance + p_amount
  WHERE id = p_month_id;

  RETURN income_row;
END;
$$;

-- Delete one-off income (removes row + subtracts from balance)
CREATE OR REPLACE FUNCTION delete_oneoff_income(p_oneoff_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row oneoff_income;
BEGIN
  SELECT * INTO income_row FROM oneoff_income WHERE id = p_oneoff_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'oneoff_income_not_found';
  END IF;

  UPDATE months SET current_balance = current_balance - income_row.amount
  WHERE id = income_row.month_id;

  DELETE FROM oneoff_income WHERE id = p_oneoff_id;
END;
$$;

-- Year overview: aggregated data for 12 months
CREATE OR REPLACE FUNCTION get_year_overview(p_user_id uuid, p_year int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(month_summary ORDER BY m.year, m.month) INTO result
  FROM months m
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(CASE WHEN mi.received THEN mi.net_php ELSE 0 END), 0) AS total_income
    FROM monthly_income mi WHERE mi.month_id = m.id
  ) inc ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(CASE WHEN mb.paid THEN mb.amount ELSE 0 END), 0) AS total_expenses
    FROM monthly_bills mb WHERE mb.month_id = m.id
  ) exp ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(oi.amount), 0) AS total_oneoff
    FROM oneoff_income oi WHERE oi.month_id = m.id
  ) oneoff ON true
  CROSS JOIN LATERAL (
    SELECT jsonb_build_object(
      'month', m.year || '-' || lpad(m.month::text, 2, '0'),
      'ending_balance', m.current_balance,
      'starting_balance', m.starting_balance,
      'total_income', inc.total_income,
      'total_expenses', exp.total_expenses,
      'total_oneoff', oneoff.total_oneoff
    ) AS month_summary
  ) summary
  WHERE m.user_id = p_user_id AND m.year = p_year;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Set search_path for security
ALTER FUNCTION apply_bill_paid(uuid, boolean) SET search_path = public;
ALTER FUNCTION populate_monthly_bills(uuid, uuid, int, int) SET search_path = public;
ALTER FUNCTION apply_balance_override(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION revert_balance_change(uuid) SET search_path = public;
ALTER FUNCTION apply_oneoff_income(uuid, uuid, numeric, date, text) SET search_path = public;
ALTER FUNCTION delete_oneoff_income(uuid) SET search_path = public;
ALTER FUNCTION get_year_overview(uuid, int) SET search_path = public;

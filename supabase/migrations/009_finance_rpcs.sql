-- Migration: 009_finance_rpcs
-- RPC functions for finance module: ensure_month_exists, apply_income_received, populate_monthly_income.

-- Ensure a month row exists, carrying forward balance from previous month
CREATE OR REPLACE FUNCTION ensure_month_exists(p_user_id uuid, p_year int, p_month int)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  month_row months;
  prev_balance numeric(14,2);
  prev_year int;
  prev_month int;
BEGIN
  SELECT * INTO month_row FROM months WHERE user_id = p_user_id AND year = p_year AND month = p_month;

  IF FOUND THEN
    RETURN month_row;
  END IF;

  -- Calculate previous month
  IF p_month = 1 THEN
    prev_year := p_year - 1;
    prev_month := 12;
  ELSE
    prev_year := p_year;
    prev_month := p_month - 1;
  END IF;

  -- Get previous month's balance (or 0 if no previous month)
  SELECT current_balance INTO prev_balance
  FROM months WHERE user_id = p_user_id AND year = prev_year AND month = prev_month;

  prev_balance := COALESCE(prev_balance, 0);

  INSERT INTO months (user_id, year, month, starting_balance, current_balance)
  VALUES (p_user_id, p_year, p_month, prev_balance, prev_balance)
  ON CONFLICT (user_id, year, month) DO NOTHING
  RETURNING * INTO month_row;

  -- Handle race condition (concurrent insert)
  IF NOT FOUND THEN
    SELECT * INTO month_row FROM months WHERE user_id = p_user_id AND year = p_year AND month = p_month;
  END IF;

  RETURN month_row;
END;
$$;

-- Mark income as received/unreceived, adjusting balance atomically
CREATE OR REPLACE FUNCTION apply_income_received(
  p_monthly_income_id uuid,
  p_received boolean,
  p_net_php numeric DEFAULT NULL,
  p_exchange_rate numeric DEFAULT NULL,
  p_fee_amount numeric DEFAULT NULL
)
RETURNS monthly_income
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row monthly_income;
  prev_net numeric(14,2);
BEGIN
  SELECT * INTO income_row FROM monthly_income WHERE id = p_monthly_income_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_income_not_found';
  END IF;

  -- Verify ownership via RLS (SECURITY INVOKER means caller's context)
  prev_net := COALESCE(income_row.net_php, 0);

  IF p_received THEN
    -- Mark received: store conversion details, add to balance
    UPDATE monthly_income SET
      received = true,
      received_at = now(),
      exchange_rate = p_exchange_rate,
      fee_amount = p_fee_amount,
      net_php = p_net_php
    WHERE id = p_monthly_income_id
    RETURNING * INTO income_row;

    UPDATE months SET current_balance = current_balance + COALESCE(p_net_php, 0)
    WHERE id = income_row.month_id;
  ELSE
    -- Undo: remove from balance, clear conversion details
    UPDATE months SET current_balance = current_balance - prev_net
    WHERE id = income_row.month_id;

    UPDATE monthly_income SET
      received = false,
      received_at = NULL,
      exchange_rate = NULL,
      fee_amount = NULL,
      net_php = NULL
    WHERE id = p_monthly_income_id
    RETURNING * INTO income_row;
  END IF;

  RETURN income_row;
END;
$$;

-- Populate monthly_income rows from active income_sources for a month
CREATE OR REPLACE FUNCTION populate_monthly_income(p_user_id uuid, p_month_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  inserted_count int;
BEGIN
  WITH new_income AS (
    INSERT INTO monthly_income (user_id, month_id, income_source_id, expected_amount, currency, conversion_method)
    SELECT
      s.user_id, p_month_id, s.id, s.amount, s.currency, s.conversion_method
    FROM income_sources s
    WHERE s.user_id = p_user_id AND s.active = true
    ON CONFLICT (month_id, income_source_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO inserted_count FROM new_income;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

-- Set search_path for security
ALTER FUNCTION ensure_month_exists(uuid, int, int) SET search_path = public;
ALTER FUNCTION apply_income_received(uuid, boolean, numeric, numeric, numeric) SET search_path = public;
ALTER FUNCTION populate_monthly_income(uuid, uuid) SET search_path = public;

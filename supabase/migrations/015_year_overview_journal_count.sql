-- Migration: 015_year_overview_journal_count
-- Extends get_year_overview RPC to include per-month journal entry count.

-- Drop existing function to replace with extended version (signature unchanged)
DROP FUNCTION IF EXISTS get_year_overview(uuid, integer);

-- Recreate with journal_count added to returned JSON objects
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
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT je.id) AS journal_count
    FROM journal_entries je
    WHERE je.user_id = p_user_id
      AND to_char(je.created_at, 'YYYY-MM') = m.year || '-' || lpad(m.month::text, 2, '0')
  ) jrnl ON true
  CROSS JOIN LATERAL (
    SELECT jsonb_build_object(
      'month', m.year || '-' || lpad(m.month::text, 2, '0'),
      'ending_balance', m.current_balance,
      'starting_balance', m.starting_balance,
      'total_income', inc.total_income,
      'total_expenses', exp.total_expenses,
      'total_oneoff', oneoff.total_oneoff,
      'journal_count', jrnl.journal_count
    ) AS month_summary
  ) summary
  WHERE m.user_id = p_user_id AND m.year = p_year;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Set search_path for security
ALTER FUNCTION get_year_overview(uuid, int) SET search_path = public;

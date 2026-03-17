export interface Month {
  id: string;
  user_id: string;
  year: number;
  month: number;
  starting_balance: number;
  current_balance: number;
  budget_limit: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: 'USD' | 'PHP';
  conversion_method: 'wise' | 'paypal' | 'none';
  payday_day: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyIncome {
  id: string;
  user_id: string;
  month_id: string;
  income_source_id: string;
  expected_amount: number;
  currency: string;
  conversion_method: string;
  exchange_rate: number | null;
  fee_amount: number | null;
  net_php: number | null;
  received: boolean;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRateResult {
  rate: number | null;
  loading: boolean;
  error: string | null;
  fetchedAt: Date | null;
}

// Phase 4: Bills, balance history, one-off income

export type RecurrenceType = 'one_time' | 'recurring_n' | 'recurring_until' | 'ongoing';

export interface BillTemplate {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  recurrence_type: RecurrenceType;
  recurrence_count: number | null;
  recurrence_end: string | null;
  start_month: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBill {
  id: string;
  user_id: string;
  month_id: string;
  bill_template_id: string;
  name: string;
  amount: number;
  due_day: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  bill_templates?: BillTemplate;
}

export interface BalanceChange {
  id: string;
  user_id: string;
  month_id: string;
  old_balance: number;
  new_balance: number;
  delta: number;
  note: string | null;
  created_at: string;
}

export interface OneOffIncome {
  id: string;
  user_id: string;
  month_id: string;
  amount: number;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface MonthSummary {
  month: string;
  ending_balance: number;
  starting_balance: number;
  total_income: number;
  total_expenses: number;
  total_oneoff: number;
}

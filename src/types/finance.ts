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

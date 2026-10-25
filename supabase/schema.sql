-- Created by 11Hopem
-- Copyright (c) 2026 11Hopem. All rights reserved.
-- Licensed under 11Hopem Proprietary License.

-- Supabase PostgreSQL Schema for 11Hopem Finansör (finans-asistani)
-- Manages financial profiles, debts, payoff simulations, and AI advisor logs with PostgreSQL RLS.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Financial Profile Table
CREATE TABLE IF NOT EXISTS public.financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'umut' UNIQUE,
  monthly_net_income NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_net_income >= 0),
  monthly_fixed_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_fixed_expenses >= 0),
  emergency_fund NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (emergency_fund >= 0),
  risk_tolerance TEXT NOT NULL DEFAULT 'BALANCED' CHECK (risk_tolerance IN ('CONSERVATIVE', 'BALANCED', 'AGGRESSIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Debts Registry Table
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'umut',
  name TEXT NOT NULL,
  debt_type TEXT NOT NULL DEFAULT 'CREDIT_CARD' CHECK (debt_type IN ('CREDIT_CARD', 'OVERDRAFT_KMH', 'CONSUMER_LOAN', 'PERSONAL_LOAN', 'OTHER')),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  min_payment NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (min_payment >= 0),
  interest_rate_monthly NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (interest_rate_monthly >= 0),
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  due_day INTEGER DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Debt Payoff Simulations Table
CREATE TABLE IF NOT EXISTS public.debt_payoff_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'umut',
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('AVALANCHE', 'SNOWBALL', 'CONSOLIDATION')),
  total_debt NUMERIC(14, 2) NOT NULL,
  monthly_budget NUMERIC(14, 2) NOT NULL,
  total_interest_paid NUMERIC(14, 2) NOT NULL,
  total_months_to_debt_free INTEGER NOT NULL,
  simulation_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Financial Advisor Queries & Responses Table
CREATE TABLE IF NOT EXISTS public.financial_advisor_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'umut',
  query_text TEXT NOT NULL,
  advisor_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_balance ON public.debts(balance);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.debt_payoff_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON public.financial_advisor_queries(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payoff_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_advisor_queries ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for authenticated and anon roles
CREATE POLICY "Allow anon read financial_profiles" ON public.financial_profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert financial_profiles" ON public.financial_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update financial_profiles" ON public.financial_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete financial_profiles" ON public.financial_profiles FOR DELETE USING (true);

CREATE POLICY "Allow anon read debts" ON public.debts FOR SELECT USING (true);
CREATE POLICY "Allow anon insert debts" ON public.debts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update debts" ON public.debts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete debts" ON public.debts FOR DELETE USING (true);

CREATE POLICY "Allow anon read debt_payoff_simulations" ON public.debt_payoff_simulations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert debt_payoff_simulations" ON public.debt_payoff_simulations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read financial_advisor_queries" ON public.financial_advisor_queries FOR SELECT USING (true);
CREATE POLICY "Allow anon insert financial_advisor_queries" ON public.financial_advisor_queries FOR INSERT WITH CHECK (true);

-- Seed Initial Default Profile for Umut
INSERT INTO public.financial_profiles (user_id, monthly_net_income, monthly_fixed_expenses, emergency_fund, risk_tolerance)
VALUES ('umut', 85000, 32000, 15000, 'BALANCED')
ON CONFLICT (user_id) DO NOTHING;

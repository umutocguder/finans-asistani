/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

/**
 * Standard Supabase PostgREST client for 11Hopem Finansör.
 * Direct PostgreSQL interaction ensuring zero persistent data is locked into browser localStorage.
 */
export class SupabaseService {
  constructor(config = {}) {
    this.url = (
      config.url ||
      (typeof process !== 'undefined' && process.env && (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
      (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_URL) ||
      'https://qvtbbmizjlbzpwsyggkz.supabase.co'
    )?.replace(/\/+$/, '');

    this.key = (
      config.key ||
      (typeof process !== 'undefined' && process.env && (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
      (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) ||
      'sb_publishable_s90uukh_K2TJgtes9BvKlw_CRNrWNfh'
    );

    this.fetchImpl = config.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  }

  isConfigured() {
    return Boolean(this.url && this.key && this.fetchImpl);
  }

  getHeaders(extra = {}) {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  /**
   * Fetch financial profile for user
   */
  async getProfile(userId = 'umut') {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/financial_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`;
    const response = await this.fetchImpl(endpoint, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch financial profile: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Upsert financial profile
   */
  async saveProfile(profile) {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/financial_profiles`;
    const payload = {
      user_id: profile.userId || 'umut',
      monthly_net_income: Number(profile.monthlyNetIncome || 0),
      monthly_fixed_expenses: Number(profile.monthlyFixedExpenses || 0),
      emergency_fund: Number(profile.emergencyFund || 0),
      risk_tolerance: profile.riskTolerance || 'BALANCED',
      updated_at: new Date().toISOString()
    };

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: this.getHeaders({
        Prefer: 'resolution=merge-duplicates,return=representation'
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to save profile: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Fetch active debts for user
   */
  async getDebts(userId = 'umut') {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/debts?user_id=eq.${encodeURIComponent(userId)}&order=interest_rate_monthly.desc&select=*`;
    const response = await this.fetchImpl(endpoint, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch debts: ${response.status} ${errText}`);
    }

    return await response.json();
  }

  /**
   * Create a new debt record
   */
  async createDebt(debt) {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/debts`;
    const payload = {
      user_id: debt.userId || 'umut',
      name: debt.name,
      debt_type: debt.debtType || 'CREDIT_CARD',
      balance: Number(debt.balance || 0),
      min_payment: Number(debt.minPayment || 0),
      interest_rate_monthly: Number(debt.interestRateMonthly || 0),
      is_closed: Boolean(debt.isClosed),
      due_day: Number(debt.dueDay || 1),
      notes: debt.notes || null,
      updated_at: new Date().toISOString()
    };

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: this.getHeaders({
        Prefer: 'return=representation'
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create debt: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Update debt record
   */
  async updateDebt(id, updates) {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/debts?id=eq.${encodeURIComponent(id)}`;
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const response = await this.fetchImpl(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders({
        Prefer: 'return=representation'
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update debt ${id}: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Delete debt record
   */
  async deleteDebt(id) {
    if (!this.isConfigured()) {
      throw new Error('Supabase client is not configured with URL and Key.');
    }

    const endpoint = `${this.url}/rest/v1/debts?id=eq.${encodeURIComponent(id)}`;
    const response = await this.fetchImpl(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to delete debt ${id}: ${response.status} ${errText}`);
    }

    return true;
  }

  /**
   * Record payoff simulation result
   */
  async recordSimulation(simulation) {
    if (!this.isConfigured()) return null;

    try {
      const endpoint = `${this.url}/rest/v1/debt_payoff_simulations`;
      const response = await this.fetchImpl(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_id: simulation.userId || 'umut',
          strategy_type: simulation.strategyType,
          total_debt: Number(simulation.totalDebt || 0),
          monthly_budget: Number(simulation.monthlyBudget || 0),
          total_interest_paid: Number(simulation.totalInterestPaid || 0),
          total_months_to_debt_free: Number(simulation.totalMonths || 0),
          simulation_payload: simulation.payload || {}
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Record advisory question and response
   */
  async recordAdvisorQuery(queryText, advisorResponse) {
    if (!this.isConfigured()) return null;

    try {
      const endpoint = `${this.url}/rest/v1/financial_advisor_queries`;
      const response = await this.fetchImpl(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_id: 'umut',
          query_text: queryText,
          advisor_response: advisorResponse || {}
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

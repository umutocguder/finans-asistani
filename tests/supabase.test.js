/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseService } from '../src/services/supabaseService.js';

describe('SupabaseService: Backend Persistence & RLS Integration', () => {
  it('Initializes with default configuration or environment overrides', () => {
    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'sb_test_key_123',
      fetch: async () => ({ ok: true, json: async () => [] })
    });

    assert.equal(service.isConfigured(), true);
    assert.equal(service.url, 'https://test-project.supabase.co');
    assert.equal(service.key, 'sb_test_key_123');
  });

  it('Generates correct PostgREST authorization headers', () => {
    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'test_token_xyz',
      fetch: async () => ({})
    });

    const headers = service.getHeaders({ 'Custom-Header': 'val' });
    assert.equal(headers.apikey, 'test_token_xyz');
    assert.equal(headers.Authorization, 'Bearer test_token_xyz');
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(headers['Custom-Header'], 'val');
  });

  it('Performs getProfile query to financial_profiles table', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    const mockFetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        json: async () => [{
          id: 'test-uuid-1',
          user_id: 'umut',
          monthly_net_income: 85000,
          monthly_fixed_expenses: 32000,
          emergency_fund: 15000,
          risk_tolerance: 'BALANCED'
        }]
      };
    };

    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'sb_key',
      fetch: mockFetch
    });

    const profile = await service.getProfile('umut');
    assert.equal(capturedMethod, 'GET');
    assert.match(capturedUrl, /financial_profiles\?user_id=eq\.umut/);
    assert.equal(profile.monthly_net_income, 85000);
    assert.equal(profile.user_id, 'umut');
  });

  it('Upserts financial profile payload into financial_profiles', async () => {
    let capturedBody = '';
    let capturedPrefer = '';

    const mockFetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      capturedPrefer = options.headers.Prefer;
      return {
        ok: true,
        json: async () => [capturedBody]
      };
    };

    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'sb_key',
      fetch: mockFetch
    });

    const res = await service.saveProfile({
      userId: 'umut',
      monthlyNetIncome: 95000,
      monthlyFixedExpenses: 30000,
      emergencyFund: 20000,
      riskTolerance: 'CONSERVATIVE'
    });

    assert.equal(res.monthly_net_income, 95000);
    assert.equal(capturedPrefer.includes('resolution=merge-duplicates'), true);
  });

  it('Performs debt CRUD operations (get, create, update, delete)', async () => {
    const history = [];

    const mockFetch = async (url, options) => {
      history.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : null });
      if (options.method === 'GET') {
        return { ok: true, json: async () => [{ id: 'd-1', name: 'Kart 1', balance: 25000 }] };
      }
      if (options.method === 'POST') {
        return { ok: true, json: async () => [{ id: 'd-2', name: 'KMH', balance: 10000 }] };
      }
      if (options.method === 'PATCH') {
        return { ok: true, json: async () => [{ id: 'd-1', name: 'Kart 1', balance: 20000 }] };
      }
      if (options.method === 'DELETE') {
        return { ok: true, text: async () => '' };
      }
      return { ok: true, json: async () => [] };
    };

    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'sb_key',
      fetch: mockFetch
    });

    // 1. Get
    const debts = await service.getDebts('umut');
    assert.equal(debts.length, 1);
    assert.equal(history[0].method, 'GET');

    // 2. Create
    const created = await service.createDebt({ name: 'KMH', balance: 10000, minPayment: 10000, interestRateMonthly: 5 });
    assert.equal(created.name, 'KMH');
    assert.equal(history[1].method, 'POST');

    // 3. Update
    const updated = await service.updateDebt('d-1', { balance: 20000 });
    assert.equal(updated.balance, 20000);
    assert.equal(history[2].method, 'PATCH');

    // 4. Delete
    const deleted = await service.deleteDebt('d-1');
    assert.equal(deleted, true);
    assert.equal(history[3].method, 'DELETE');
  });

  it('Throws descriptive errors when Supabase returns HTTP error responses', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key or unauthorized'
    });

    const service = new SupabaseService({
      url: 'https://test-project.supabase.co',
      key: 'wrong_key',
      fetch: mockFetch
    });

    await assert.rejects(
      async () => await service.getProfile('umut'),
      /Failed to fetch financial profile: 401 Invalid API key/
    );
  });
});

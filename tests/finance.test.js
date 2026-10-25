/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DebtEngine } from '../src/engines/debtEngine.js';
import { LoanAdvisorEngine } from '../src/engines/loanAdvisorEngine.js';
import { InvestmentEngine } from '../src/engines/investmentEngine.js';
import { FinanceAdvisorEngine } from '../src/engines/financeAdvisorEngine.js';
import { BackupService } from '../src/services/backupService.js';
import { TelemetryService } from '../src/telemetry/telemetryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Test 1: Debt Repayment Engine
test('DebtEngine: Verify Avalanche and Snowball payoff mechanics and consolidation', () => {
  const sampleDebts = [
    { id: '1', name: 'Kredi Kartı A', balance: 30000, minPayment: 6000, interestRateMonthly: 4.5 },
    { id: '2', name: 'İhtiyaç Kredisi', balance: 80000, minPayment: 5500, interestRateMonthly: 3.1 },
    { id: '3', name: 'KMH / Ek Hesap', balance: 15000, minPayment: 15000, interestRateMonthly: 5.0 }
  ];

  const avalanche = DebtEngine.calculateAvalanche(sampleDebts, 10000);
  assert.strictEqual(avalanche.strategy, 'Avalanche');
  assert.ok(avalanche.totalMonths > 0 && avalanche.totalMonths < 24);
  assert.strictEqual(avalanche.priorityOrder[0], 'KMH / Ek Hesap'); // Highest interest first

  const snowball = DebtEngine.calculateSnowball(sampleDebts, 10000);
  assert.strictEqual(snowball.strategy, 'Snowball');
  assert.strictEqual(snowball.priorityOrder[0], 'KMH / Ek Hesap'); // Lowest balance first among 15k vs 30k vs 80k

  const consolidation = DebtEngine.evaluateConsolidation(sampleDebts, 2.9, 24);
  assert.strictEqual(consolidation.totalDebtToConsolidate, 125000);
  assert.ok(consolidation.newMonthlyPayment > 0);
  assert.ok(typeof consolidation.isBeneficial === 'boolean');
});

// Test 2: Loan Timing and DTI Advisor
test('LoanAdvisorEngine: Evaluate DTI calculation and loan timing safety rules', () => {
  const healthyDti = LoanAdvisorEngine.calculateDTI(100000, 25000);
  assert.strictEqual(healthyDti.ratioPercent, 25);
  assert.strictEqual(healthyDti.tier, 'HEALTHY');

  const criticalDti = LoanAdvisorEngine.calculateDTI(50000, 32000);
  assert.strictEqual(criticalDti.ratioPercent, 64);
  assert.strictEqual(criticalDti.tier, 'CRITICAL');

  // Evaluate Timing: Borrowing for luxury consumption with negative cashflow
  const badDecision = LoanAdvisorEngine.evaluateLoanTiming({
    monthlyNetIncome: 60000,
    monthlyFixedExpenses: 40000,
    currentMonthlyDebtPayments: 18000,
    emergencyFundBalance: 5000,
    loanPurpose: 'CONSUMPTION',
    proposedMonthlyPayment: 10000
  });
  assert.strictEqual(badDecision.shouldBorrow, false);
  assert.strictEqual(badDecision.recommendation, 'KREDİ ÇEKİLMESİ UYGUN DEĞİL');

  // Evaluate Timing: Borrowing for debt consolidation
  const goodDecision = LoanAdvisorEngine.evaluateLoanTiming({
    monthlyNetIncome: 120000,
    monthlyFixedExpenses: 40000,
    currentMonthlyDebtPayments: 20000,
    emergencyFundBalance: 150000,
    loanPurpose: 'DEBT_CONSOLIDATION',
    proposedMonthlyPayment: 15000
  });
  assert.strictEqual(goodDecision.shouldBorrow, true);
  assert.strictEqual(goodDecision.recommendation, 'KREDİ ÇEKİLEBİLİR');
});

// Test 3: Investment and Debt vs Investing Trade-Off
test('InvestmentEngine: Validate debt payoff vs investment return and asset allocation', () => {
  // Toxic debt (70% APR) should always be paid before investing
  const toxicCheck = InvestmentEngine.evaluateDebtVsInvestment(70, 45, 3);
  assert.strictEqual(toxicCheck.priority, 'PAY_OFF_TOXIC_DEBT');

  // Allocation with toxic debt should focus on debt clearing
  const debtAllocation = InvestmentEngine.recommendAssetAllocation('BALANCED', true);
  assert.strictEqual(debtAllocation.strategyName, 'Borç Temizleme & Likidite Kalkanı');
  assert.strictEqual(debtAllocation.allocations[0].percent, 70);

  // Allocation with zero toxic debt
  const cleanAllocation = InvestmentEngine.recommendAssetAllocation('BALANCED', false);
  assert.strictEqual(cleanAllocation.strategyName, 'Dengeli & Çeşitlendirilmiş Servet Sepeti');
  const totalPercent = cleanAllocation.allocations.reduce((s, a) => s + a.percent, 0);
  assert.strictEqual(totalPercent, 100);
});

// Test 4: Comprehensive AI Financial Advisor
test('FinanceAdvisorEngine: Generate health diagnostic and answer specific user questions', () => {
  const profile = {
    monthlyNetIncome: 90000,
    monthlyFixedExpenses: 35000,
    emergencyFund: 40000,
    debts: [
      { id: '1', name: 'Kredi Kartı', balance: 45000, minPayment: 9000, interestRateMonthly: 4.5 }
    ]
  };

  const report = FinanceAdvisorEngine.generateFinancialHealthReport(profile);
  assert.ok(report.summary.freeCashflow > 0);
  assert.ok(report.actionPlan.length >= 2);

  // Test question 1: Ne zaman kredi çekmeliyim?
  const loanAns = FinanceAdvisorEngine.answerUserQuery('Ne zaman kredi çekmeliyim?', profile);
  assert.strictEqual(loanAns.topic, 'LOAN_DECISION');

  // Test question 2: Borçlarımı nasıl kapatmalıyım?
  const debtAns = FinanceAdvisorEngine.answerUserQuery('Borçlarımı nasıl kapatayım?', profile);
  assert.strictEqual(debtAns.topic, 'DEBT_PAYOFF');

  // Test question 3: Neye nasıl yatırım yapmalıyım?
  const investAns = FinanceAdvisorEngine.answerUserQuery('Paramla neye nasıl yatırım yapmalıyım?', profile);
  assert.strictEqual(investAns.topic, 'INVESTMENT_STRATEGY');
});

// Test 5: Backup and Data Custody
test('BackupService: Verify cryptographic backup creation and verification', () => {
  const testData = { userId: 'umut-personal', timestamp: Date.now(), totalAssets: 100000 };
  const backup = BackupService.createBackup(testData);

  assert.ok(backup.success);
  assert.ok(fs.existsSync(backup.targetPath));
  assert.strictEqual(BackupService.verifyBackup(backup.targetPath), true);
});

// Test 6: Zero PII Telemetry Scrubbing
test('TelemetryService: Ensure PII and financial numbers are never leaked in logs', () => {
  const dirty = {
    userId: 'umut',
    incomeAmount: 95000,
    creditCardBalance: 40000,
    action: 'button_click'
  };
  const cleaned = TelemetryService.scrubSensitiveData(dirty);
  assert.strictEqual(cleaned.action, 'button_click');
  assert.strictEqual(cleaned.incomeAmount, '[REDACTED_FINANCIAL]');
  assert.strictEqual(cleaned.creditCardBalance, '[REDACTED_FINANCIAL]');
});

// Test 7: Brand Identity and Asset Integrity
test('Branding: Verify 1:1 Favicon, Logo assets, and 11Hopem compliance', () => {
  const files = [
    'assets/logo.svg',
    'public/logo.svg',
    'public/favicon.svg',
    'public/favicon.ico',
    'public/apple-touch-icon.png',
    'public/og-image.png'
  ];

  for (const f of files) {
    const fullPath = path.join(ROOT_DIR, f);
    assert.ok(fs.existsSync(fullPath), `Asset must exist: ${f}`);
    assert.ok(fs.statSync(fullPath).size > 0);
  }
});

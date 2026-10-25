/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

/**
 * Calculates debt repayment schedule using Avalanche (Highest Interest First)
 * and Snowball (Lowest Balance First) methodologies.
 */
export class DebtEngine {
  /**
   * Calculate Avalanche (Highest Interest Rate First) payoff schedule
   * @param {Array} debts - List of debt objects { id, name, balance, minPayment, interestRateMonthly }
   * @param {number} extraMonthlyBudget - Extra cash dedicated to debt payoff each month
   * @returns {Object} Analysis including total months, total interest paid, payoff order
   */
  static calculateAvalanche(debts, extraMonthlyBudget = 0) {
    if (!debts || debts.length === 0) {
      return { totalMonths: 0, totalInterestPaid: 0, strategy: 'Avalanche', schedules: [] };
    }

    // Clone debts to avoid mutation
    const activeDebts = debts.map(d => ({
      ...d,
      currentBalance: Number(d.balance),
      minPayment: Number(d.minPayment),
      monthlyRate: Number(d.interestRateMonthly) / 100
    })).filter(d => d.currentBalance > 0);

    // Sort descending by monthly interest rate
    activeDebts.sort((a, b) => b.monthlyRate - a.monthlyRate);

    let totalMonths = 0;
    let totalInterestPaid = 0;
    const maxMonths = 360; // 30-year safety ceiling

    while (activeDebts.some(d => d.currentBalance > 0) && totalMonths < maxMonths) {
      totalMonths++;
      let extraAvailable = extraMonthlyBudget;

      // 1. Accrue monthly interest & pay minimums
      for (const debt of activeDebts) {
        if (debt.currentBalance > 0) {
          const interest = debt.currentBalance * debt.monthlyRate;
          totalInterestPaid += interest;
          debt.currentBalance += interest;

          const payment = Math.min(debt.minPayment, debt.currentBalance);
          debt.currentBalance -= payment;
        }
      }

      // 2. Apply extra budget to highest interest debt
      for (const debt of activeDebts) {
        if (debt.currentBalance > 0 && extraAvailable > 0) {
          const extraPayment = Math.min(extraAvailable, debt.currentBalance);
          debt.currentBalance -= extraPayment;
          extraAvailable -= extraPayment;
        }
      }
    }

    return {
      strategy: 'Avalanche',
      totalMonths,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      priorityOrder: activeDebts.map(d => d.name)
    };
  }

  /**
   * Calculate Snowball (Lowest Balance First) payoff schedule
   * @param {Array} debts - List of debt objects
   * @param {number} extraMonthlyBudget - Extra cash dedicated to debt payoff
   * @returns {Object}
   */
  static calculateSnowball(debts, extraMonthlyBudget = 0) {
    if (!debts || debts.length === 0) {
      return { totalMonths: 0, totalInterestPaid: 0, strategy: 'Snowball', schedules: [] };
    }

    const activeDebts = debts.map(d => ({
      ...d,
      currentBalance: Number(d.balance),
      minPayment: Number(d.minPayment),
      monthlyRate: Number(d.interestRateMonthly) / 100
    })).filter(d => d.currentBalance > 0);

    // Sort ascending by balance
    activeDebts.sort((a, b) => a.currentBalance - b.currentBalance);

    let totalMonths = 0;
    let totalInterestPaid = 0;
    const maxMonths = 360;

    while (activeDebts.some(d => d.currentBalance > 0) && totalMonths < maxMonths) {
      totalMonths++;
      let extraAvailable = extraMonthlyBudget;

      for (const debt of activeDebts) {
        if (debt.currentBalance > 0) {
          const interest = debt.currentBalance * debt.monthlyRate;
          totalInterestPaid += interest;
          debt.currentBalance += interest;

          const payment = Math.min(debt.minPayment, debt.currentBalance);
          debt.currentBalance -= payment;
        }
      }

      for (const debt of activeDebts) {
        if (debt.currentBalance > 0 && extraAvailable > 0) {
          const extraPayment = Math.min(extraAvailable, debt.currentBalance);
          debt.currentBalance -= extraPayment;
          extraAvailable -= extraPayment;
        }
      }
    }

    return {
      strategy: 'Snowball',
      totalMonths,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      priorityOrder: activeDebts.map(d => d.name)
    };
  }

  /**
   * Evaluate Debt Consolidation feasibility
   * @param {Array} debts - Current active debts
   * @param {number} consolidationRateMonthly - Proposed single loan monthly interest rate
   * @param {number} termMonths - Proposed loan term in months
   */
  static evaluateConsolidation(debts, consolidationRateMonthly, termMonths = 24) {
    const totalBalance = debts.reduce((sum, d) => sum + Number(d.balance), 0);
    const currentTotalMinPayment = debts.reduce((sum, d) => sum + Number(d.minPayment), 0);

    if (totalBalance <= 0 || consolidationRateMonthly <= 0) {
      return { isBeneficial: false, savings: 0, newMonthlyPayment: 0 };
    }

    const r = consolidationRateMonthly / 100;
    // Loan payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + r, termMonths);
    const newMonthlyPayment = totalBalance * ((r * factor) / (factor - 1));
    const totalConsolidationPaid = newMonthlyPayment * termMonths;

    // Estimate current interest using weighted average monthly rate
    const weightedRate = debts.reduce((sum, d) => sum + (Number(d.balance) * (Number(d.interestRateMonthly) / 100)), 0) / totalBalance;
    const currentEstTotalInterest = totalBalance * weightedRate * termMonths;
    const currentTotalPaid = totalBalance + currentEstTotalInterest;

    const savings = currentTotalPaid - totalConsolidationPaid;

    return {
      totalDebtToConsolidate: Math.round(totalBalance),
      currentMonthlyBurden: Math.round(currentTotalMinPayment),
      newMonthlyPayment: Math.round(newMonthlyPayment),
      monthlyBurdenReduction: Math.round(currentTotalMinPayment - newMonthlyPayment),
      termMonths,
      estimatedTotalSavings: Math.round(savings),
      isBeneficial: savings > 0 && (newMonthlyPayment < currentTotalMinPayment)
    };
  }
}

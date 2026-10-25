/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

/**
 * Evaluates credit loan eligibility, timing, debt-to-income (DTI) ratios,
 * and financial health rules for taking personal or commercial loans.
 */
export class LoanAdvisorEngine {
  /**
   * Calculate Debt-To-Income (DTI) ratio
   * @param {number} monthlyNetIncome - Net take-home income per month
   * @param {number} monthlyDebtPayments - Sum of all monthly loan and debt minimums
   * @returns {Object} DTI percentage and risk tier
   */
  static calculateDTI(monthlyNetIncome, monthlyDebtPayments) {
    if (!monthlyNetIncome || monthlyNetIncome <= 0) {
      return { ratioPercent: 100, tier: 'CRITICAL', label: 'Aşırı Yüksek Risk' };
    }

    const ratio = (monthlyDebtPayments / monthlyNetIncome) * 100;
    const rounded = Math.round(ratio * 10) / 10;

    let tier = 'HEALTHY';
    let label = 'Sağlıklı Borçluluk Seviyesi';
    let maxSafeNewPayment = Math.max(0, (monthlyNetIncome * 0.40) - monthlyDebtPayments);

    if (rounded > 50) {
      tier = 'CRITICAL';
      label = 'Kritik Borç Yükü (Kredi Çekilmemeli)';
      maxSafeNewPayment = 0;
    } else if (rounded > 35) {
      tier = 'MODERATE';
      label = 'Orta Risk (Yalnızca Konsolidasyon / Borç Kapatma Amaçlı)';
    }

    return {
      ratioPercent: rounded,
      tier,
      label,
      maxSafeNewPayment: Math.round(maxSafeNewPayment)
    };
  }

  /**
   * Evaluate whether the user should take a new loan right now
   * @param {Object} params
   * @param {number} params.monthlyNetIncome
   * @param {number} params.monthlyFixedExpenses
   * @param {number} params.currentMonthlyDebtPayments
   * @param {number} params.emergencyFundBalance
   * @param {string} params.loanPurpose - 'DEBT_CONSOLIDATION', 'EMERGENCY', 'INVESTMENT', 'CONSUMPTION'
   * @param {number} params.proposedLoanAmount
   * @param {number} params.proposedMonthlyPayment
   * @returns {Object} Decision, score (0-100), detailed rules triggered
   */
  static evaluateLoanTiming(params) {
    const {
      monthlyNetIncome = 0,
      monthlyFixedExpenses = 0,
      currentMonthlyDebtPayments = 0,
      emergencyFundBalance = 0,
      loanPurpose = 'DEBT_CONSOLIDATION',
      proposedMonthlyPayment = 0
    } = params;

    const freeCashflow = monthlyNetIncome - monthlyFixedExpenses - currentMonthlyDebtPayments;
    const postLoanFreeCashflow = freeCashflow - proposedMonthlyPayment;
    const dtiResult = this.calculateDTI(monthlyNetIncome, currentMonthlyDebtPayments + proposedMonthlyPayment);
    const monthsOfEmergencyCovered = monthlyFixedExpenses > 0 ? emergencyFundBalance / monthlyFixedExpenses : 0;

    const rules = [];
    let score = 100;

    // Rule 1: Purpose Filter
    if (loanPurpose === 'CONSUMPTION') {
      score -= 40;
      rules.push({
        status: 'WARNING',
        code: 'PURPOSE_CONSUMPTION',
        message: 'Tüketim (tatil, lüks, elektronik) için kredi çekmek servet eritir. Önerilmez.'
      });
    } else if (loanPurpose === 'DEBT_CONSOLIDATION') {
      score += 15;
      rules.push({
        status: 'FAVORABLE',
        code: 'PURPOSE_CONSOLIDATION',
        message: 'Dağınık yüksek faizli borçları tek uygun oranlı kredide toplamak nakit akışını rahatlatır.'
      });
    }

    // Rule 2: Free Cashflow Sustainability
    if (postLoanFreeCashflow < 0) {
      score -= 50;
      rules.push({
        status: 'DANGER',
        code: 'NEGATIVE_CASHFLOW',
        message: `Kredi taksiti sonrası aylık bütçeniz ${Math.round(Math.abs(postLoanFreeCashflow))} ₺ eksiye düşecektir. Borç sarmalı riski!`
      });
    } else if (postLoanFreeCashflow < monthlyNetIncome * 0.15) {
      score -= 20;
      rules.push({
        status: 'WARNING',
        code: 'TIGHT_CASHFLOW',
        message: 'Taksit ödendikten sonra kalan nakit payınız %15 altına inmektedir. Beklenmedik giderlerde zorlanabilirsiniz.'
      });
    }

    // Rule 3: DTI Ceiling
    if (dtiResult.tier === 'CRITICAL') {
      score -= 35;
      rules.push({
        status: 'DANGER',
        code: 'DTI_EXCEEDED',
        message: `Toplam borç/gelir oranınız %${dtiResult.ratioPercent} seviyesine çıkacaktır. Banka ret veya aşırı yüksek faiz riski!`
      });
    }

    // Rule 4: Emergency Cushion
    if (monthsOfEmergencyCovered < 1) {
      score -= 15;
      rules.push({
        status: 'WARNING',
        code: 'NO_EMERGENCY_FUND',
        message: 'En az 1-3 aylık acil durum nakit tamponunuz bulunmuyor.'
      });
    }

    score = Math.max(0, Math.min(100, score));
    const shouldBorrow = score >= 65 && postLoanFreeCashflow >= 0;

    return {
      recommendation: shouldBorrow ? 'KREDİ ÇEKİLEBİLİR' : 'KREDİ ÇEKİLMESİ UYGUN DEĞİL',
      shouldBorrow,
      healthScore: score,
      freeCashflowBefore: Math.round(freeCashflow),
      freeCashflowAfter: Math.round(postLoanFreeCashflow),
      projectedDtiPercent: dtiResult.ratioPercent,
      emergencyMonths: Math.round(monthsOfEmergencyCovered * 10) / 10,
      rules
    };
  }
}

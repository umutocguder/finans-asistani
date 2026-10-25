/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

import { DebtEngine } from './debtEngine.js';
import { LoanAdvisorEngine } from './loanAdvisorEngine.js';
import { InvestmentEngine } from './investmentEngine.js';

/**
 * High-level AI Financial Advisor that synthesizes debt, loan, and investment engines
 * to provide contextual, mathematical financial recommendations.
 */
export class FinanceAdvisorEngine {
  /**
   * Produce comprehensive diagnostic overview of the user's finances
   * @param {Object} profile - User's financial state
   * @returns {Object} Comprehensive advisory report
   */
  static generateFinancialHealthReport(profile) {
    const {
      monthlyNetIncome = 0,
      monthlyFixedExpenses = 0,
      debts = [],
      emergencyFund = 0,
      savingsInvestments = 0,
      riskTolerance = 'BALANCED'
    } = profile;

    const totalDebtBalance = debts.reduce((sum, d) => sum + Number(d.balance || 0), 0);
    const totalMonthlyDebtPayments = debts.reduce((sum, d) => sum + Number(d.minPayment || 0), 0);
    const freeCashflow = monthlyNetIncome - monthlyFixedExpenses - totalMonthlyDebtPayments;

    // Highest interest rate calculation
    const maxMonthlyRate = debts.length > 0 ? Math.max(...debts.map(d => Number(d.interestRateMonthly || 0))) : 0;
    const maxAnnualRate = Math.round(maxMonthlyRate * 12 * 1.35 * 10) / 10; // Compound approximation
    const hasToxicDebt = maxMonthlyRate >= 3.5;

    // Debt schedules
    const avalanche = DebtEngine.calculateAvalanche(debts, Math.max(0, freeCashflow));
    const snowball = DebtEngine.calculateSnowball(debts, Math.max(0, freeCashflow));
    const consolidation = DebtEngine.evaluateConsolidation(debts, 3.2, 24);

    // DTI and Loan Timing
    const dtiResult = LoanAdvisorEngine.calculateDTI(monthlyNetIncome, totalMonthlyDebtPayments);
    const emergencyMonths = monthlyFixedExpenses > 0 ? Math.round((emergencyFund / monthlyFixedExpenses) * 10) / 10 : 0;

    // Debt vs Investment priority
    const debtVsInvest = InvestmentEngine.evaluateDebtVsInvestment(maxAnnualRate, 45, emergencyMonths);
    const assetAllocation = InvestmentEngine.recommendAssetAllocation(riskTolerance, hasToxicDebt);

    // Primary Action Items
    const actionPlan = [];

    if (hasToxicDebt) {
      actionPlan.push({
        priority: 1,
        title: 'Zehirli Faizli Borçları (Kredi Kartı / KMH) Acil Erteleme / Kapatma',
        desc: `Aylık %${maxMonthlyRate} (yıllık bileşik ~%${maxAnnualRate}) faizli borçlarınızı Çığ Yöntemiyle (Avalanche) en yüksek faizliden başlayarak sıfırlayın.`,
        badge: 'Acil Öncelik'
      });
    }

    if (emergencyMonths < 3) {
      actionPlan.push({
        priority: 2,
        title: '3 Aylık Acil Durum Likidite Tamponu Kurulumu',
        desc: `Mevcut acil fonunuz ${emergencyMonths} aylık masrafı karşılıyor. Hedef en az ${Math.round(monthlyFixedExpenses * 3)} ₺ olmalıdır (Para Piyasası Fonunda tutulmalı).`,
        badge: 'Güvenlik Kalkanı'
      });
    }

    if (consolidation.isBeneficial) {
      actionPlan.push({
        priority: 3,
        title: 'Borç Konsolidasyonu / Refinansman Fırsatı',
        desc: `Dağınık borçlarınızı tek bir uygun oranlı tüketici kredisinde toplarsanız aylık nakit yükünüz ${consolidation.monthlyBurdenReduction} ₺ azalabilir.`,
        badge: 'Tasarruf Fırsatı'
      });
    }

    actionPlan.push({
      priority: 4,
      title: 'Kademeli Portföy & Altın/Fon Yatırımı',
      desc: `Borç ödemelerinden arta kalan nakitle her ay düzenli kademeli alım (DCA) yaparak enflasyon kalkanı oluşturun.`,
      badge: 'Gelecek İnşası'
    });

    return {
      summary: {
        monthlyNetIncome,
        monthlyFixedExpenses,
        totalDebtBalance,
        totalMonthlyDebtPayments,
        freeCashflow,
        emergencyMonths,
        savingsInvestments,
        dtiPercent: dtiResult.ratioPercent,
        dtiTier: dtiResult.tier,
        dtiLabel: dtiResult.label
      },
      strategies: {
        avalanche,
        snowball,
        consolidation
      },
      investmentRecommendation: {
        debtVsInvest,
        assetAllocation
      },
      actionPlan
    };
  }

  /**
   * Process a direct financial question or prompt from the user
   * @param {string} prompt - User query in Turkish or English
   * @param {Object} profile - User's current financial profile
   * @returns {Object} Structured recommendation answer
   */
  static answerUserQuery(prompt, profile) {
    const p = (prompt || '').toLowerCase();
    const report = this.generateFinancialHealthReport(profile);
    const { summary, strategies, investmentRecommendation } = report;

    // Topic 1: When should I take a loan?
    if (p.includes('kredi') && (p.includes('ne zaman') || p.includes('çekmeli') || p.includes('çekeyim'))) {
      if (summary.dtiPercent > 50) {
        return {
          topic: 'LOAN_DECISION',
          title: 'Şu Anda Yeni Kredi Çekilmesi Uygun Değil (Kritik Risk)',
          advice: `Borç/Gelir oranınız %${summary.dtiPercent} seviyesindedir. Tüketim veya harcama amacıyla kesinlikle yeni kredi çekmemelisiniz. Yalnızca mevcut dağınık borçları kapatacak 'Borç Kapatma / Transfer Kredisi' koşulları incelenmelidir.`,
          keyMetrics: { dti: summary.dtiPercent, freeCashflow: summary.freeCashflow }
        };
      }

      if (strategies.consolidation.isBeneficial) {
        return {
          topic: 'LOAN_DECISION',
          title: 'Kredi Çekme Zamanı: Sadece Borç Konsolidasyonu İçin Uygun',
          advice: `Dağınık kredi kartı ve KMH faizleriniz yerine aylık %3.2 veya altı oranla ${strategies.consolidation.termMonths} ay vadeli konsolidasyon kredisi çekerseniz aylık bütçeniz ${strategies.consolidation.monthlyBurdenReduction} ₺ rahatlayacaktır.`,
          keyMetrics: { potentialSavings: strategies.consolidation.estimatedTotalSavings }
        };
      }

      return {
        topic: 'LOAN_DECISION',
        title: 'Nakit Akışınız Dengeli, Kredi İhtiyacı Duruma Bağlı',
        advice: `Aylık serbest nakit fazlanız ${summary.freeCashflow} ₺ düzeyindedir. Kredi yalnızca gelir getirecek bir yatırım veya zorunlu bir sermaye ihtiyacı için çekilebilir; tüketim için çekilmemelidir.`,
        keyMetrics: { freeCashflow: summary.freeCashflow }
      };
    }

    // Topic 2: How to pay off debts?
    if (p.includes('borç') && (p.includes('kapa') || p.includes('nasıl') || p.includes('öde'))) {
      return {
        topic: 'DEBT_PAYOFF',
        title: 'Önerilen Strateji: Çığ Yöntemi (Avalanche Strategy)',
        advice: `Matematiksel olarak en az faiz ödeyeceğiniz yöntem en yüksek faiz oranlı borcu ilk sıraya almaktır. Önce kredi kartı ve KMH'ları asgarisini ödemek yerine sıfırlayın. Toplam ${strategies.avalanche.totalMonths} ayda tüm borçlarınız kapanabilir.`,
        priorityOrder: strategies.avalanche.priorityOrder,
        totalInterestToPay: strategies.avalanche.totalInterestPaid
      };
    }

    // Topic 3: Where to invest?
    if (p.includes('yatırım') || p.includes('altın') || p.includes('hisse') || p.includes('fon')) {
      return {
        topic: 'INVESTMENT_STRATEGY',
        title: investmentRecommendation.debtVsInvest.action,
        advice: investmentRecommendation.debtVsInvest.explanation,
        allocations: investmentRecommendation.assetAllocation.allocations
      };
    }

    // Default: General health and next action
    return {
      topic: 'GENERAL_ADVICE',
      title: '11Hopem Finansör: Finansal Durum Değerlendirmesi',
      advice: `Aylık serbest nakdiniz ${summary.freeCashflow} ₺. Borç/gelir oranınız %${summary.dtiPercent} (${summary.dtiLabel}). Önceliğiniz yüksek faizli borçları eritmek ve 3 aylık acil durum fonu oluşturmaktır.`,
      actionPlan: report.actionPlan
    };
  }
}

/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

/**
 * Investment Strategy & Asset Allocation Engine.
 * Evaluates debt payoff vs investment trade-offs, emergency fund sizing,
 * and prudent asset diversification models.
 */
export class InvestmentEngine {
  /**
   * Determine whether available surplus cash should go to Debt Payoff or Investing
   * @param {number} highestDebtAnnualRate - Highest APR among active debts (e.g. 70 for 70%)
   * @param {number} expectedInvestmentAnnualReturn - Expected average return of investment (e.g. 45 for 45%)
   * @param {number} emergencyFundMonths - Current months of living expenses saved
   * @returns {Object} Recommendation and mathematical breakdown
   */
  static evaluateDebtVsInvestment(highestDebtAnnualRate, expectedInvestmentAnnualReturn = 45, emergencyFundMonths = 0) {
    // Stage 1: Absolute Emergency Cushion Check
    if (emergencyFundMonths < 1) {
      return {
        priority: 'EMERGENCY_FUND_FIRST',
        action: 'Önce Acil Durum Fonu Oluştur',
        explanation: 'En az 1-3 aylık temel yaşam masrafı nakit/para piyasası fonunda güvenceye alınmadan yatırım yapmak olası bir krizde borçlanmaya zorlar.',
        rateSpread: 0
      };
    }

    // Stage 2: Cost of Debt vs Return Spread
    const spread = highestDebtAnnualRate - expectedInvestmentAnnualReturn;

    if (highestDebtAnnualRate >= 40) {
      return {
        priority: 'PAY_OFF_TOXIC_DEBT',
        action: 'Öncelik: Yüksek Faizli Borcu Kapat',
        explanation: `Mevcut kredi kartı / KMH borcunuz yıllık ~%${highestDebtAnnualRate} faizle işlemektedir. Bu borcu kapatmak %100 risksiz ve garantili %${highestDebtAnnualRate} kâr etmekle eşdeğerdir. Hiçbir yasal borsa veya fon bu oranda garantili getiri sağlayamaz!`,
        rateSpread: Math.round(spread * 10) / 10
      };
    }

    if (spread > 5) {
      return {
        priority: 'DEBT_PAYOFF_PREFERRED',
        action: 'Borç Kapatma Ağırlıklı Strateji',
        explanation: 'Borç faiziniz beklenen yatırım getirisinden yüksektir. Fazla nakdin %70\'i ile borç eritin, %30\'u ile kademeli yatırım yapın.',
        rateSpread: Math.round(spread * 10) / 10
      };
    }

    return {
      priority: 'BALANCED_INVESTING',
      action: 'Dengeli Portföy Yatırımı & Minimum Borç Ödemesi',
      explanation: 'Borç maliyetiniz kontrol altında ve enflasyonun altındadır. Sabit borç taksitlerini öderken düzenli nakit fazlasıyla çeşitlendirilmiş yatırım sepetine yönelebilirsiniz.',
      rateSpread: Math.round(spread * 10) / 10
    };
  }

  /**
   * Generate an asset allocation model based on user risk tolerance and debt health
   * @param {string} riskProfile - 'CONSERVATIVE', 'BALANCED', 'GROWTH'
   * @param {boolean} hasHighInterestDebt - Whether user carries high interest debt
   * @returns {Object} Target asset allocation percentages
   */
  static recommendAssetAllocation(riskProfile = 'BALANCED', hasHighInterestDebt = false) {
    if (hasHighInterestDebt) {
      return {
        strategyName: 'Borç Temizleme & Likidite Kalkanı',
        allocations: [
          { asset: 'Yüksek Faizli Borç Kapatma', percent: 70, color: '#EF4444', description: 'Garantili yüksek getiri' },
          { asset: 'Para Piyasası Fonu / Likit Altın', percent: 20, color: '#10B981', description: 'Acil durum nakit tamponu' },
          { asset: 'Hisse & Değer Fonları (DCA)', percent: 10, color: '#38BDF8', description: 'Kademeli piyasa alışkanlığı' }
        ]
      };
    }

    if (riskProfile === 'CONSERVATIVE') {
      return {
        strategyName: 'Enflasyona Karşı Koruma & Sermaye Güvencesi',
        allocations: [
          { asset: 'Fiziki / Fon Altın & Kıymetli Maden', percent: 45, color: '#F59E0B', description: 'Enflasyon ve kur kalkanı' },
          { asset: 'Para Piyasası & Kısa Vadeli Tahvil Fonları', percent: 35, color: '#10B981', description: 'Düzenli risksiz getiri' },
          { asset: 'BIST 30 / Temettü & Eurobond Fonları', percent: 20, color: '#38BDF8', description: 'Uzun vadeli reel büyüme' }
        ]
      };
    }

    if (riskProfile === 'GROWTH') {
      return {
        strategyName: 'Agresif Büyüme & Teknoloji Bileşik Getirisi',
        allocations: [
          { asset: 'BIST & Yabancı Teknoloji Fonları (NASDAQ/AI)', percent: 45, color: '#8B5CF6', description: 'Yüksek büyüme potansiyeli' },
          { asset: 'Altın & Emtia Sepeti', percent: 25, color: '#F59E0B', description: 'Dengeleyici güvenli liman' },
          { asset: 'Eurobond / Yabancı Para Tahvili', percent: 15, color: '#38BDF8', description: 'Döviz bazlı kupon nakdi' },
          { asset: 'Likit Fırsat Nakdi (PPF)', percent: 15, color: '#10B981', description: 'Düşüşlerde alım likiditesi' }
        ]
      };
    }

    // Default: BALANCED
    return {
      strategyName: 'Dengeli & Çeşitlendirilmiş Servet Sepeti',
      allocations: [
        { asset: 'Altın / Kıymetli Madenler', percent: 35, color: '#F59E0B', description: 'Jeopolitik ve enflasyon güvencesi' },
        { asset: 'Hisse Senedi & Endeks Fonları', percent: 35, color: '#38BDF8', description: 'BIST 100 ve S&P 500 bileşik büyüme' },
        { asset: 'Para Piyasası Fonu (PPF)', percent: 20, color: '#10B981', description: 'Günlük faiz ve likit fırsat parası' },
        { asset: 'Eurobond / Yabancı Varlıklar', percent: 10, color: '#8B5CF6', description: 'Döviz cinsi koruma' }
      ]
    };
  }
}

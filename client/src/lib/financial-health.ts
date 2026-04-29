/**
 * Wealthly Financial Health Score Calculator
 *
 * Calculates a 0-100 score based on 5 pillars:
 * 1. Savings Rate (30 points) - % of income saved
 * 2. Debt Ratio (25 points) - debts / monthly income ratio
 * 3. Emergency Fund (20 points) - months of expenses covered by liquid savings
 * 4. Investment Diversity (15 points) - variety of investment types
 * 5. Tracking Consistency (10 points) - active usage indicator
 *
 * No external APIs needed - all math runs locally.
 */

export interface HealthScoreInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalLiquidSavings: number;
  totalActiveDebts: number;
  totalInvestmentValue: number;
  investmentTypes: string[];
  transactionsLast30Days: number;
  hasGoals: boolean;
  hasBudget: boolean;
}

export interface PillarScore {
  key: string;
  label: { en: string; ar: string };
  score: number;
  maxScore: number;
  status: "excellent" | "good" | "warning" | "critical";
  message: { en: string; ar: string };
  value?: string;
}

export interface HealthScoreResult {
  totalScore: number;
  rating: "excellent" | "good" | "fair" | "needs-work";
  ratingLabel: { en: string; ar: string };
  pillars: PillarScore[];
  topRecommendation: { en: string; ar: string };
  color: string;
}

function calcSavingsRate(input: HealthScoreInput): PillarScore {
  const { monthlyIncome, monthlyExpenses } = input;
  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  let score = 0;
  let status: PillarScore["status"] = "critical";
  let messageEn = "", messageAr = "";

  if (savingsRate >= 20) {
    score = 30; status = "excellent";
    messageEn = "Excellent — you're saving more than 20%";
    messageAr = "ممتاز — تدّخر أكثر من ٢٠٪";
  } else if (savingsRate >= 10) {
    score = 22; status = "good";
    messageEn = "Good savings habit, aim for 20%";
    messageAr = "عادة ادخار جيدة، استهدف ٢٠٪";
  } else if (savingsRate >= 5) {
    score = 12; status = "warning";
    messageEn = "Try to save at least 10% of income";
    messageAr = "حاول ادخار ١٠٪ من دخلك على الأقل";
  } else if (savingsRate > 0) {
    score = 5; status = "critical";
    messageEn = "You're saving very little, increase savings";
    messageAr = "تدّخر القليل جداً، زِد الادخار";
  } else {
    score = 0; status = "critical";
    messageEn = "You're spending more than earning";
    messageAr = "مصروفاتك تتجاوز دخلك";
  }

  return {
    key: "savings-rate",
    label: { en: "Savings Rate", ar: "معدل الادخار" },
    score, maxScore: 30, status,
    message: { en: messageEn, ar: messageAr },
    value: `${savingsRate.toFixed(1)}%`,
  };
}

function calcDebtRatio(input: HealthScoreInput): PillarScore {
  const { totalActiveDebts, monthlyIncome } = input;
  const annualIncome = monthlyIncome * 12;
  const debtRatio = annualIncome > 0 ? (totalActiveDebts / annualIncome) * 100 : 0;

  let score = 0;
  let status: PillarScore["status"] = "critical";
  let messageEn = "", messageAr = "";

  if (totalActiveDebts === 0) {
    score = 25; status = "excellent";
    messageEn = "Debt-free — excellent!";
    messageAr = "خالٍ من الديون — ممتاز!";
  } else if (debtRatio < 20) {
    score = 22; status = "excellent";
    messageEn = "Very healthy debt level";
    messageAr = "مستوى ديون صحي جداً";
  } else if (debtRatio < 36) {
    score = 17; status = "good";
    messageEn = "Manageable debt, monitor closely";
    messageAr = "ديون قابلة للإدارة، راقبها";
  } else if (debtRatio < 50) {
    score = 10; status = "warning";
    messageEn = "High debt level — focus on repayment";
    messageAr = "مستوى ديون مرتفع — ركّز على السداد";
  } else {
    score = 3; status = "critical";
    messageEn = "Critical debt level — urgent action needed";
    messageAr = "مستوى ديون حرج — إجراء عاجل مطلوب";
  }

  return {
    key: "debt-ratio",
    label: { en: "Debt Ratio", ar: "نسبة الديون" },
    score, maxScore: 25, status,
    message: { en: messageEn, ar: messageAr },
    value: totalActiveDebts === 0 ? "0%" : `${debtRatio.toFixed(0)}%`,
  };
}

function calcEmergencyFund(input: HealthScoreInput): PillarScore {
  const { totalLiquidSavings, monthlyExpenses } = input;
  const monthsCovered = monthlyExpenses > 0 ? totalLiquidSavings / monthlyExpenses : 0;

  let score = 0;
  let status: PillarScore["status"] = "critical";
  let messageEn = "", messageAr = "";

  if (monthsCovered >= 6) {
    score = 20; status = "excellent";
    messageEn = "Strong emergency fund — 6+ months covered";
    messageAr = "صندوق طوارئ قوي — ٦+ أشهر مغطاة";
  } else if (monthsCovered >= 3) {
    score = 14; status = "good";
    messageEn = "Good emergency fund, aim for 6 months";
    messageAr = "صندوق طوارئ جيد، استهدف ٦ أشهر";
  } else if (monthsCovered >= 1) {
    score = 7; status = "warning";
    messageEn = "Build your emergency fund to 3-6 months";
    messageAr = "ابنِ صندوق طوارئ يكفي ٣-٦ أشهر";
  } else {
    score = 0; status = "critical";
    messageEn = "No emergency cushion — start saving now";
    messageAr = "لا يوجد احتياطي طوارئ — ابدأ الادخار الآن";
  }

  return {
    key: "emergency-fund",
    label: { en: "Emergency Fund", ar: "صندوق الطوارئ" },
    score, maxScore: 20, status,
    message: { en: messageEn, ar: messageAr },
    value: monthsCovered < 0.5 ? "< 1 mo" : `${monthsCovered.toFixed(1)} ${monthsCovered === 1 ? "mo" : "mos"}`,
  };
}

function calcInvestmentDiversity(input: HealthScoreInput): PillarScore {
  const { investmentTypes, totalInvestmentValue } = input;
  const uniqueTypes = new Set(investmentTypes).size;

  let score = 0;
  let status: PillarScore["status"] = "critical";
  let messageEn = "", messageAr = "";

  if (totalInvestmentValue === 0) {
    score = 0; status = "critical";
    messageEn = "No investments — start with index funds";
    messageAr = "لا استثمارات — ابدأ بصناديق المؤشرات";
  } else if (uniqueTypes >= 4) {
    score = 15; status = "excellent";
    messageEn = "Well-diversified portfolio";
    messageAr = "محفظة استثمارية متنوّعة جيداً";
  } else if (uniqueTypes >= 3) {
    score = 12; status = "good";
    messageEn = "Good diversity, consider adding more types";
    messageAr = "تنوّع جيد، فكّر في إضافة أنواع أخرى";
  } else if (uniqueTypes === 2) {
    score = 8; status = "warning";
    messageEn = "Limited diversity — diversify across asset types";
    messageAr = "تنوّع محدود — نوّع بين أنواع الأصول";
  } else {
    score = 4; status = "warning";
    messageEn = "Single investment type — diversify your portfolio";
    messageAr = "نوع استثمار واحد فقط — نوّع محفظتك";
  }

  return {
    key: "investment-diversity",
    label: { en: "Investment Diversity", ar: "تنوّع الاستثمار" },
    score, maxScore: 15, status,
    message: { en: messageEn, ar: messageAr },
    value: `${uniqueTypes} ${uniqueTypes === 1 ? "type" : "types"}`,
  };
}

function calcTrackingConsistency(input: HealthScoreInput): PillarScore {
  const { transactionsLast30Days, hasGoals, hasBudget } = input;

  let score = 0;
  let status: PillarScore["status"] = "critical";
  let messageEn = "", messageAr = "";

  if (transactionsLast30Days >= 20) score += 6;
  else if (transactionsLast30Days >= 10) score += 4;
  else if (transactionsLast30Days >= 5) score += 2;

  if (hasGoals) score += 2;
  if (hasBudget) score += 2;

  if (score >= 9) {
    status = "excellent";
    messageEn = "Highly engaged — great financial discipline";
    messageAr = "متفاعل جداً — انضباط مالي رائع";
  } else if (score >= 6) {
    status = "good";
    messageEn = "Active tracking, keep it up";
    messageAr = "تتبّع نشط، استمر";
  } else if (score >= 3) {
    status = "warning";
    messageEn = "Track more regularly for better insights";
    messageAr = "تتبّع بانتظام أكثر للحصول على رؤى أفضل";
  } else {
    status = "critical";
    messageEn = "Start logging transactions consistently";
    messageAr = "ابدأ بتسجيل المعاملات بانتظام";
  }

  return {
    key: "tracking-consistency",
    label: { en: "Tracking Habit", ar: "انتظام التتبع" },
    score, maxScore: 10, status,
    message: { en: messageEn, ar: messageAr },
    value: `${transactionsLast30Days} tx/mo`,
  };
}

export function calculateFinancialHealth(input: HealthScoreInput): HealthScoreResult {
  const pillars = [
    calcSavingsRate(input),
    calcDebtRatio(input),
    calcEmergencyFund(input),
    calcInvestmentDiversity(input),
    calcTrackingConsistency(input),
  ];

  const totalScore = pillars.reduce((sum, p) => sum + p.score, 0);

  let rating: HealthScoreResult["rating"];
  let ratingLabel: { en: string; ar: string };
  let color: string;

  if (totalScore >= 80) {
    rating = "excellent";
    ratingLabel = { en: "Excellent", ar: "ممتاز" };
    color = "#1D9E75";
  } else if (totalScore >= 60) {
    rating = "good";
    ratingLabel = { en: "Healthy", ar: "صحية" };
    color = "#1D9E75";
  } else if (totalScore >= 40) {
    rating = "fair";
    ratingLabel = { en: "Fair", ar: "متوسطة" };
    color = "#EF9F27";
  } else {
    rating = "needs-work";
    ratingLabel = { en: "Needs Work", ar: "تحتاج عمل" };
    color = "#E24B4A";
  }

  const sortedByGap = [...pillars].sort((a, b) =>
    (b.maxScore - b.score) - (a.maxScore - a.score)
  );
  const weakestPillar = sortedByGap[0];

  return {
    totalScore,
    rating,
    ratingLabel,
    pillars,
    topRecommendation: {
      en: weakestPillar.message.en,
      ar: weakestPillar.message.ar,
    },
    color,
  };
}

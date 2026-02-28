/**
 * Zakat Calculator — Pure calculation functions
 *
 * Key Islamic Finance principles implemented:
 * - Nisab: Minimum wealth threshold that makes Zakat obligatory.
 *   Gold standard: 85g pure gold (contemporary, AAOIFI).
 *   Silver standard: 595g silver (classical, more conservative).
 * - Hawl: Wealth must have been continuously above nisab for one full
 *   lunar year (≈354 days). Implemented as a user checkbox.
 * - Zakat rate: 2.5% of net zakatable wealth.
 * - Zakatable assets: cash, gold, silver, investments (trade goods), receivables,
 *   real estate held for resale.
 * - Deductible liabilities: Short-term debts due within 12 months.
 * - Primary residence and personal-use assets are NOT zakatable.
 *
 * To change interpretations, look for comments marked "INTERPRETATION:".
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Nisab in grams of pure gold — AAOIFI / OIC contemporary standard */
export const GOLD_NISAB_GRAMS = 85;

/** Nisab in grams of pure silver — classical Hanafi/Shafi'i/Maliki/Hanbali standard */
export const SILVER_NISAB_GRAMS = 595;

/** Zakat rate: 2.5% = 1/40 */
export const ZAKAT_RATE = 0.025;

/** One lunar (Hijri) year in days */
export const LUNAR_YEAR_DAYS = 354;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZakatPrices {
  goldPricePerGram: number;   // USD per gram of pure gold
  silverPricePerGram: number; // USD per gram of pure silver
}

export interface ZakatCalculatorSettings {
  nisabStandard: "gold" | "silver";
  includeDebts: boolean;
  hawlMet: boolean;
  realEstateMode: "exempt" | "rental_income" | "trading";
}

export interface ZakatAssets {
  cashFromBankAccounts: number;  // USD — from bank accounts flagged isZakatable=true
  cashOnHand: number;            // USD — physical cash, e-wallets (manual entry)
  goldGrams: number;             // Grams of gold jewelry/bars owned
  goldKarat: number;             // Karat purity of gold (0–24; 24 = pure)
  silverGrams: number;           // Grams of silver
  investmentsValue: number;      // USD — active investments flagged market_value
  receivables: number;           // USD — business receivables expected to be collected
  realEstateValue: number;       // USD — market value (used only in trading mode)
  rentalIncomeCash: number;      // USD — net rental income cash on hand (rental_income mode)
}

export interface ZakatLiabilities {
  deductibleDebts: number; // USD — short-term debts due within 12 months
}

export interface ZakatBreakdown {
  cashTotal: number;
  goldValue: number;
  silverValue: number;
  investmentsTotal: number;
  receivablesTotal: number;
  realEstateValue: number;
  totalZakatableAssets: number;
  deductibleDebts: number;
  netZakatable: number;
}

export interface ZakatResult {
  nisabMet: boolean;
  hawlMet: boolean;
  nisabValueUsd: number;
  breakdown: ZakatBreakdown;
  zakatDue: number;
  explanations: string[];
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Convert grams of karat gold to pure gold grams.
 * Pure gold = grams × (karat / 24)
 *
 * INTERPRETATION: We use the simple karat fraction method (karat/24).
 * For 24k gold, 100% pure. For 21k, 87.5% pure. For 18k, 75% pure.
 */
export function calculatePureGoldGrams(grams: number, karat: number): number {
  if (karat <= 0 || karat > 24 || grams <= 0) return 0;
  return grams * (karat / 24);
}

/**
 * Calculate the USD value of gold based on weight and karat.
 */
export function calculateGoldValue(
  grams: number,
  karat: number,
  goldPricePerGram: number
): number {
  return calculatePureGoldGrams(grams, karat) * goldPricePerGram;
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

/**
 * calculateZakat — pure function, no side effects.
 *
 * Returns whether nisab and hawl are met, a full breakdown, and zakat due.
 * All monetary amounts are in USD.
 *
 * @param assets        — All zakatable asset values
 * @param liabilities   — Deductible short-term debts
 * @param settings      — User's zakat preferences
 * @param prices        — Gold and silver prices per gram in USD
 */
export function calculateZakat(
  assets: ZakatAssets,
  liabilities: ZakatLiabilities,
  settings: ZakatCalculatorSettings,
  prices: ZakatPrices
): ZakatResult {
  const explanations: string[] = [];

  // --- Nisab threshold ---
  let nisabValueUsd: number;
  if (settings.nisabStandard === "gold") {
    nisabValueUsd = GOLD_NISAB_GRAMS * prices.goldPricePerGram;
    explanations.push(
      `Nisab (gold standard): ${GOLD_NISAB_GRAMS}g × $${prices.goldPricePerGram.toFixed(2)}/g = $${nisabValueUsd.toFixed(2)}`
    );
  } else {
    // INTERPRETATION: Silver nisab — more conservative, results in lower threshold
    nisabValueUsd = SILVER_NISAB_GRAMS * prices.silverPricePerGram;
    explanations.push(
      `Nisab (silver standard): ${SILVER_NISAB_GRAMS}g × $${prices.silverPricePerGram.toFixed(2)}/g = $${nisabValueUsd.toFixed(2)}`
    );
  }

  // --- Cash ---
  const cashTotal = assets.cashFromBankAccounts + assets.cashOnHand;
  explanations.push(`Cash: $${assets.cashFromBankAccounts.toFixed(2)} (bank) + $${assets.cashOnHand.toFixed(2)} (on hand) = $${cashTotal.toFixed(2)}`);

  // --- Gold ---
  const pureGoldGrams = calculatePureGoldGrams(assets.goldGrams, assets.goldKarat);
  const goldValue = pureGoldGrams * prices.goldPricePerGram;
  if (assets.goldGrams > 0) {
    explanations.push(
      `Gold: ${assets.goldGrams}g at ${assets.goldKarat}k = ${pureGoldGrams.toFixed(3)}g pure × $${prices.goldPricePerGram.toFixed(2)}/g = $${goldValue.toFixed(2)}`
    );
  }

  // --- Silver ---
  const silverValue = assets.silverGrams * prices.silverPricePerGram;
  if (assets.silverGrams > 0) {
    explanations.push(`Silver: ${assets.silverGrams}g × $${prices.silverPricePerGram.toFixed(2)}/g = $${silverValue.toFixed(2)}`);
  }

  // --- Investments ---
  // INTERPRETATION: We include investments at current market value.
  // For stocks/ETFs, the zakatable portion is ideally the company's zakatable
  // assets per share; using full market value is a conservative simplification.
  const investmentsTotal = assets.investmentsValue;
  if (investmentsTotal > 0) {
    explanations.push(`Investments: $${investmentsTotal.toFixed(2)} (market value of zakatable holdings)`);
  }

  // --- Receivables ---
  // INTERPRETATION: Include only receivables expected to be collected (strong debts).
  // Doubtful receivables are excluded by the user not listing them.
  const receivablesTotal = assets.receivables;

  // --- Real estate ---
  // INTERPRETATION:
  //   "exempt"        → Primary residence and personal-use property — NOT zakatable.
  //   "rental_income" → Investment property held for rent: only net rental income
  //                     cash that has passed hawl is zakatable (common contemporary view).
  //   "trading"       → Property held for resale as trade inventory: zakatable at
  //                     full market value (treat as trade goods).
  let realEstateValue = 0;
  if (settings.realEstateMode === "rental_income") {
    realEstateValue = assets.rentalIncomeCash;
    explanations.push(
      `Real estate (rental income mode): only net rental cash included = $${realEstateValue.toFixed(2)}`
    );
  } else if (settings.realEstateMode === "trading") {
    realEstateValue = assets.realEstateValue;
    explanations.push(
      `Real estate (trading/resale mode): full market value = $${realEstateValue.toFixed(2)}`
    );
  } else {
    explanations.push("Real estate: exempt (primary residence / not for trade or resale)");
  }

  // --- Total zakatable assets ---
  const totalZakatableAssets =
    cashTotal + goldValue + silverValue + investmentsTotal + receivablesTotal + realEstateValue;

  // --- Deductible debts ---
  // INTERPRETATION: Deduct only short-term debts due within 12 months.
  // Long-term debts (e.g. 25-year mortgage) are typically NOT deducted in full;
  // only the portion due within the coming lunar year is deductible.
  const deductibleDebts = settings.includeDebts ? Math.max(0, liabilities.deductibleDebts) : 0;
  if (settings.includeDebts && deductibleDebts > 0) {
    explanations.push(`Deductible debts (short-term): $${deductibleDebts.toFixed(2)}`);
  }

  // --- Net zakatable amount ---
  const netZakatable = Math.max(0, totalZakatableAssets - deductibleDebts);
  explanations.push(`Net zakatable: $${totalZakatableAssets.toFixed(2)} − $${deductibleDebts.toFixed(2)} = $${netZakatable.toFixed(2)}`);

  // --- Nisab check ---
  const nisabMet = netZakatable >= nisabValueUsd;

  // --- Hawl check ---
  // INTERPRETATION: User self-certifies that their wealth has remained above nisab
  // for an uninterrupted lunar year. We trust the user's declaration.
  const hawlMet = settings.hawlMet;

  // --- Zakat due ---
  // Zakat is obligatory only when BOTH nisab AND hawl conditions are satisfied.
  let zakatDue = 0;
  if (nisabMet && hawlMet) {
    zakatDue = netZakatable * ZAKAT_RATE;
    explanations.push(`Zakat due: $${netZakatable.toFixed(2)} × 2.5% = $${zakatDue.toFixed(2)}`);
  } else if (!nisabMet) {
    explanations.push(
      `Zakat NOT due: net zakatable ($${netZakatable.toFixed(2)}) < nisab ($${nisabValueUsd.toFixed(2)})`
    );
  } else {
    explanations.push("Zakat NOT due: hawl (one full lunar year above nisab) not confirmed");
  }

  return {
    nisabMet,
    hawlMet,
    nisabValueUsd,
    breakdown: {
      cashTotal,
      goldValue,
      silverValue,
      investmentsTotal,
      receivablesTotal,
      realEstateValue,
      totalZakatableAssets,
      deductibleDebts,
      netZakatable,
    },
    zakatDue,
    explanations,
  };
}

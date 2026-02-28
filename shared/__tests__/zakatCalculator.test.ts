/**
 * Unit tests for the Zakat Calculator
 * Run with: npx vitest run shared/__tests__/zakatCalculator.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  calculateZakat,
  calculatePureGoldGrams,
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
  ZAKAT_RATE,
} from "../zakatCalculator";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const prices = { goldPricePerGram: 60, silverPricePerGram: 0.75 };

const defaultSettings = {
  nisabStandard: "gold" as const,
  includeDebts: true,
  hawlMet: true,
  realEstateMode: "exempt" as const,
};

const emptyLiabilities = { deductibleDebts: 0 };

const emptyAssets = {
  cashFromBankAccounts: 0,
  cashOnHand: 0,
  goldGrams: 0,
  goldKarat: 24,
  silverGrams: 0,
  investmentsValue: 0,
  receivables: 0,
  realEstateValue: 0,
  rentalIncomeCash: 0,
};

// Gold nisab at $60/g = 85 × 60 = $5,100
const GOLD_NISAB_USD = GOLD_NISAB_GRAMS * prices.goldPricePerGram;

// ---------------------------------------------------------------------------
// Test 1: Nisab not met → zakatDue = 0
// ---------------------------------------------------------------------------
describe("Test 1 — Nisab not met", () => {
  it("zakatDue should be 0 when total wealth is below nisab", () => {
    const result = calculateZakat(
      { ...emptyAssets, cashOnHand: 1000 }, // $1,000 < $5,100 nisab
      emptyLiabilities,
      defaultSettings,
      prices
    );

    expect(result.nisabMet).toBe(false);
    expect(result.zakatDue).toBe(0);
    expect(result.breakdown.netZakatable).toBe(1000);
    expect(result.nisabValueUsd).toBe(GOLD_NISAB_USD);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Nisab met but hawl not met → zakatDue = 0
// ---------------------------------------------------------------------------
describe("Test 2 — Nisab met, hawl not met", () => {
  it("zakatDue should be 0 when hawl has not passed", () => {
    const result = calculateZakat(
      { ...emptyAssets, cashOnHand: 10_000 }, // $10,000 > nisab
      emptyLiabilities,
      { ...defaultSettings, hawlMet: false },
      prices
    );

    expect(result.nisabMet).toBe(true);
    expect(result.hawlMet).toBe(false);
    expect(result.zakatDue).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Cash + gold + investments with deductible debts
// ---------------------------------------------------------------------------
describe("Test 3 — Cash + gold + investments minus debts", () => {
  it("calculates correct net zakatable and 2.5% zakat", () => {
    // Cash: $5,000 | Gold: 50g × 24k = $3,000 | Investments: $10,000
    // Total assets: $18,000 | Debts: $3,000 → Net: $15,000
    // Zakat: 15,000 × 2.5% = $375
    const result = calculateZakat(
      {
        ...emptyAssets,
        cashOnHand: 5_000,
        goldGrams: 50,
        goldKarat: 24,
        investmentsValue: 10_000,
      },
      { deductibleDebts: 3_000 },
      defaultSettings,
      prices
    );

    expect(result.nisabMet).toBe(true);
    expect(result.breakdown.goldValue).toBeCloseTo(50 * 60, 5);
    expect(result.breakdown.cashTotal).toBe(5_000);
    expect(result.breakdown.investmentsTotal).toBe(10_000);
    expect(result.breakdown.deductibleDebts).toBe(3_000);
    expect(result.breakdown.netZakatable).toBeCloseTo(15_000, 5);
    expect(result.zakatDue).toBeCloseTo(15_000 * ZAKAT_RATE, 5);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Gold karat conversion accuracy
// ---------------------------------------------------------------------------
describe("Test 4 — Gold karat conversion", () => {
  it("converts 18k gold correctly: 48g × 18/24 = 36g pure gold", () => {
    const pureGrams = calculatePureGoldGrams(48, 18);
    expect(pureGrams).toBeCloseTo(36, 10);
  });

  it("values 21k gold correctly in a full calculation", () => {
    // 100g of 21k gold = 100 × (21/24) = 87.5g pure gold × $60 = $5,250
    const result = calculateZakat(
      { ...emptyAssets, goldGrams: 100, goldKarat: 21 },
      emptyLiabilities,
      defaultSettings,
      prices
    );
    const expectedGoldValue = 100 * (21 / 24) * 60;
    expect(result.breakdown.goldValue).toBeCloseTo(expectedGoldValue, 5);
    expect(result.zakatDue).toBeCloseTo(expectedGoldValue * ZAKAT_RATE, 5);
  });

  it("returns 0 for invalid karat (>24 or <=0)", () => {
    expect(calculatePureGoldGrams(100, 25)).toBe(0);
    expect(calculatePureGoldGrams(100, 0)).toBe(0);
    expect(calculatePureGoldGrams(100, -1)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 5: Silver nisab option
// ---------------------------------------------------------------------------
describe("Test 5 — Silver nisab standard", () => {
  it("uses silver nisab threshold correctly", () => {
    // Silver nisab: 595g × $0.75 = $446.25
    // $500 cash > $446.25 → nisab met
    const result = calculateZakat(
      { ...emptyAssets, cashOnHand: 500 },
      emptyLiabilities,
      { ...defaultSettings, nisabStandard: "silver" },
      prices
    );

    const expectedNisab = SILVER_NISAB_GRAMS * prices.silverPricePerGram;
    expect(result.nisabValueUsd).toBeCloseTo(expectedNisab, 5);
    expect(result.nisabMet).toBe(true);
    expect(result.zakatDue).toBeCloseTo(500 * ZAKAT_RATE, 5);
  });

  it("silver nisab not met when wealth is very low", () => {
    // $100 cash < $446.25 silver nisab
    const result = calculateZakat(
      { ...emptyAssets, cashOnHand: 100 },
      emptyLiabilities,
      { ...defaultSettings, nisabStandard: "silver" },
      prices
    );
    expect(result.nisabMet).toBe(false);
    expect(result.zakatDue).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 6: Real estate mode differences
// ---------------------------------------------------------------------------
describe("Test 6 — Real estate modes", () => {
  const baseAssets = {
    ...emptyAssets,
    cashOnHand: 10_000,
    realEstateValue: 200_000,  // Market value of property
    rentalIncomeCash: 5_000,   // Net rental income in hand
  };

  it("exempt mode: real estate value = 0", () => {
    const result = calculateZakat(
      baseAssets,
      emptyLiabilities,
      { ...defaultSettings, realEstateMode: "exempt" },
      prices
    );
    expect(result.breakdown.realEstateValue).toBe(0);
    expect(result.breakdown.totalZakatableAssets).toBe(10_000); // cash only
  });

  it("rental_income mode: only rental income cash is zakatable", () => {
    const result = calculateZakat(
      baseAssets,
      emptyLiabilities,
      { ...defaultSettings, realEstateMode: "rental_income" },
      prices
    );
    expect(result.breakdown.realEstateValue).toBe(5_000);
    expect(result.breakdown.totalZakatableAssets).toBe(15_000); // cash + rental income
  });

  it("trading mode: full market value of property is zakatable", () => {
    const result = calculateZakat(
      baseAssets,
      emptyLiabilities,
      { ...defaultSettings, realEstateMode: "trading" },
      prices
    );
    expect(result.breakdown.realEstateValue).toBe(200_000);
    expect(result.breakdown.totalZakatableAssets).toBe(210_000); // cash + property
    expect(result.zakatDue).toBeCloseTo(210_000 * ZAKAT_RATE, 5);
  });

  it("trading mode results in much higher zakat than rental_income mode", () => {
    const rentalResult = calculateZakat(baseAssets, emptyLiabilities, { ...defaultSettings, realEstateMode: "rental_income" }, prices);
    const tradingResult = calculateZakat(baseAssets, emptyLiabilities, { ...defaultSettings, realEstateMode: "trading" }, prices);
    expect(tradingResult.zakatDue).toBeGreaterThan(rentalResult.zakatDue);
  });
});

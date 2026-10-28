/**
 * Net-worth rules from the product spec (business rules BR-04..BR-06, tests 1-3).
 * Run with: npm test
 */
import { describe, it, expect } from "vitest";
import { summarizeWealth, activeDebtTotals } from "../wealth";

const acct = (balance: number, rate = 1) => ({ balance: String(balance), exchangeRateToUsd: String(rate) });
const debt = (remaining: number, direction: "payable" | "receivable", status = "active") =>
  ({ remainingAmount: String(remaining), exchangeRateToUsd: "1", direction, status });

describe("summarizeWealth", () => {
  it("a transfer between own accounts does not change net worth", () => {
    const before = summarizeWealth({ accounts: [acct(5000), acct(0)], investments: [], assets: [], debts: [] });
    const after = summarizeWealth({ accounts: [acct(4000), acct(1000)], investments: [], assets: [], debts: [] });
    expect(after.netWorth).toBe(before.netWorth);
  });

  it("taking a loan raises cash and liabilities equally, net worth unchanged", () => {
    const before = summarizeWealth({ accounts: [acct(2000)], investments: [], assets: [], debts: [] });
    const after = summarizeWealth({ accounts: [acct(12000)], investments: [], assets: [], debts: [debt(10000, "payable")] });
    expect(after.bankTotal - before.bankTotal).toBe(10000);
    expect(after.liabilityTotal).toBe(10000);
    expect(after.netWorth).toBe(before.netWorth);
  });

  it("lending money moves value from cash to a receivable, net worth unchanged", () => {
    const before = summarizeWealth({ accounts: [acct(8000)], investments: [], assets: [], debts: [] });
    const after = summarizeWealth({ accounts: [acct(3000)], investments: [], assets: [], debts: [debt(5000, "receivable")] });
    expect(after.receivableTotal).toBe(5000);
    expect(after.liabilityTotal).toBe(0);
    expect(after.netWorth).toBe(before.netWorth);
  });

  it("ignores sold investments and assets, and paid debts", () => {
    const w = summarizeWealth({
      accounts: [],
      investments: [{ status: "active", currentValue: "100", exchangeRateToUsd: "1" }, { status: "sold", currentValue: "900", exchangeRateToUsd: "1" }],
      assets: [{ status: "owned", currentValue: "50", exchangeRateToUsd: "1" }, { status: "sold", currentValue: "500", exchangeRateToUsd: "1" }],
      debts: [debt(70, "payable", "paid")],
    });
    expect(w.netWorth).toBe(150);
  });

  it("converts each record with its own stored rate", () => {
    const w = summarizeWealth({ accounts: [acct(1000, 0.2667)], investments: [], assets: [], debts: [] });
    expect(w.bankTotal).toBeCloseTo(266.7, 5);
  });
});

describe("activeDebtTotals", () => {
  it("treats debts without a direction as money the user owes", () => {
    expect(activeDebtTotals([{ remainingAmount: "40", exchangeRateToUsd: "1", status: "active" }])).toEqual({ payable: 40, receivable: 0 });
  });
});

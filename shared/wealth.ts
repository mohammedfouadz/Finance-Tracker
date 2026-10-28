import { toUsd } from "./currency";

/**
 * Central net-worth calculation shared by the dashboard, net-worth page,
 * zakat page and admin views, so every screen shows the same numbers.
 *
 * Rules (from the product spec's business rules):
 * - Money others owe the user ("receivable" debts) is an asset, not a liability.
 * - Money the user owes ("payable" debts) is a liability.
 * - Sold investments and sold assets no longer count.
 * - Everything is converted to USD with the rate stored on each record.
 */

export type DebtDirection = "payable" | "receivable";

type Money = number | string | null | undefined;
type DebtLike = { status?: string | null; direction?: string | null; remainingAmount: Money; exchangeRateToUsd: Money };

export function isReceivable(debt: { direction?: string | null }): boolean {
  return debt.direction === "receivable";
}

export function activeDebtTotals(debts: DebtLike[]) {
  let payable = 0;
  let receivable = 0;
  for (const d of debts) {
    if (d.status !== "active") continue;
    const usd = toUsd(d.remainingAmount, d.exchangeRateToUsd);
    if (isReceivable(d)) receivable += usd;
    else payable += usd;
  }
  return { payable, receivable };
}

export function summarizeWealth(input: {
  accounts: { balance: Money; exchangeRateToUsd: Money }[];
  investments: { status?: string | null; currentValue: Money; exchangeRateToUsd: Money }[];
  assets: { status?: string | null; currentValue: Money; exchangeRateToUsd: Money }[];
  debts: DebtLike[];
}) {
  const bankTotal = input.accounts.reduce((s, a) => s + toUsd(a.balance, a.exchangeRateToUsd), 0);
  const investmentTotal = input.investments
    .filter((i) => i.status !== "sold")
    .reduce((s, i) => s + toUsd(i.currentValue, i.exchangeRateToUsd), 0);
  const assetTotal = input.assets
    .filter((a) => a.status !== "sold")
    .reduce((s, a) => s + toUsd(a.currentValue, a.exchangeRateToUsd), 0);
  const { payable, receivable } = activeDebtTotals(input.debts);

  const totalAssets = bankTotal + investmentTotal + assetTotal + receivable;
  return {
    bankTotal,
    investmentTotal,
    assetTotal,
    receivableTotal: receivable,
    liabilityTotal: payable,
    totalAssets,
    netWorth: totalAssets - payable,
  };
}

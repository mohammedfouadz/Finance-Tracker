export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "EUR", symbol: "€", name: "Euro" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  OMR: 2.5974,
  SAR: 0.2667,
  ILS: 0.2747,
  EUR: 1.08,
};

export function toUsd(amount: number | string | null | undefined, exchangeRateToUsd: number | string | null | undefined): number {
  const amt = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
  const rate = typeof exchangeRateToUsd === "string" ? parseFloat(exchangeRateToUsd) : Number(exchangeRateToUsd || 1);
  if (isNaN(amt)) return 0;
  if (isNaN(rate) || rate === 0) return amt;
  return amt * rate;
}

export function getDefaultRate(currencyCode: string): number {
  return DEFAULT_EXCHANGE_RATES[currencyCode] ?? 1;
}

export function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return currency?.symbol ?? "$";
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

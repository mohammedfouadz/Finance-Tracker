export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "EGP", symbol: "ج.م", name: "Egyptian Pound" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal" },
  { code: "BHD", symbol: "د.ب", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  SAR: 0.2667,
  AED: 0.2723,
  EGP: 0.0204,
  KWD: 3.26,
  QAR: 0.2747,
  BHD: 2.6525,
  OMR: 2.5974,
  JOD: 1.4104,
  ILS: 0.2747,
  INR: 0.0119,
  PKR: 0.0036,
  TRY: 0.0291,
  JPY: 0.0067,
  CNY: 0.1379,
  KRW: 0.00069,
  BRL: 0.1724,
  CAD: 0.7353,
  AUD: 0.6494,
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

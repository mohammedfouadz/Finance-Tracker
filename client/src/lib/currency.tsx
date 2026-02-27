import { createContext, useContext, useState, type ReactNode } from "react";
import { SUPPORTED_CURRENCIES, DEFAULT_EXCHANGE_RATES, toUsd, getDefaultRate, getCurrencySymbol } from "@shared/currency";

export { SUPPORTED_CURRENCIES as CURRENCIES, DEFAULT_EXCHANGE_RATES, toUsd, getDefaultRate, getCurrencySymbol };

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatAmount: (amount: number | string) => string;
  formatUsd: (amount: number | string) => string;
  formatWithCurrency: (amount: number | string, currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatAmount: (a) => String(a),
  formatUsd: (a) => String(a),
  formatWithCurrency: (a) => String(a),
});

export function CurrencyProvider({ children, initialCurrency = "USD" }: { children: ReactNode; initialCurrency?: string }) {
  const [currency, setCurrency] = useState(initialCurrency);

  const formatAmount = (amount: number | string) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(value)) return "$0.00";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatUsd = formatAmount;

  const formatWithCurrency = (amount: number | string, currencyCode: string) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(value)) return "0.00";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(value);
    } catch {
      const symbol = getCurrencySymbol(currencyCode);
      return `${symbol}${value.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, formatUsd, formatWithCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

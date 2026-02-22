import { createContext, useContext, useState, type ReactNode } from "react";

export const CURRENCIES = [
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
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatAmount: (amount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatAmount: (a) => String(a),
});

export function CurrencyProvider({ children, initialCurrency = "USD" }: { children: ReactNode; initialCurrency?: string }) {
  const [currency, setCurrency] = useState(initialCurrency);

  const formatAmount = (amount: number | string) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(value)) return "0";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(value);
    } catch {
      const cur = CURRENCIES.find(c => c.code === currency);
      return `${cur?.symbol || "$"}${value.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

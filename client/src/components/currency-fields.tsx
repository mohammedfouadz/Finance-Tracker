import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CURRENCIES, getDefaultRate, toUsd } from "@/lib/currency";

interface CurrencyFieldsProps {
  currencyCode: string;
  exchangeRate: string;
  amount?: string;
  onCurrencyChange: (code: string) => void;
  onExchangeRateChange: (rate: string) => void;
  showUsdPreview?: boolean;
  className?: string;
}

export function CurrencyFields({
  currencyCode,
  exchangeRate,
  amount,
  onCurrencyChange,
  onExchangeRateChange,
  showUsdPreview = true,
  className = "",
}: CurrencyFieldsProps) {
  const handleCurrencyChange = (code: string) => {
    onCurrencyChange(code);
    const defaultRate = getDefaultRate(code);
    onExchangeRateChange(String(defaultRate));
  };

  const usdAmount = amount && exchangeRate
    ? toUsd(Number(amount), Number(exchangeRate))
    : 0;

  return (
    <>
      <div className={className}>
        <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Currency</label>
        <Select value={currencyCode} onValueChange={handleCurrencyChange}>
          <SelectTrigger data-testid="select-currency">
            <SelectValue placeholder="Select currency..." />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={className}>
        <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Rate to USD</label>
        <Input
          data-testid="input-exchange-rate"
          type="number"
          step="0.0001"
          min="0.0001"
          placeholder="1.0000"
          value={exchangeRate}
          onChange={e => onExchangeRateChange(e.target.value)}
        />
        {showUsdPreview && amount && Number(amount) > 0 && currencyCode !== "USD" && (
          <p className="text-xs text-[#999] dark:text-gray-500 mt-1" data-testid="text-usd-preview">
            ≈ ${usdAmount.toFixed(2)} USD
          </p>
        )}
      </div>
    </>
  );
}

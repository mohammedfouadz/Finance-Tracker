import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBankAccounts, useInvestments, useDebts, useAssets } from "@/hooks/use-finance";
import { toUsd } from "@/lib/currency";
import { calculateZakat, type ZakatAssets, type ZakatCalculatorSettings, type ZakatPrices } from "@shared/zakatCalculator";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, RefreshCw, Save, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Hooks for zakat-specific endpoints
// ---------------------------------------------------------------------------

function useZakatSettings() {
  return useQuery({
    queryKey: ["/api/zakat/settings"],
    queryFn: async () => {
      const r = await fetch("/api/zakat/settings", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch zakat settings");
      return r.json();
    },
  });
}

function useSaveZakatSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const r = await fetch("/api/zakat/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to save settings");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/settings"] }),
  });
}

function useZakatSnapshots() {
  return useQuery({
    queryKey: ["/api/zakat/snapshots"],
    queryFn: async () => {
      const r = await fetch("/api/zakat/snapshots", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch snapshots");
      return r.json();
    },
  });
}

function useSaveSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const r = await fetch("/api/zakat/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to save snapshot");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/snapshots"] }),
  });
}

function useDeleteSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/zakat/snapshots/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/snapshots"] }),
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0 dark:border-gray-800">
      <span className={`text-sm ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-mono ${strong ? "font-bold text-foreground" : ""}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ZakatPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: savedSettings } = useZakatSettings();
  const { data: snapshots } = useZakatSnapshots();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: investments = [] } = useInvestments();
  const { data: debts = [] } = useDebts();
  const { data: assets = [] } = useAssets();

  const saveSettings = useSaveZakatSettings();
  const saveSnapshot = useSaveSnapshot();
  const deleteSnapshot = useDeleteSnapshot();

  const [settingsOpen, setSettingsOpen] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);

  // --- Calculator state ---
  const [settings, setSettings] = useState<ZakatCalculatorSettings>({
    nisabStandard: "gold",
    includeDebts: true,
    hawlMet: false,
    realEstateMode: "exempt",
  });

  const [prices, setPrices] = useState<ZakatPrices>({
    goldPricePerGram: 60,
    silverPricePerGram: 0.75,
  });

  const [cashOnHand, setCashOnHand] = useState("0");
  const [goldGrams, setGoldGrams] = useState("0");
  const [goldKarat, setGoldKarat] = useState("24");
  const [silverGrams, setSilverGrams] = useState("0");
  const [receivables, setReceivables] = useState("0");
  const [rentalIncomeCash, setRentalIncomeCash] = useState("0");
  const [notes, setNotes] = useState("");

  // Per-account and per-investment zakat overrides (local state synced from server)
  const [accountZakatable, setAccountZakatable] = useState<Record<number, boolean>>({});
  const [investmentZakatMethod, setInvestmentZakatMethod] = useState<Record<number, string>>({});

  // Populate state from saved settings on load
  useEffect(() => {
    if (!savedSettings) return;
    setSettings({
      nisabStandard: savedSettings.nisabStandard || "gold",
      includeDebts: savedSettings.includeDebts ?? true,
      hawlMet: savedSettings.hawlMet ?? false,
      realEstateMode: savedSettings.realEstateMode || "exempt",
    });
    setPrices({
      goldPricePerGram: Number(savedSettings.goldPricePerGram) || 60,
      silverPricePerGram: Number(savedSettings.silverPricePerGram) || 0.75,
    });
    setCashOnHand(String(savedSettings.cashOnHand || "0"));
    setGoldGrams(String(savedSettings.goldGrams || "0"));
    setGoldKarat(String(savedSettings.goldKarat || "24"));
    setSilverGrams(String(savedSettings.silverGrams || "0"));
    setReceivables(String(savedSettings.receivables || "0"));
    setRentalIncomeCash(String(savedSettings.rentalIncomeCash || "0"));
  }, [savedSettings]);

  // Populate account/investment toggles from server data
  useEffect(() => {
    const map: Record<number, boolean> = {};
    (bankAccounts as any[]).forEach((a: any) => { map[a.id] = a.isZakatable !== false; });
    setAccountZakatable(map);
  }, [bankAccounts]);

  useEffect(() => {
    const map: Record<number, string> = {};
    (investments as any[]).filter((i: any) => i.status === "active").forEach((i: any) => {
      map[i.id] = i.zakatMethod || "market_value";
    });
    setInvestmentZakatMethod(map);
  }, [investments]);

  // --- Derived values ---
  const cashFromBankAccounts = useMemo(() => {
    return (bankAccounts as any[]).reduce((s, a) => {
      if (accountZakatable[a.id] === false) return s;
      return s + toUsd(a.balance, a.exchangeRateToUsd);
    }, 0);
  }, [bankAccounts, accountZakatable]);

  const investmentsValue = useMemo(() => {
    return (investments as any[])
      .filter((i: any) => i.status === "active" && investmentZakatMethod[i.id] !== "exempt")
      .reduce((s, i) => s + toUsd(i.currentValue, i.exchangeRateToUsd), 0);
  }, [investments, investmentZakatMethod]);

  const realEstateAssets = useMemo(() => {
    return (assets as any[]).filter((a: any) => a.type === "Real Estate");
  }, [assets]);

  const realEstateValue = useMemo(() => {
    return realEstateAssets.reduce((s: number, a: any) => s + toUsd(a.currentValue, a.exchangeRateToUsd), 0);
  }, [realEstateAssets]);

  const deductibleDebts = useMemo(() => {
    return (debts as any[])
      .filter((d: any) => d.status === "active")
      .reduce((s, d) => s + toUsd(d.remainingAmount, d.exchangeRateToUsd), 0);
  }, [debts]);

  // --- Build assets & liabilities for calculator ---
  const zakatAssets: ZakatAssets = {
    cashFromBankAccounts,
    cashOnHand: Number(cashOnHand) || 0,
    goldGrams: Number(goldGrams) || 0,
    goldKarat: Number(goldKarat) || 24,
    silverGrams: Number(silverGrams) || 0,
    investmentsValue,
    receivables: Number(receivables) || 0,
    realEstateValue,
    rentalIncomeCash: Number(rentalIncomeCash) || 0,
  };

  const zakatLiabilities = { deductibleDebts: settings.includeDebts ? deductibleDebts : 0 };

  // --- Run calculation ---
  const result = useMemo(
    () => calculateZakat(zakatAssets, zakatLiabilities, settings, prices),
    [zakatAssets, zakatLiabilities, settings, prices]
  );

  // --- Actions ---
  const fetchLivePrices = async () => {
    setPricesLoading(true);
    try {
      const r = await fetch("/api/zakat/prices", { credentials: "include" });
      const data = await r.json();
      if (data.goldPricePerGram) setPrices(p => ({ ...p, goldPricePerGram: data.goldPricePerGram }));
      if (data.silverPricePerGram) setPrices(p => ({ ...p, silverPricePerGram: data.silverPricePerGram }));
      if (data.goldPricePerGram) {
        toast({ title: `Live prices loaded (${data.source})` });
      } else {
        toast({ title: "Live prices unavailable — enter manually", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to fetch prices", variant: "destructive" });
    } finally {
      setPricesLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings.mutateAsync({
        ...settings,
        goldPricePerGram: String(prices.goldPricePerGram),
        silverPricePerGram: String(prices.silverPricePerGram),
        cashOnHand,
        goldGrams,
        goldKarat: parseInt(goldKarat),
        silverGrams,
        receivables,
        rentalIncomeCash,
      });
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const handleToggleAccount = async (accountId: number, val: boolean) => {
    setAccountZakatable(prev => ({ ...prev, [accountId]: val }));
    await fetch(`/api/bank-accounts/${accountId}/zakat`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isZakatable: val }),
      credentials: "include",
    });
    qc.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
  };

  const handleInvestmentMethod = async (invId: number, method: string) => {
    setInvestmentZakatMethod(prev => ({ ...prev, [invId]: method }));
    await fetch(`/api/investments/${invId}/zakat`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zakatMethod: method }),
      credentials: "include",
    });
    qc.invalidateQueries({ queryKey: ["/api/investments"] });
  };

  const handleSaveSnapshot = async () => {
    try {
      await saveSnapshot.mutateAsync({
        nisabStandard: settings.nisabStandard,
        goldPricePerGram: String(prices.goldPricePerGram),
        silverPricePerGram: String(prices.silverPricePerGram),
        nisabValueUsd: String(result.nisabValueUsd),
        cashTotal: String(result.breakdown.cashTotal),
        goldValue: String(result.breakdown.goldValue),
        silverValue: String(result.breakdown.silverValue),
        investmentsTotal: String(result.breakdown.investmentsTotal),
        receivablesTotal: String(result.breakdown.receivablesTotal),
        realEstateValue: String(result.breakdown.realEstateValue),
        totalZakatableAssets: String(result.breakdown.totalZakatableAssets),
        deductibleDebts: String(result.breakdown.deductibleDebts),
        netZakatable: String(result.breakdown.netZakatable),
        nisabMet: result.nisabMet,
        hawlMet: result.hawlMet,
        zakatDue: String(result.zakatDue),
        notes,
        snapshotDate: new Date().toISOString(),
      });
      toast({ title: "Snapshot saved" });
    } catch {
      toast({ title: "Failed to save snapshot", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Zakat Calculator <span className="text-muted-foreground text-lg font-normal">حاسبة الزكاة</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Calculate your annual Zakat obligation based on your financial holdings.
          </p>
        </div>
        <Button onClick={handleSaveSnapshot} disabled={saveSnapshot.isPending} data-testid="button-save-snapshot">
          <Save className="w-4 h-4 mr-2" />
          Save Snapshot
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Settings + Inputs                               */}
        {/* ============================================================ */}
        <div className="xl:col-span-2 space-y-6">

          {/* ----- Settings ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader className="cursor-pointer" onClick={() => setSettingsOpen(o => !o)}>
              <div className="flex justify-between items-center">
                <CardTitle>Settings & Prices</CardTitle>
                {settingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {settingsOpen && (
              <CardContent className="space-y-5">
                {/* Nisab standard */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Nisab Standard</label>
                  <div className="flex gap-2">
                    {(["gold", "silver"] as const).map(s => (
                      <Button
                        key={s}
                        variant={settings.nisabStandard === s ? "default" : "outline"}
                        className="capitalize"
                        onClick={() => setSettings(p => ({ ...p, nisabStandard: s }))}
                        data-testid={`button-nisab-${s}`}
                      >
                        {s === "gold" ? "🥇 Gold (85g)" : "🥈 Silver (595g)"}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gold standard (AAOIFI/contemporary) sets a higher threshold; silver standard (classical) is more conservative.
                  </p>
                </div>

                {/* Real estate mode */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Real Estate Treatment</label>
                  <Select
                    value={settings.realEstateMode}
                    onValueChange={v => setSettings(p => ({ ...p, realEstateMode: v as any }))}
                  >
                    <SelectTrigger data-testid="select-real-estate-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exempt">Exempt — Primary residence / personal use</SelectItem>
                      <SelectItem value="rental_income">Rental — Only net rental income is zakatable</SelectItem>
                      <SelectItem value="trading">Trading — Property held for resale (full market value)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">Deduct Short-term Debts</p>
                      <p className="text-xs text-muted-foreground">Debts due within 12 months</p>
                    </div>
                    <Switch
                      checked={settings.includeDebts}
                      onCheckedChange={v => setSettings(p => ({ ...p, includeDebts: v }))}
                      data-testid="switch-include-debts"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">Hawl Confirmed ✓</p>
                      <p className="text-xs text-muted-foreground">I've been above nisab for a full lunar year (354 days)</p>
                    </div>
                    <Switch
                      checked={settings.hawlMet}
                      onCheckedChange={v => setSettings(p => ({ ...p, hawlMet: v }))}
                      data-testid="switch-hawl-met"
                    />
                  </div>
                </div>

                {/* Metal prices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Metal Prices (USD per gram)</label>
                    <Button variant="outline" size="sm" onClick={fetchLivePrices} disabled={pricesLoading} data-testid="button-fetch-prices">
                      <RefreshCw className={`w-3 h-3 mr-1 ${pricesLoading ? "animate-spin" : ""}`} />
                      Fetch Live
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Gold ($/g)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices.goldPricePerGram}
                        onChange={e => setPrices(p => ({ ...p, goldPricePerGram: Number(e.target.value) }))}
                        data-testid="input-gold-price"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Silver ($/g)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        value={prices.silverPricePerGram}
                        onChange={e => setPrices(p => ({ ...p, silverPricePerGram: Number(e.target.value) }))}
                        data-testid="input-silver-price"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={saveSettings.isPending} variant="outline" className="w-full" data-testid="button-save-settings">
                  <Save className="w-4 h-4 mr-2" /> Save Settings
                </Button>
              </CardContent>
            )}
          </Card>

          {/* ----- Cash & Bank Accounts ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader><CardTitle>💵 Cash & Bank Accounts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(bankAccounts as any[]).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border dark:border-gray-800">
                  <div>
                    <p className="font-medium text-sm">{a.bankName} — {a.accountType}</p>
                    <p className="text-xs text-muted-foreground">Balance: {fmt(toUsd(a.balance, a.exchangeRateToUsd))}</p>
                  </div>
                  <Switch
                    checked={accountZakatable[a.id] !== false}
                    onCheckedChange={v => handleToggleAccount(a.id, v)}
                    data-testid={`switch-account-${a.id}`}
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium mb-1 block">Cash on Hand / E-wallets (USD)</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={cashOnHand}
                  onChange={e => setCashOnHand(e.target.value)}
                  data-testid="input-cash-on-hand"
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* ----- Gold & Silver ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader><CardTitle>🥇 Gold & Silver</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Gold (grams)</label>
                  <Input type="number" min="0" step="0.1" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} data-testid="input-gold-grams" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Gold Karat (purity)</label>
                  <Select value={goldKarat} onValueChange={setGoldKarat}>
                    <SelectTrigger data-testid="select-gold-karat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[24, 22, 21, 18, 14, 10, 9].map(k => (
                        <SelectItem key={k} value={String(k)}>{k}k ({((k / 24) * 100).toFixed(1)}% pure)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {Number(goldGrams) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Pure gold: {(Number(goldGrams) * (Number(goldKarat) / 24)).toFixed(3)}g → {fmt(Number(goldGrams) * (Number(goldKarat) / 24) * prices.goldPricePerGram)}
                </p>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Silver (grams)</label>
                <Input type="number" min="0" step="0.1" value={silverGrams} onChange={e => setSilverGrams(e.target.value)} data-testid="input-silver-grams" placeholder="0" />
              </div>
            </CardContent>
          </Card>

          {/* ----- Investments ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>📈 Investments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>For stocks/ETFs, using full market value is a conservative simplification. For pure trade goods (commodity stocks), market value is appropriate. Consult a scholar for your specific holdings.</span>
              </div>
              {(investments as any[]).filter((i: any) => i.status === "active").map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border dark:border-gray-800 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.type} — {fmt(toUsd(inv.currentValue, inv.exchangeRateToUsd))}</p>
                  </div>
                  <Select
                    value={investmentZakatMethod[inv.id] || "market_value"}
                    onValueChange={v => handleInvestmentMethod(inv.id, v)}
                  >
                    <SelectTrigger className="w-40 text-xs" data-testid={`select-inv-method-${inv.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_value">Full Market Value</SelectItem>
                      <SelectItem value="exempt">Exempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {(investments as any[]).filter((i: any) => i.status === "active").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No active investments found.</p>
              )}
            </CardContent>
          </Card>

          {/* ----- Business Receivables ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader><CardTitle>📋 Business Receivables</CardTitle></CardHeader>
            <CardContent>
              <label className="text-sm font-medium mb-1 block">Expected collectible receivables (USD)</label>
              <Input type="number" min="0" step="1" value={receivables} onChange={e => setReceivables(e.target.value)} data-testid="input-receivables" placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Include only amounts you reasonably expect to collect. Doubtful receivables may be excluded.</p>
            </CardContent>
          </Card>

          {/* ----- Real Estate (conditional) ----- */}
          {settings.realEstateMode !== "exempt" && (
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardHeader><CardTitle>🏠 Real Estate</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {settings.realEstateMode === "rental_income" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Net rental income cash on hand (USD)</label>
                    <Input type="number" min="0" step="1" value={rentalIncomeCash} onChange={e => setRentalIncomeCash(e.target.value)} data-testid="input-rental-income" placeholder="0" />
                    <p className="text-xs text-muted-foreground mt-1">Enter net rental income that has been in your possession for a full lunar year (hawl).</p>
                  </div>
                )}
                {settings.realEstateMode === "trading" && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Properties held for resale from your Assets:</p>
                    {realEstateAssets.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-2 rounded-lg border dark:border-gray-800 mb-2">
                        <span className="text-sm font-medium">{a.name}</span>
                        <span className="text-sm">{fmt(toUsd(a.currentValue, a.exchangeRateToUsd))}</span>
                      </div>
                    ))}
                    {realEstateAssets.length === 0 && (
                      <p className="text-sm text-muted-foreground">No real estate assets found. Add them on the Assets page.</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Total real estate value: {fmt(realEstateValue)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ----- Deductible Debts ----- */}
          {settings.includeDebts && (
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardHeader><CardTitle>💳 Deductible Liabilities</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Short-term debts due within 12 months. Long-term debts (mortgages etc.) typically cannot be deducted in full.</p>
                {(debts as any[]).filter((d: any) => d.status === "active").map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center py-2 border-b last:border-0 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">{d.creditorName}</p>
                      <p className="text-xs text-muted-foreground">{d.reason}</p>
                    </div>
                    <span className="text-sm font-mono text-destructive">−{fmt(toUsd(d.remainingAmount, d.exchangeRateToUsd))}</span>
                  </div>
                ))}
                {(debts as any[]).filter((d: any) => d.status === "active").length === 0 && (
                  <p className="text-sm text-muted-foreground">No active debts found.</p>
                )}
                <div className="flex justify-between items-center pt-2 font-semibold">
                  <span className="text-sm">Total deductible</span>
                  <span className="text-sm font-mono text-destructive">−{fmt(deductibleDebts)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Results                                        */}
        {/* ============================================================ */}
        <div className="space-y-6">

          {/* ----- Results Card ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 sticky top-6">
            <CardHeader>
              <CardTitle>Zakat Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {result.nisabMet
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  <span className="text-sm font-medium">Nisab {result.nisabMet ? "Met" : "Not Met"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {result.hawlMet
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  <span className="text-sm font-medium">Hawl {result.hawlMet ? "Met" : "Not Met"}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">Nisab threshold ({settings.nisabStandard})</p>
                <p className="text-lg font-bold">{fmt(result.nisabValueUsd)}</p>
              </div>

              <Separator />

              {/* Breakdown */}
              <div className="space-y-0.5">
                <InfoRow label="Cash (bank + on hand)" value={fmt(result.breakdown.cashTotal)} />
                {result.breakdown.goldValue > 0 && <InfoRow label="Gold value" value={fmt(result.breakdown.goldValue)} />}
                {result.breakdown.silverValue > 0 && <InfoRow label="Silver value" value={fmt(result.breakdown.silverValue)} />}
                {result.breakdown.investmentsTotal > 0 && <InfoRow label="Investments" value={fmt(result.breakdown.investmentsTotal)} />}
                {result.breakdown.receivablesTotal > 0 && <InfoRow label="Receivables" value={fmt(result.breakdown.receivablesTotal)} />}
                {result.breakdown.realEstateValue > 0 && <InfoRow label="Real estate" value={fmt(result.breakdown.realEstateValue)} />}
                <InfoRow label="Total zakatable assets" value={fmt(result.breakdown.totalZakatableAssets)} strong />
                {result.breakdown.deductibleDebts > 0 && (
                  <InfoRow label="Deductible debts" value={`−${fmt(result.breakdown.deductibleDebts)}`} />
                )}
                <InfoRow label="Net zakatable amount" value={fmt(result.breakdown.netZakatable)} strong />
              </div>

              <Separator />

              {/* Zakat Due */}
              <div className={`p-4 rounded-xl text-center ${result.zakatDue > 0 ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/50"}`}>
                <p className="text-sm text-muted-foreground mb-1">Zakat Due (2.5%)</p>
                <p className={`text-3xl font-bold ${result.zakatDue > 0 ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`} data-testid="text-zakat-due">
                  {result.zakatDue > 0 ? fmt(result.zakatDue) : "Not Due"}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
                <Input placeholder="e.g. Ramadan 1446" value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-notes" />
              </div>

              <Button onClick={handleSaveSnapshot} className="w-full" disabled={saveSnapshot.isPending} data-testid="button-save-snapshot-result">
                <Save className="w-4 h-4 mr-2" />
                Save Snapshot
              </Button>

              {/* Explanation */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show calculation details</summary>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {result.explanations.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              </details>
            </CardContent>
          </Card>

          {/* ----- Assumptions card ----- */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardHeader><CardTitle className="text-sm">Assumptions</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>Nisab:</strong> {settings.nisabStandard === "gold" ? "85g gold (AAOIFI contemporary)" : "595g silver (classical)"}</p>
              <p>• <strong>Debts:</strong> {settings.includeDebts ? "Short-term debts deducted" : "Debts not deducted"}</p>
              <p>• <strong>Real estate:</strong> {settings.realEstateMode === "exempt" ? "Exempt" : settings.realEstateMode === "rental_income" ? "Rental income only" : "Trading inventory (full market value)"}</p>
              <p>• <strong>Investments:</strong> Full market value (conservative simplification)</p>
              <p>• <strong>Gold price:</strong> ${prices.goldPricePerGram}/g | <strong>Silver:</strong> ${prices.silverPricePerGram}/g</p>
              <p className="pt-1 italic">This calculator provides an estimate. Consult a qualified Islamic scholar for your specific situation.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Snapshot History                                              */}
      {/* ============================================================ */}
      {snapshots && (snapshots as any[]).length > 0 && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mt-6">
          <CardHeader><CardTitle>📁 Snapshot History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Nisab</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Net Zakatable</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Zakat Due</th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Notes</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(snapshots as any[]).map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0 dark:border-gray-800 hover:bg-muted/30" data-testid={`snapshot-row-${s.id}`}>
                      <td className="py-2 px-3 text-muted-foreground">{format(new Date(s.createdAt), "dd MMM yyyy")}</td>
                      <td className="py-2 px-3 capitalize">
                        <Badge variant="outline">{s.nisabStandard}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(Number(s.netZakatable))}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-green-700 dark:text-green-400">
                        {Number(s.zakatDue) > 0 ? fmt(Number(s.zakatDue)) : "—"}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{s.notes || "—"}</td>
                      <td className="py-2 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteSnapshot.mutate(s.id)}
                          data-testid={`button-delete-snapshot-${s.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}

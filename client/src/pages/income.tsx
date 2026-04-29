import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { useTransactions, useCategories, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { format, subYears, startOfYear } from "date-fns";
import {
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar,
  BarChart3, Star, Search, Download, ArrowUpDown, Edit3, X,
  Sparkles, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { z } from "zod";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const PURPLE = "#8B5CF6";
const DANGER = "#EF4444";

const CAT_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  salary:      { color: "#10B981", bg: "#ECFDF5", label: "Salary" },
  freelance:   { color: BRAND,     bg: "#EEF4FF", label: "Freelance" },
  investments: { color: PURPLE,    bg: "#F5F3FF", label: "Investments" },
  investment:  { color: PURPLE,    bg: "#F5F3FF", label: "Investment" },
  dividends:   { color: PURPLE,    bg: "#F5F3FF", label: "Dividends" },
  rental:      { color: AMBER,     bg: "#FFFBEB", label: "Rental" },
  business:    { color: "#6366F1", bg: "#EEF2FF", label: "Business" },
  bonus:       { color: "#EC4899", bg: "#FDF2F8", label: "Bonus" },
  other:       { color: "#64748B", bg: "#F1F5F9", label: "Other" },
};

function catStyle(name: string) {
  const key = Object.keys(CAT_COLORS).find(k => name?.toLowerCase().includes(k)) || "other";
  return CAT_COLORS[key];
}

const CHART_PALETTE = [BRAND, MINT, PURPLE, AMBER, "#EF4444", "#06B6D4", "#EC4899", "#84CC16"];
const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── form schema ── */
const txSchema = insertTransactionSchema.extend({
  amount:            z.string().refine(v => Number(v) > 0, "Must be positive"),
  currencyCode:      z.string().default("USD"),
  exchangeRateToUsd: z.string().default("1"),
  date:              z.string(),
});
type TxValues = z.infer<typeof txSchema>;

/* ── Add Income dialog ── */
function AddIncomeDialog({ incomeCategories, userId, onSuccess }: {
  incomeCategories: any[];
  userId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const createTx = useCreateTransaction();
  const { toast } = useToast();
  const { t } = useI18n();

  const form = useForm<TxValues>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      userId,
      description: "",
      amount: "",
      categoryId: undefined as any,
      date: new Date().toISOString().split("T")[0],
      currencyCode: "USD",
      exchangeRateToUsd: "1",
    },
  });

  const onSubmit = async (v: TxValues) => {
    try {
      await createTx.mutateAsync({ ...v, userId, amount: v.amount, categoryId: Number(v.categoryId) });
      toast({ title: t("common.saveSuccess"), description: `${v.description} recorded successfully.` });
      setOpen(false);
      form.reset();
      onSuccess();
    } catch {
      toast({ title: t("common.errorGeneric"), description: "Failed to add income.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl shadow-sm" style={{ backgroundColor: BRAND }} data-testid="button-add-income">
          <Plus className="w-4 h-4" /> {t("income.addIncome")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("income.addIncome")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.description")}</FormLabel>
                <FormControl><Input placeholder={t("income.descriptionPlaceholder")} {...field} data-testid="input-description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.amount")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder={t("income.amountPlaceholder")} {...field} data-testid="input-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.category")}</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={v => field.onChange(Number(v))}>
                  <FormControl>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder={t("common.search")} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {incomeCategories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <CurrencyFields form={form} />
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }}
                disabled={createTx.isPending} data-testid="button-save-income">
                {createTx.isPending ? t("common.saving") : t("income.addIncome")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, icon: Icon, color, bg, trend, trendUp }: {
  label: string; value: string; sub?: string;
  icon: any; color: string; bg: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}99, transparent)` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── custom tooltip ── */
function ChartTip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

/* ── main page ── */
export default function IncomePage() {
  const { user }    = useAuth();
  const { formatAmount } = useCurrency();
  const { toast }   = useToast();
  const { t, lang, isRtl } = useI18n();

  const { data: transactions = [] } = useTransactions();
  const { data: categories   = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const [selectedYear,   setSelectedYear]   = useState(new Date().getFullYear());
  const [chartView,      setChartView]      = useState<"chart"|"table">("chart");
  const [search,         setSearch]         = useState("");
  const [catFilter,      setCatFilter]      = useState("all");
  const [sortKey,        setSortKey]        = useState<"date"|"amount"|"category">("date");
  const [sortDir,        setSortDir]        = useState<"asc"|"desc">("desc");
  const [page,           setPage]           = useState(1);
  const [insightDismiss, setInsightDismiss] = useState(false);
  const PAGE_SIZE = 10;

  const allTx   = transactions as any[];
  const allCats = categories  as any[];

  const incomeCats    = useMemo(() => allCats.filter((c: any) => c.type === "income"), [allCats]);
  const incomeCatIds  = useMemo(() => new Set(incomeCats.map((c: any) => c.id)), [incomeCats]);
  const catMap        = useMemo(() => Object.fromEntries(allCats.map((c: any) => [c.id, c])), [allCats]);

  const allIncome     = useMemo(() => allTx.filter(t => incomeCatIds.has(t.categoryId)), [allTx, incomeCatIds]);

  /* year filtered */
  const yearIncome    = useMemo(() =>
    allIncome.filter(t => new Date(t.date).getFullYear() === selectedYear),
    [allIncome, selectedYear]
  );

  /* prev year for trend */
  const prevYearIncome = useMemo(() =>
    allIncome.filter(t => new Date(t.date).getFullYear() === selectedYear - 1),
    [allIncome, selectedYear]
  );

  /* totals */
  const totalIncome   = useMemo(() => yearIncome.reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [yearIncome]);
  const prevTotal     = useMemo(() => prevYearIncome.reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [prevYearIncome]);
  const trendPct      = prevTotal > 0 ? ((totalIncome - prevTotal) / prevTotal) * 100 : null;

  const curMonth      = new Date().getMonth();
  const curMonthIncome = useMemo(() =>
    yearIncome.filter(t => new Date(t.date).getMonth() === curMonth)
      .reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0),
    [yearIncome, curMonth]
  );

  const monthlyAvg = totalIncome / 12;

  /* monthly chart data */
  const monthlyData = useMemo(() => {
    const totals: number[] = Array(12).fill(0);
    yearIncome.forEach(t => { totals[new Date(t.date).getMonth()] += toUsd(Number(t.amount), Number(t.exchangeRateToUsd)); });
    return MONTHS_SHORT.map((m, i) => ({ month: m, income: totals[i] }));
  }, [yearIncome]);

  const highestMonth  = useMemo(() => [...monthlyData].sort((a, b) => b.income - a.income)[0], [monthlyData]);
  const lowestMonth   = useMemo(() => [...monthlyData].filter(m => m.income > 0).sort((a, b) => a.income - b.income)[0], [monthlyData]);

  /* category donut */
  const catBreakdown = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    yearIncome.forEach(t => {
      const cat = catMap[t.categoryId]?.name || "Other";
      if (!map[cat]) map[cat] = { name: cat, value: 0 };
      map[cat].value += toUsd(Number(t.amount), Number(t.exchangeRateToUsd));
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [yearIncome, catMap]);

  /* top source */
  const topSource = catBreakdown[0];

  /* unique cat names for filter pills */
  const catNames = useMemo(() => ["all", ...new Set(yearIncome.map(t => catMap[t.categoryId]?.name).filter(Boolean))], [yearIncome, catMap]);

  /* table data */
  const tableRows = useMemo(() => {
    let rows = [...yearIncome].map(t => ({
      ...t,
      catName:   catMap[t.categoryId]?.name || "Other",
      amountUsd: toUsd(Number(t.amount), Number(t.exchangeRateToUsd)),
    }));
    if (catFilter !== "all") rows = rows.filter(r => r.catName === catFilter);
    if (search) rows = rows.filter(r => r.description?.toLowerCase().includes(search.toLowerCase()) || r.catName.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "date")     diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortKey === "amount")   diff = a.amountUsd - b.amountUsd;
      if (sortKey === "category") diff = a.catName.localeCompare(b.catName);
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  }, [yearIncome, catMap, catFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);
  const pageRows   = tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await deleteTransaction.mutateAsync(id);
    toast({ title: t("common.deleteSuccess") });
  };

  const exportCSV = () => {
    const rows = tableRows.map(r => [
      format(new Date(r.date), "yyyy-MM-dd"),
      r.description || "",
      r.catName,
      r.amount,
      r.currencyCode,
      r.amountUsd.toFixed(2),
    ]);
    const csv = [["Date","Description","Category","Amount","Currency","USD Value"], ...rows]
      .map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `income-${selectedYear}.csv`; a.click();
  };

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("income.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("income.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* year selector */}
            <Select value={String(selectedYear)} onValueChange={v => { setSelectedYear(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-9 w-24 text-xs rounded-xl border-gray-200 dark:border-gray-700" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-9 text-xs" onClick={exportCSV} data-testid="button-export">
              <Download className="w-3.5 h-3.5" /> {t("reports.exportCsv")}
            </Button>

            <AddIncomeDialog
              incomeCategories={incomeCats}
              userId={user?.id ?? ""}
              onSuccess={() => {}}
            />
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={`${t("income.totalIncome")} ${selectedYear}`}
            value={formatAmount(totalIncome)}
            icon={DollarSign}
            color="#10B981"
            bg="#ECFDF5"
            trend={trendPct !== null ? `${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}% vs ${selectedYear - 1}` : undefined}
            trendUp={trendPct !== null ? trendPct >= 0 : undefined}
          />
          <KpiCard
            label={t("common.thisMonth")}
            value={formatAmount(curMonthIncome)}
            icon={Calendar}
            color={BRAND}
            bg="#EEF4FF"
            sub={curMonthIncome === 0 ? t("income.noEntries") : `${MONTHS_SHORT[curMonth]} ${selectedYear}`}
            trend={monthlyAvg > 0 && curMonthIncome < monthlyAvg
              ? `↘ ${formatAmount(monthlyAvg - curMonthIncome)} below avg` : undefined}
            trendUp={false}
          />
          <KpiCard
            label={t("income.monthlyAverage")}
            value={formatAmount(monthlyAvg)}
            sub="Based on 12 months"
            icon={BarChart3}
            color={PURPLE}
            bg="#F5F3FF"
          />
          <KpiCard
            label={t("dashboard.topSpending")}
            value={topSource?.name || "—"}
            sub={topSource ? `${formatAmount(topSource.value)} · ${totalIncome > 0 ? ((topSource.value / totalIncome) * 100).toFixed(0) : 0}% of total` : t("income.noEntries")}
            icon={Star}
            color={AMBER}
            bg="#FFFBEB"
          />
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* monthly bar chart — 2/3 width */}
          <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-monthly-chart">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">{t("income.incomeEntries")}</h3>
                  <p className="text-xs text-gray-400">{selectedYear}</p>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {(["chart","table"] as const).map(v => (
                    <button key={v} onClick={() => setChartView(v)}
                      className="px-3 py-1 rounded-md text-xs font-medium transition-all capitalize"
                      style={chartView === v ? { backgroundColor: BRAND, color: "#fff" } : { color: "#64748B" }}>
                      {v === "chart" ? t("common.actions") : t("common.viewAll")}
                    </button>
                  ))}
                </div>
              </div>

              {chartView === "chart" ? (
                <>
                  {yearIncome.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                      {t("income.noEntries")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyData} barCategoryGap="35%">
                        <defs>
                          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={MINT} stopOpacity={1} />
                            <stop offset="100%" stopColor={MINT} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                        <Tooltip content={<ChartTip fmt={formatAmount} />} cursor={{ fill: "#f8faff" }} />
                        <Bar dataKey="income" name={t("nav.income")} fill="url(#incGrad)" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {/* summary row */}
                  {yearIncome.length > 0 && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-500">
                      {highestMonth && <span>📈 Highest: <strong className="text-gray-700 dark:text-gray-300">{highestMonth.month}</strong> · {formatAmount(highestMonth.income)}</span>}
                      {lowestMonth  && <span>📉 Lowest: <strong className="text-gray-700 dark:text-gray-300">{lowestMonth.month}</strong> · {formatAmount(lowestMonth.income)}</span>}
                      <span className="ms-auto">{t("common.total")}: <strong style={{ color: MINT }}>{formatAmount(totalIncome)}</strong></span>
                    </div>
                  )}
                </>
              ) : (
                /* table view */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="py-2 px-3 text-left text-gray-500 font-semibold uppercase tracking-wide">{t("common.month")}</th>
                        <th className="py-2 px-3 text-right text-gray-500 font-semibold uppercase tracking-wide">{t("nav.income")}</th>
                        <th className="py-2 px-3 text-right text-gray-500 font-semibold uppercase tracking-wide">{t("common.percentage")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row, i) => (
                        <tr key={i} className={`border-b border-gray-50 dark:border-gray-800 ${row.income === 0 ? "opacity-40" : ""}`}>
                          <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">{row.month}</td>
                          <td className="py-2 px-3 text-right font-bold tabular-nums" style={{ color: row.income > 0 ? MINT : "#94a3b8" }}>{formatAmount(row.income)}</td>
                          <td className="py-2 px-3 text-right text-gray-400">{totalIncome > 0 ? ((row.income / totalIncome) * 100).toFixed(1) + "%" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* income by category donut — 1/3 width */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-category-donut">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{t("expenses.byCategory")}</h3>
              <p className="text-xs text-gray-400 mb-4">{selectedYear} breakdown</p>
              {catBreakdown.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">{t("income.noEntries")}</div>
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={catBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                          {catBreakdown.map((_: any, i: number) => (
                            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTip fmt={formatAmount} />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-gray-400">{t("common.total")}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatAmount(totalIncome)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    {catBreakdown.slice(0, 5).map((d: any, i: number) => {
                      const pct = totalIncome > 0 ? ((d.value / totalIncome) * 100).toFixed(0) : "0";
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{formatAmount(d.value)}</span>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── SMART INSIGHTS BANNER ── */}
        {!insightDismiss && yearIncome.length > 0 && (
          <div className="rounded-2xl p-4 flex items-start justify-between gap-4 border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-[#EEF4FF] to-[#F5F3FF] dark:from-[#0F1A30] dark:to-[#1A1630]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${BRAND}22` }}>
                <Sparkles className="w-4 h-4" style={{ color: BRAND }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("aiReports.insights")}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {topSource
                    ? `Your top income source is ${topSource.name} (${totalIncome > 0 ? ((topSource.value / totalIncome) * 100).toFixed(0) : 0}% of total). Consider diversifying to reduce dependency on a single source.`
                    : t("income.noEntries")}
                </p>
              </div>
            </div>
            <button onClick={() => setInsightDismiss(true)} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── INCOME ENTRIES TABLE ── */}
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-income-entries">
          <CardContent className="p-5">
            {/* table header */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">{t("income.incomeEntries")}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {tableRows.length} {t("income.incomeEntries").toLowerCase()}
                </span>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {/* search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input placeholder={t("common.search")} value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="ps-8 h-8 text-xs w-44 rounded-xl" data-testid="input-search" />
                </div>
              </div>
            </div>

            {/* category filter pills */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {catNames.map(name => (
                <button key={name} onClick={() => { setCatFilter(name); setPage(1); }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize"
                  style={catFilter === name
                    ? { backgroundColor: BRAND, color: "#fff" }
                    : { backgroundColor: "#F1F5F9", color: "#64748B" }}
                  data-testid={`filter-cat-${name}`}>
                  {name === "all" ? t("common.all") : name}
                </button>
              ))}
            </div>

            {/* empty state */}
            {yearIncome.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-green-400" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{t("income.noEntries")}</p>
                <p className="text-sm text-gray-400">Add your first income entry to start tracking.</p>
                <AddIncomeDialog incomeCategories={incomeCats} userId={user?.id ?? ""} onSuccess={() => {}} />
              </div>
            ) : tableRows.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                {t("common.noData")}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <th className="py-2.5 px-4 text-left">
                          <button onClick={() => toggleSort("date")} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors" data-testid="sort-date">
                            {t("common.date")} <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">{t("common.description")}</th>
                        <th className="py-2.5 px-4 text-left">
                          <button onClick={() => toggleSort("category")} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors" data-testid="sort-category">
                            {t("common.category")} <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-2.5 px-4 text-right">
                          <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 ms-auto text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors" data-testid="sort-amount">
                            {t("common.amount")} <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-2.5 px-4 text-right text-[10px] font-bold uppercase tracking-wide text-gray-500">USD Value</th>
                        <th className="py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {pageRows.map((t: any) => {
                        const style = catStyle(t.catName);
                        const curr  = t.currencyCode || "USD";
                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group" data-testid={`row-income-${t.id}`}>
                            <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                              {format(new Date(t.date), "MMM d, yyyy")}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.description || "—"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{curr}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: style.bg, color: style.color }}>
                                {t.catName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold tabular-nums" style={{ color: MINT }}>
                              +{getCurrencySymbol(curr)}<span dir="ltr">{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs text-gray-400 tabular-nums">
                              {curr !== "USD" ? <span dir="ltr">{formatAmount(t.amountUsd)}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors"
                                  onClick={() => handleDelete(t.id)}
                                  data-testid={`button-delete-${t.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* pagination */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-xs text-gray-400">
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, tableRows.length)}–{Math.min(page * PAGE_SIZE, tableRows.length)} of {tableRows.length}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
                            style={page === p ? { backgroundColor: BRAND, color: "#fff" } : { color: "#64748B" }}>
                            {p}
                          </button>
                        );
                      })}
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── RECURRING INCOME CARD ── */}
        {yearIncome.length > 0 && (() => {
          /* find top 3 most frequent descriptions as "recurring" proxy */
          const freq: Record<string, { desc: string; cat: string; amt: number; count: number }> = {};
          yearIncome.forEach(t => {
            const k = t.description?.toLowerCase() || "";
            if (!freq[k]) freq[k] = { desc: t.description || "", cat: catMap[t.categoryId]?.name || "Other", amt: toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), count: 0 };
            freq[k].count++;
          });
          const recurring = Object.values(freq).filter(f => f.count >= 2).sort((a, b) => b.count - a.count).slice(0, 4);
          if (recurring.length === 0) return null;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recurring.map((f, i) => (
                <Card key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("income.recurringIncome")}</p>
                        <p className="font-bold text-gray-900 dark:text-white truncate">{f.desc}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{f.cat}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{formatAmount(f.amt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
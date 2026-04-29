import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useTransactions, useCategories, useCreateTransaction, useDeleteTransaction,
  useBudgets,
} from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { format, getDaysInMonth } from "date-fns";
import {
  Plus, Trash2, AlertTriangle, Wallet, TrendingDown, Calculator, Shield,
  Sparkles, X, AlertCircle, ChevronRight, CheckCircle2, MoreHorizontal,
  PiggyBank,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const PURPLE = "#8B5CF6";
const DANGER = "#EF4444";

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string; sub?: string;
  icon: any; color: string; bg: string;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white" dir="ltr">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1 truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const DONUT_COLORS = [BRAND, MINT, AMBER, DANGER, PURPLE, "#EC4899", "#F97316", "#14B8A6", "#6366F1", "#A855F7", "#64748B"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const deleteTransaction  = useDeleteTransaction();
  const { toast }          = useToast();
  const { formatAmount }   = useCurrency();
  const { t, lang, isRtl } = useI18n();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [showForm,      setShowForm]      = useState(false);
  const [catFilter,     setCatFilter]     = useState<number | "all">("all");
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    date: now.toISOString().split("T")[0],
    currencyCode: "USD",
    exchangeRateToUsd: "1",
  });

  const MONTHS = useMemo(() => lang === "ar"
    ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"],
  [lang]);

  const { data: budgets = [] } = useBudgets();
  const budgetMap = useMemo(() => new Map(budgets.map(b => [b.categoryId, Number(b.limit)])), [budgets]);

  /* filtered transactions */
  const monthTx = useMemo(() => {
    if (!transactions) return [];
    return (transactions as any[]).filter(t => {
      const d = new Date(t.date);
      return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const expenseCategories = useMemo(() =>
    (categories as any[])?.filter(c => c.type === "expense") || [], [categories]);

  const expenseCatIds = useMemo(() => new Set(expenseCategories.map(c => c.id)), [expenseCategories]);

  const expenseTx = useMemo(() => monthTx.filter(t => expenseCatIds.has(t.categoryId)), [monthTx, expenseCatIds]);
  const incomeTx  = useMemo(() => monthTx.filter(t => !expenseCatIds.has(t.categoryId)), [monthTx, expenseCatIds]);

  const totalExpenses = useMemo(() => expenseTx.reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [expenseTx]);
  const totalIncome   = useMemo(() => incomeTx.reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [incomeTx]);
  const remaining     = totalIncome - totalExpenses;

  const daysInMonth   = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
  const dayOfMonth    = (selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()) ? now.getDate() : daysInMonth;
  const daysLeft      = daysInMonth - dayOfMonth;

  /* budget status by category */
  const catData = useMemo(() => {
    return expenseCategories.map(c => {
      const spent = expenseTx.filter(t => t.categoryId === c.id).reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0);
      const limit = budgetMap.get(c.id) || 0;
      const pct   = limit > 0 ? (spent / limit) * 100 : 0;
      const txCount = expenseTx.filter(t => t.categoryId === c.id).length;
      let status: "safe" | "warning" | "danger" = "safe";
      if (limit > 0) {
        if (pct >= 100) status = "danger";
        else if (pct >= 85) status = "warning";
      }
      return { cat: c, spent, limit, pct, status, txCount };
    }).sort((a, b) => b.spent - a.spent);
  }, [expenseCategories, expenseTx, budgetMap]);

  const atRisk     = catData.filter(d => d.status !== "safe").length;
  const dangerCats = catData.filter(d => d.status === "danger");
  const warnCats   = catData.filter(d => d.status === "warning");

  /* chart: daily spending */
  const dailyChartData = useMemo(() => {
    const days: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) days[i] = 0;
    expenseTx.forEach(t => {
      const day = new Date(t.date).getDate();
      days[day] += toUsd(Number(t.amount), Number(t.exchangeRateToUsd));
    });
    return Object.entries(days).map(([day, amount]) => ({ day, amount }));
  }, [expenseTx, daysInMonth]);

  /* chart: cat donut */
  const donutData = useMemo(() => {
    return catData.filter(d => d.spent > 0).map((d, i) => ({
      name: d.cat.name,
      value: d.spent,
      color: d.cat.color || DONUT_COLORS[i % DONUT_COLORS.length]
    }));
  }, [catData]);

  const displayTx = useMemo(() => {
    let list = [...expenseTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (catFilter !== "all") list = list.filter(t => t.categoryId === catFilter);
    return list;
  }, [expenseTx, catFilter]);

  /* submit */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.categoryId) return;
    try {
      await createTransaction.mutateAsync({
        userId: user!.id,
        description: formData.description,
        amount: formData.amount,
        categoryId: Number(formData.categoryId),
        date: new Date(formData.date),
        currencyCode: formData.currencyCode,
        exchangeRateToUsd: formData.exchangeRateToUsd,
      });
      setFormData({ description: "", amount: "", categoryId: "", date: now.toISOString().split("T")[0], currencyCode: "USD", exchangeRateToUsd: "1" });
      setShowForm(false);
      toast({ title: t("common.saveSuccess") });
    } catch { toast({ title: t("common.errorGeneric"), variant: "destructive" }); }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── BUDGET ALERT BANNER ── */}
        {!alertDismissed && atRisk > 0 && (
          <div className="rounded-2xl p-4 flex items-center justify-between border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  🚨 {atRisk} {t("budget.overBudget").toLowerCase()} alert{atRisk > 1 ? "s" : ""} active
                </p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {dangerCats.slice(0, 3).map(d => (
                    <span key={d.cat.id} className="text-[11px] px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-full font-medium">
                      🔴 {d.cat.name} {d.spent > d.limit ? `·$${(d.spent - d.limit).toFixed(0)} over` : `·${d.pct.toFixed(0)}% used`}
                    </span>
                  ))}
                  {warnCats.slice(0, 2).map(d => (
                    <span key={d.cat.id} className="text-[11px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                      🟡 {d.cat.name} ·{d.pct.toFixed(0)}% used
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href="/budget" className="text-xs font-semibold text-red-600 flex items-center gap-0.5 hover:underline">
                {t("budget.setupBudget")} <ChevronRight className="w-3 h-3" />
              </a>
              <button onClick={() => setAlertDismissed(true)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-red-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {!alertDismissed && atRisk === 0 && catData.length > 0 && (
          <div className="rounded-2xl p-3 flex items-center gap-2 border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t("budget.onTrack")} — {MONTHS[selectedMonth - 1]}. Great work!
            <button onClick={() => setAlertDismissed(true)} className="ms-auto text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">{t("expenses.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("expenses.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-32 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-24 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl h-9" style={{ backgroundColor: BRAND }} data-testid="button-add-expense">
              <Plus className="w-4 h-4" /> {t("expenses.addExpense")}
            </Button>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t("expenses.thisMonth")} value={formatAmount(totalIncome)} sub="From income transactions" icon={Wallet} color={MINT} bg="#ECFDF5" />
          <KpiCard label={t("expenses.totalExpenses")} value={formatAmount(totalExpenses)} sub={totalIncome > 0 ? `${((totalExpenses/totalIncome)*100).toFixed(0)}% of income` : `${expenseTx.length} transactions`} icon={TrendingDown} color={DANGER} bg="#FEF2F2" />
          <KpiCard label={t("expenses.remaining")} value={formatAmount(Math.abs(remaining))} sub={remaining < 0 ? "⚠ Over income" : daysLeft > 0 ? `${formatAmount(remaining / Math.max(1, daysLeft))}/day · ${daysLeft}d left` : "Month complete"} icon={Calculator} color={remaining >= 0 ? BRAND : DANGER} bg="#EEF4FF" />
          <KpiCard label={t("aiReports.financialHealth")} value={atRisk > 0 ? `${atRisk} Alert${atRisk > 1 ? "s" : ""}` : "All Safe ✅"} sub={`${warnCats.length} warning · ${dangerCats.length} over`} icon={Shield} color={atRisk > 0 ? DANGER : MINT} bg={atRisk > 0 ? "#FEF2F2" : "#ECFDF5"} />
        </div>

        {/* ── BUDGET VS ACTUAL ── */}
        {catData.length > 0 && (
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {t("expenses.budgetVsActual")} — {MONTHS[selectedMonth - 1]} {selectedYear}
                </h3>
                <a href="/budget" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: BRAND }}>
                  {t("budget.editBudget")} <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-3">
                {catData.map(({ cat, spent, limit, pct, status }) => {
                  const barColor = status === "danger" ? DANGER : status === "warning" ? AMBER : MINT;
                  const borderColor = status === "danger" ? "#FCA5A5" : status === "warning" ? "#FCD34D" : "#E2E8F0";
                  return (
                    <div key={cat.id} className="flex items-center gap-4 rounded-xl p-3 border transition-colors" style={{ borderColor, backgroundColor: status === "danger" ? "#FEF2F280" : status === "warning" ? "#FFFBEB80" : "transparent" }}>
                      <div className="flex items-center gap-2.5 w-36 shrink-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (cat.color || "#64748B") + "22" }}>
                          <PiggyBank className="w-3.5 h-3.5" style={{ color: cat.color || "#64748B" }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{cat.name}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{t("expenses.spent")} {formatAmount(spent)}</span>
                          {limit > 0 && <span>{t("expenses.budget")} {formatAmount(limit)}</span>}
                        </div>
                        <div className="h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                          {limit > 0 ? (
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                          ) : (
                            <div className="h-full rounded-full" style={{ width: "20%", backgroundColor: "#E2E8F0" }} />
                          )}
                        </div>
                      </div>
                      <div className="text-right w-24 shrink-0">
                        <p className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                          {limit > 0 ? `${pct.toFixed(0)}%` : t("common.none")}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {limit > 0 && spent > limit ? `over by ${formatAmount(spent - limit)}` : limit > 0 ? `${formatAmount(limit - spent)} left` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* summary strip */}
              {catData.length > 0 && (() => {
                const totalBudget = catData.reduce((s, d) => s + d.limit, 0);
                const totalSpent  = catData.reduce((s, d) => s + d.spent, 0);
                return totalBudget > 0 ? (
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between text-xs text-gray-500">
                    <span>{t("common.total")}: <strong className="text-gray-700 dark:text-gray-300">{formatAmount(totalSpent)}</strong> of <strong>{formatAmount(totalBudget)}</strong></span>
                    <span style={{ color: totalSpent > totalBudget ? DANGER : MINT }}>
                      {totalSpent > totalBudget ? `${formatAmount(totalSpent - totalBudget)} over` : `${formatAmount(totalBudget - totalSpent)} remaining`}
                    </span>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        )}

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* daily spending bar chart */}
          <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">{t("dashboard.cashflowTrend")} — {MONTHS[selectedMonth - 1]}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyChartData} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => Number(v) % 5 === 0 ? v : ""} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip formatter={(v: any) => [formatAmount(v), t("expenses.spent")]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="amount" fill={DANGER} radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* category donut */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-3">{t("expenses.byCategory")}</h3>
              {donutData.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <PieChart width={160} height={160}>
                        <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                          {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-gray-400">{t("common.total").toLowerCase()}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums" dir="ltr">{formatAmount(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {donutData.slice(0, 4).map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-600 dark:text-gray-400 truncate">{d.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300" dir="ltr">{formatAmount(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">{t("expenses.noEntries")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── EXPENSE TABLE ── */}
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                {t("expenses.expenseEntries")}
                <span className="ms-2 text-xs font-normal text-gray-400">({expenseTx.length} {t("expenses.expenseEntries").toLowerCase()})</span>
              </h3>
              {/* category filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setCatFilter("all")}
                  className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all", catFilter !== "all" && "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}
                  style={catFilter === "all" ? { backgroundColor: BRAND, color: "#fff" } : {}}>
                  {t("common.all")} ({expenseTx.length})
                </button>
                {catData.filter(d => d.txCount > 0).slice(0, 5).map(d => (
                  <button key={d.cat.id} onClick={() => setCatFilter(catFilter === d.cat.id ? "all" : d.cat.id)}
                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all", catFilter !== d.cat.id && "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}
                    style={catFilter === d.cat.id ? { backgroundColor: d.cat.color || BRAND, color: "#fff" } : {}}>
                    {d.cat.name} ({d.txCount})
                  </button>
                ))}
              </div>
            </div>

            {displayTx.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">{t("expenses.noEntries")}</p>
                <Button onClick={() => setShowForm(true)} className="mt-3 gap-1.5 rounded-xl" style={{ backgroundColor: BRAND }}>
                  <Plus className="w-4 h-4" /> {t("expenses.addExpense")}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {[t("common.date"), t("common.description"), t("common.category"), t("common.amount"), ""].map((h, i) => (
                        <th key={i} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 3 || i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTx.map((t: any) => {
                      const cat = (categories as any[])?.find(c => c.id === t.categoryId);
                      const isOverBudgetTx = (() => {
                        if (!cat) return false;
                        const limit = budgetMap.get(cat.id);
                        const d = catData.find(d => d.cat.id === cat.id);
                        return limit && d && d.spent > limit;
                      })();
                      return (
                        <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors border-b border-gray-50 dark:border-gray-900 last:border-0">
                          <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap text-xs">{format(new Date(t.date), "MMM d")}</td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-gray-900 dark:text-white text-xs">{t.description}</p>
                            {isOverBudgetTx && <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Over Budget</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat?.color || BRAND }} />
                              {cat?.name || "Other"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <p className="text-xs font-bold tabular-nums text-gray-900 dark:text-white" dir="ltr">{formatAmount(toUsd(Number(t.amount), Number(t.exchangeRateToUsd)))}</p>
                            {t.currencyCode !== "USD" && <p className="text-[9px] text-gray-400 tabular-nums">{t.amount} {t.currencyCode}</p>}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button onClick={async () => {
                              if (confirm("Delete entry?")) {
                                await deleteTransaction.mutateAsync(t.id);
                                toast({ title: "Deleted" });
                              }
                            }} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SMART INSIGHTS ── */}
        <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 bg-gradient-to-br from-[#F5F3FF] to-[#EEF4FF] dark:from-[#1A1630] dark:to-[#0F1A30]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: PURPLE }} />
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">{t("aiReports.insights")}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dangerCats.length > 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📊 Over-budget alert</p>
                  <p className="text-gray-500">{dangerCats[0].cat.name} exceeded budget by {formatAmount(dangerCats[0].spent - dangerCats[0].limit)}. Consider adjusting your limit or reducing spending.</p>
                  <a href="/budget" className="mt-2 font-semibold text-blue-600 flex items-center gap-0.5">Review <ChevronRight className="w-3 h-3" /></a>
                </div>
              ) : (
                <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">✅ On budget</p>
                  <p className="text-gray-500">All categories are within their limits this month. Great financial discipline!</p>
                </div>
              )}
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">💡 Spending pace</p>
                <p className="text-gray-500">
                  {totalExpenses > 0 && daysLeft > 0
                    ? `At ${formatAmount(totalExpenses / Math.max(1, dayOfMonth))}/day, you'll spend ${formatAmount((totalExpenses / Math.max(1, dayOfMonth)) * daysInMonth)} by month end.`
                    : "Add expenses to track your spending pace."}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">⚡ Top category</p>
                <p className="text-gray-500">
                  {donutData.length > 0
                    ? `${donutData[0].name} is your biggest spend at ${formatAmount(donutData[0].value)} (${totalExpenses > 0 ? ((donutData[0].value / totalExpenses) * 100).toFixed(0) : 0}% of total).`
                    : "No expenses logged yet this month."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── ADD EXPENSE DIALOG ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("expenses.addExpense")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.description")}</label>
              <Input placeholder={t("expenses.descriptionPlaceholder")} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} data-testid="input-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.amount")}</label>
                <Input type="number" step="0.01" placeholder={t("expenses.amountPlaceholder")} value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} data-testid="input-amount" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.date")}</label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} data-testid="input-date" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.category")}</label>
              <Select value={formData.categoryId || undefined} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger data-testid="select-category"><SelectValue placeholder={t("common.search")} /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <CurrencyFields
              currencyCode={formData.currencyCode}
              exchangeRate={formData.exchangeRateToUsd}
              amount={formData.amount}
              onCurrencyChange={code => setFormData(p => ({ ...p, currencyCode: code }))}
              onExchangeRateChange={rate => setFormData(p => ({ ...p, exchangeRateToUsd: rate }))}
              showUsdPreview={true}
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={createTransaction.isPending} data-testid="button-submit-expense">
                {createTransaction.isPending ? t("common.saving") : t("expenses.addExpense")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
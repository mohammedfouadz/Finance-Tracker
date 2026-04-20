import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useTransactions, useCategories, useBudgets,
  useCreateBudget, useUpdateBudget,
} from "@/hooks/use-finance";
import { useCurrency, toUsd } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronLeft, ChevronRight, Save, PiggyBank, AlertTriangle,
  TrendingDown, Wallet, PieChart, Sparkles, ArrowRight, Plus,
  CheckCircle2, AlertCircle, MoreHorizontal,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { getDaysInMonth, format } from "date-fns";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const DANGER = "#EF4444";
const PURPLE = "#8B5CF6";

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

type BudgetStatus = "safe" | "warning" | "danger";

function getStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return "safe";
  const pct = spent / limit;
  if (pct >= 0.95) return "danger";
  if (pct >= 0.75) return "warning";
  return "safe";
}

const STATUS_STYLE = {
  safe:    { bar: MINT,   border: "#E2E8F0",  bg: "transparent",  label: "On Track",         pill: "bg-emerald-50 text-emerald-700" },
  warning: { bar: AMBER,  border: "#FCD34D",  bg: "#FFFBEB80",    label: "Approaching Limit", pill: "bg-amber-50 text-amber-700" },
  danger:  { bar: DANGER, border: "#FCA5A5",  bg: "#FEF2F280",    label: "Over Budget",       pill: "bg-red-50 text-red-600" },
};

/* ── KPI card ── */
function KpiCard({ label, value, sub, icon: Icon, color, bg, extra }: {
  label: string; value: string; sub?: string; icon: any;
  color: string; bg: string; extra?: React.ReactNode;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all">
      <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}88, transparent)` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {extra}
      </CardContent>
    </Card>
  );
}

/* ── budget category row ── */
function BudgetRow({
  category, spent, limit, txCount, editingValue, onEdit, onSave, isSaving,
}: {
  category: any; spent: number; limit: number; txCount: number;
  editingValue: string | undefined;
  onEdit: (v: string) => void; onSave: () => void; isSaving: boolean;
}) {
  const { formatAmount } = useCurrency();
  const status = getStatus(spent, limit);
  const ss     = STATUS_STYLE[status];
  const pct    = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isEditing = editingValue !== undefined;

  return (
    <div
      className="rounded-xl p-4 border transition-all hover:-translate-y-px hover:shadow-sm"
      style={{ borderColor: ss.border, backgroundColor: ss.bg }}
      data-testid={`budget-row-${category.id}`}>
      <div className="flex items-center gap-4">

        {/* left — icon + name */}
        <div className="flex items-center gap-3 w-48 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: (category.color || "#64748B") + "22" }}>
            <PiggyBank className="w-4 h-4" style={{ color: category.color || "#64748B" }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{category.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ss.pill}`}>{ss.label}</span>
              {txCount > 0 && <span className="text-[10px] text-gray-400">{txCount} tx</span>}
            </div>
          </div>
        </div>

        {/* center — progress visualization */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-gray-500">Spent <strong className="text-gray-700 dark:text-gray-300">{formatAmount(spent)}</strong></span>
            <span className="text-gray-500">Limit <strong className="text-gray-700 dark:text-gray-300">{limit > 0 ? formatAmount(limit) : "—"}</strong></span>
          </div>
          <div className="h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
            {limit > 0 && (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: ss.bar }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="font-medium" style={{ color: status === "danger" ? DANGER : status === "warning" ? AMBER : "#64748B" }}>
              {limit > 0 ? `${pct.toFixed(0)}% used` : "No limit set"}
            </span>
            {limit > 0 && (
              <span className="font-semibold" style={{ color: spent > limit ? DANGER : MINT }}>
                {spent > limit ? `Over by ${formatAmount(spent - limit)}` : `${formatAmount(limit - spent)} left`}
              </span>
            )}
          </div>
        </div>

        {/* right — editable limit input */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">$</span>
            <Input
              type="number"
              min="0"
              step="1"
              className="w-24 h-8 text-xs text-right rounded-xl"
              placeholder="Set limit"
              value={isEditing ? editingValue : (limit > 0 ? String(limit) : "")}
              onChange={e => onEdit(e.target.value)}
              data-testid={`input-budget-${category.id}`}
            />
          </div>
          {isEditing && (
            <Button
              size="sm"
              className="h-8 px-3 text-xs rounded-xl"
              style={{ backgroundColor: BRAND }}
              onClick={onSave}
              disabled={isSaving}
              data-testid={`button-save-budget-${category.id}`}>
              <Save className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── spending pace chart ── */
function SpendingPaceChart({ transactions, budgets, month, year }: {
  transactions: any[]; budgets: any[]; month: number; year: number;
}) {
  const { formatAmount } = useCurrency();
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const dayToday = isCurrentMonth ? today.getDate() : daysInMonth;

  const data = useMemo(() => {
    const dailySpent: number[] = Array(daysInMonth).fill(0);
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .forEach(t => {
        const day = new Date(t.date).getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          dailySpent[day] += toUsd(Number(t.amount), Number(t.exchangeRateToUsd));
        }
      });

    let cumSpent = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      cumSpent += dailySpent[i];
      const expected = totalBudget > 0 ? (totalBudget / daysInMonth) * (i + 1) : 0;
      return {
        day: `${i + 1}`,
        expected: parseFloat(expected.toFixed(2)),
        actual: i < dayToday ? parseFloat(cumSpent.toFixed(2)) : undefined,
      };
    });
  }, [transactions, budgets, month, year, daysInMonth]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.1} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MINT} stopOpacity={0.2} />
            <stop offset="100%" stopColor={MINT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => v % 5 === 0 ? v : ""} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
          tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
        <Tooltip
          formatter={(v: any, name: string) => [formatAmount(v), name === "expected" ? "Expected" : "Actual"]}
          contentStyle={{ fontSize: 11, borderRadius: 8 }} />
        <Area type="monotone" dataKey="expected" stroke={BRAND} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#expGrad)" name="expected" dot={false} />
        <Area type="monotone" dataKey="actual" stroke={MINT} strokeWidth={2} fill="url(#actGrad)" name="actual" dot={false} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── main page ── */
export default function BudgetPage() {
  const { user }   = useAuth();
  const { formatAmount } = useCurrency();
  const { toast }  = useToast();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter]     = useState<"all"|"safe"|"warning"|"danger">("all");
  const [dismissHealth, setDismissHealth]   = useState(false);

  const { data: categories  = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const { data: budgetData   = [] } = useBudgets(month, year);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const allTx   = transactions as any[];
  const allCats = categories  as any[];
  const allBudgets = budgetData as any[];

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1);  setYear(y => y + 1); } else setMonth(m => m + 1); };

  /* expense categories */
  const expCats = useMemo(() => allCats.filter((c: any) => c.type === "expense"), [allCats]);
  const incCats = useMemo(() => allCats.filter((c: any) => c.type === "income"),  [allCats]);

  /* budget map */
  const budgetMap = useMemo(() => new Map(allBudgets.map((b: any) => [b.categoryId, b])), [allBudgets]);

  /* monthly spending per category */
  const categoryData = useMemo(() =>
    expCats.map((cat: any) => {
      const catTxs = allTx.filter(t =>
        t.categoryId === cat.id &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year
      );
      const spent  = catTxs.reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0);
      const budget = budgetMap.get(cat.id) as any;
      const limit  = budget ? Number(budget.amount) : 0;
      const status = getStatus(spent, limit);
      return { cat, spent, limit, txCount: catTxs.length, status, budget };
    }),
    [expCats, allTx, month, year, budgetMap]
  );

  /* income this month */
  const incCatIds   = new Set(incCats.map((c: any) => c.id));
  const monthlyIncome = useMemo(() =>
    allTx
      .filter(t => incCatIds.has(t.categoryId) && new Date(t.date).getMonth() + 1 === month && new Date(t.date).getFullYear() === year)
      .reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0),
    [allTx, incCatIds, month, year]
  );

  /* totals */
  const totalBudgeted = allBudgets.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const totalSpent    = categoryData.reduce((s, d) => s + d.spent, 0);
  const remaining     = totalBudgeted - totalSpent;
  const unallocated   = monthlyIncome - totalBudgeted;
  const allocPct      = monthlyIncome > 0 ? Math.min((totalBudgeted / monthlyIncome) * 100, 100) : 0;
  const spentPct      = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;

  /* at-risk categories */
  const warningCats = categoryData.filter(d => d.status === "warning");
  const dangerCats  = categoryData.filter(d => d.status === "danger");
  const atRisk      = warningCats.length + dangerCats.length;

  /* spending pace health */
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const today       = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const dayOfMonth  = isCurrentMonth ? today.getDate() : daysInMonth;
  const expectedPct = daysInMonth > 0 ? (dayOfMonth / daysInMonth) * 100 : 0;
  const paceDiff    = spentPct - expectedPct;

  /* donut for allocation */
  const donutData = categoryData
    .filter(d => d.limit > 0)
    .map(d => ({ name: d.cat.name, value: d.limit, color: d.cat.color || "#64748B" }));
  if (unallocated > 0 && monthlyIncome > 0)
    donutData.push({ name: "Unallocated", value: unallocated, color: "#E2E8F0" });

  /* filtered categories */
  const visibleData = categoryData.filter(d => statusFilter === "all" || d.status === statusFilter);

  /* save handler */
  const handleSaveBudget = async (categoryId: number) => {
    const amountStr = editingAmounts[categoryId];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    try {
      const existing = budgetMap.get(categoryId) as any;
      if (existing) await updateBudget.mutateAsync({ id: existing.id, amount: amountStr });
      else          await createBudget.mutateAsync({ userId: user!.id, categoryId, month, year, amount: amountStr });
      setEditingAmounts(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      toast({ title: "Budget saved" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
  };

  const isSaving = createBudget.isPending || updateBudget.isPending;

  /* top overspend */
  const topOverspend = [...categoryData]
    .filter(d => d.limit > 0)
    .sort((a, b) => (b.spent / Math.max(b.limit, 1)) - (a.spent / Math.max(a.limit, 1)))
    .slice(0, 4);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Budget Planning</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Allocate your income, track spending live, stay in control.</p>
          </div>
          {/* month navigator */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors" data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="font-semibold text-sm text-gray-900 dark:text-white min-w-[130px] text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl" data-testid="text-month-year">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors" data-testid="button-next-month">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── INCOME ALLOCATION HERO ── */}
        <Card className="border border-blue-100 dark:border-blue-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6" style={{ background: "linear-gradient(135deg, #EEF4FF 0%, #F5F3FF 100%)" }}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* left section */}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  {MONTH_NAMES[month - 1]} {year} Budget
                </p>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">Income Allocation</h2>

                {/* allocation bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Budgeted {allocPct.toFixed(0)}%</span>
                    <span>Unallocated {Math.max(0, 100 - allocPct).toFixed(0)}%</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: "#E2E8F0" }}>
                    <div className="h-full transition-all duration-700"
                      style={{ width: `${allocPct}%`, background: `linear-gradient(90deg, ${BRAND}, ${PURPLE})` }} />
                  </div>
                </div>

                {/* 3-column stat grid */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Monthly Income</p>
                    <p className="font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
                      {monthlyIncome > 0 ? formatAmount(monthlyIncome) : <span className="text-gray-400 text-sm font-normal">Log income first</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Total Budgeted</p>
                    <p className="font-bold tabular-nums mt-0.5" style={{ color: BRAND }}>{formatAmount(totalBudgeted)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Unallocated</p>
                    <p className="font-bold tabular-nums mt-0.5" style={{ color: unallocated >= 0 ? MINT : DANGER }}>
                      {unallocated >= 0 ? "+" : ""}{formatAmount(Math.abs(unallocated))}
                      {unallocated < 0 && <span className="text-xs ml-1">⚠ Over-allocated</span>}
                    </p>
                  </div>
                </div>

                {/* 50/30/20 tip */}
                {monthlyIncome > 0 && (
                  <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/30 text-xs text-gray-500 flex items-center gap-1">
                    <span>💡 50/30/20 suggests:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {formatAmount(monthlyIncome * 0.5)} needs · {formatAmount(monthlyIncome * 0.3)} wants · {formatAmount(monthlyIncome * 0.2)} savings
                    </span>
                  </div>
                )}
              </div>

              {/* right: donut */}
              {donutData.length > 0 && (
                <div className="flex flex-col items-center justify-center w-48 shrink-0">
                  <div className="relative">
                    <RePieChart width={140} height={140}>
                      <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                    </RePieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-400">budgeted</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{formatAmount(totalBudgeted)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-center">{expCats.filter((c: any) => budgetMap.has(c.id)).length} categories</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Budgeted"
            value={formatAmount(totalBudgeted)}
            sub={`Across ${expCats.filter((c: any) => budgetMap.has(c.id)).length} categories`}
            icon={PieChart}
            color={BRAND}
            bg="#EEF4FF"
          />
          <KpiCard
            label="Spent This Month"
            value={formatAmount(totalSpent)}
            sub={`${spentPct.toFixed(0)}% of budget used`}
            icon={TrendingDown}
            color={AMBER}
            bg="#FFFBEB"
            extra={
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#FDE68A" }}>
                <div className="h-full rounded-full" style={{ width: `${spentPct}%`, backgroundColor: AMBER }} />
              </div>
            }
          />
          <KpiCard
            label="Remaining Budget"
            value={formatAmount(Math.max(0, remaining))}
            sub={isCurrentMonth && dayOfMonth < daysInMonth
              ? `${daysInMonth - dayOfMonth} days left · ${formatAmount(Math.max(0, remaining) / Math.max(1, daysInMonth - dayOfMonth))}/day`
              : remaining < 0 ? "Over budget ⚠" : "Budget period"}
            icon={Wallet}
            color={remaining >= 0 ? "#10B981" : DANGER}
            bg={remaining >= 0 ? "#ECFDF5" : "#FEF2F2"}
          />
          <KpiCard
            label="Categories at Risk"
            value={String(atRisk)}
            sub={`${warningCats.length} warning · ${dangerCats.length} over budget`}
            icon={AlertTriangle}
            color={atRisk > 0 ? DANGER : "#10B981"}
            bg={atRisk > 0 ? "#FEF2F2" : "#ECFDF5"}
            extra={atRisk > 0 ? (
              <button className="mt-1 text-[10px] font-semibold flex items-center gap-0.5" style={{ color: DANGER }}
                onClick={() => setStatusFilter("danger")}>
                Review now <ArrowRight className="w-2.5 h-2.5" />
              </button>
            ) : undefined}
          />
        </div>

        {/* ── HEALTH BANNER ── */}
        {!dismissHealth && totalBudgeted > 0 && (
          <div className={`rounded-2xl p-4 flex items-center justify-between border ${
            dangerCats.length > 0 ? "bg-red-50 border-red-200 dark:border-red-900/30" :
            warningCats.length > 0 ? "bg-amber-50 border-amber-200 dark:border-amber-900/30" :
            "bg-emerald-50 border-emerald-100 dark:border-emerald-900/30"
          }`}>
            <div className="flex items-center gap-3">
              {dangerCats.length > 0
                ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                : warningCats.length > 0
                ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {dangerCats.length > 0
                    ? `🚨 ${dangerCats.length} categor${dangerCats.length !== 1 ? "ies" : "y"} over budget — review below`
                    : warningCats.length > 0
                    ? `⚠️ ${warningCats.length} categor${warningCats.length !== 1 ? "ies" : "y"} approaching limit`
                    : "✅ You're on track — spending is within budget"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {spentPct.toFixed(0)}% spent with {expectedPct.toFixed(0)}% of month elapsed
                  {Math.abs(paceDiff) > 5 && (` · ${paceDiff > 0 ? "spending faster" : "spending slower"} than expected`)}
                </p>
              </div>
            </div>
            <button onClick={() => setDismissHealth(true)} className="text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── CATEGORY BUDGETS ── */}
        <div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white text-base">Category Budgets</h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {expCats.length} categories{atRisk > 0 ? ` · ${atRisk} need attention` : ""}
              </span>
            </div>
            {/* filter pills */}
            <div className="flex gap-1.5">
              {(["all","safe","warning","danger"] as const).map(f => {
                const count = f === "all" ? categoryData.length
                  : f === "safe" ? categoryData.filter(d => d.status === "safe").length
                  : f === "warning" ? warningCats.length
                  : dangerCats.length;
                return (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize"
                    style={statusFilter === f
                      ? { backgroundColor: BRAND, color: "#fff" }
                      : { backgroundColor: "#F1F5F9", color: "#64748B" }}
                    data-testid={`filter-${f}`}>
                    {f === "all" ? "All" : f === "safe" ? `✅ On Track (${count})` : f === "warning" ? `⚠ Warning (${count})` : `🔴 Over (${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {visibleData.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                {expCats.length === 0 ? "No expense categories found." : `No categories match the '${statusFilter}' filter.`}
              </div>
            ) : (
              visibleData.map(({ cat, spent, limit, txCount }) => (
                <BudgetRow
                  key={cat.id}
                  category={cat}
                  spent={spent}
                  limit={limit}
                  txCount={txCount}
                  editingValue={editingAmounts[cat.id]}
                  onEdit={v => setEditingAmounts(prev => ({ ...prev, [cat.id]: v }))}
                  onSave={() => handleSaveBudget(cat.id)}
                  isSaving={isSaving}
                />
              ))
            )}

            {/* ghost "add" row */}
            <button
              className="w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all"
              onClick={() => (window.location.href = "/expenses")}
              data-testid="button-add-category">
              <Plus className="w-4 h-4" />
              Add or manage expense categories
            </button>
          </div>
        </div>

        {/* ── SPENDING PACE + TOP OVERSPEND ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* pace chart — 2/3 */}
          <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">Monthly Spending Pace</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-6 h-0.5" style={{ backgroundColor: BRAND, opacity: 0.6 }} />
                    Expected
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-6 h-0.5" style={{ backgroundColor: MINT }} />
                    Actual
                  </span>
                </div>
              </div>
              <SpendingPaceChart
                transactions={allTx}
                budgets={allBudgets}
                month={month}
                year={year}
              />
            </CardContent>
          </Card>

          {/* top overspend — 1/3 */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Spending by Category</h3>
              <p className="text-xs text-gray-400 mb-4">Highest usage this month</p>
              {topOverspend.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No budgets set yet</p>
              ) : (
                <div className="space-y-3">
                  {topOverspend.map(({ cat, spent, limit }) => {
                    const pct = limit > 0 ? (spent / limit) * 100 : 0;
                    const status = getStatus(spent, limit);
                    const barColor = STATUS_STYLE[status].bar;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                          <span className="font-bold tabular-nums shrink-0 ml-2" style={{ color: barColor }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                        </div>
                        {spent > limit && limit > 0 && (
                          <p className="text-[10px] mt-0.5" style={{ color: DANGER }}>
                            +{formatAmount(spent - limit)} over
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── SMART INSIGHTS ── */}
        {categoryData.some(d => d.spent > 0 || d.limit > 0) && (
          <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
            <CardContent className="p-5" style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF4FF)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: PURPLE }} />
                <h3 className="font-semibold text-gray-900 text-base">Smart Insights</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* underspend insight */}
                {categoryData.filter(d => d.limit > 0 && d.spent < d.limit * 0.5).slice(0, 1).map(({ cat, limit, spent }) => (
                  <div key={cat.id} className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">💡 Underused budget</p>
                    <p className="text-gray-500">{cat.name} is only {((spent/limit)*100).toFixed(0)}% used. Consider reallocating {formatAmount(limit - spent)} to Savings.</p>
                    <button className="mt-2 font-semibold text-blue-600 flex items-center gap-0.5">
                      Reallocate <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* over budget insight */}
                {dangerCats.length > 0 && (() => {
                  const d = dangerCats[0];
                  return (
                    <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📊 Over budget alert</p>
                      <p className="text-gray-500">{d.cat.name} exceeded its limit by {formatAmount(d.spent - d.limit)}. Consider raising to {formatAmount(Math.ceil(d.spent / 50) * 50)}.</p>
                      <button className="mt-2 font-semibold text-blue-600 flex items-center gap-0.5" onClick={() => setStatusFilter("danger")}>
                        Review <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })()}
                {/* overall health insight */}
                <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">✨ Budget Health</p>
                  <p className="text-gray-500">
                    {spentPct < expectedPct - 10
                      ? `Great job! You're spending ${(expectedPct - spentPct).toFixed(0)}% slower than your budget plan.`
                      : spentPct > expectedPct + 10
                      ? `Watch out — spending ${(spentPct - expectedPct).toFixed(0)}% faster than planned for this point in the month.`
                      : `You're right on pace with ${spentPct.toFixed(0)}% spent at day ${dayOfMonth} of ${daysInMonth}.`}
                  </p>
                  <button className="mt-2 font-semibold flex items-center gap-0.5" style={{ color: PURPLE }}
                    onClick={() => (window.location.href = "/ai-reports")}>
                    Full analysis <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
}

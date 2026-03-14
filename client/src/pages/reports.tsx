import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactions, useCategories, useGoals, useBudgets } from "@/hooks/use-finance";
import { useCurrency, toUsd } from "@/lib/currency";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Download, Calendar, Search,
  ArrowUpDown, ChevronLeft, ChevronRight, Target, AlertCircle,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, subMonths, startOfYear, format,
  isWithinInterval, parseISO,
} from "date-fns";

const PALETTE = ["#1B4FE4", "#F97316", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16", "#EC4899", "#14B8A6"];

type Period = "month" | "3m" | "6m" | "year" | "custom";

function getPeriodRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date();
  if (period === "month") return { start: startOfMonth(now), end: now };
  if (period === "3m") return { start: subMonths(now, 3), end: now };
  if (period === "6m") return { start: subMonths(now, 6), end: now };
  if (period === "year") return { start: startOfYear(now), end: now };
  return {
    start: customStart ? new Date(customStart) : subMonths(now, 3),
    end: customEnd ? new Date(customEnd) : now,
  };
}

function getPrevRange(period: Period, range: { start: Date; end: Date }) {
  const diff = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - diff), end: new Date(range.start.getTime()) };
}

function TrendBadge({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0) return null;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { formatAmount } = useCurrency();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useGoals();
  const now = new Date();
  const { data: budgets = [] } = useBudgets(now.getMonth() + 1, now.getFullYear());

  const [period, setPeriod] = useState<Period>("6m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "amount" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const range = useMemo(() => getPeriodRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const prevRange = useMemo(() => getPrevRange(period, range), [period, range]);

  const catMap = useMemo(() => Object.fromEntries((categories as any[]).map((c: any) => [c.id, c])), [categories]);

  const inRange = useCallback((tx: any, r: { start: Date; end: Date }) => {
    const d = parseISO(tx.date);
    return isWithinInterval(d, { start: r.start, end: r.end });
  }, []);

  const filtered = useMemo(() =>
    (transactions as any[]).filter(tx => inRange(tx, range)),
    [transactions, range, inRange]
  );

  const prevFiltered = useMemo(() =>
    (transactions as any[]).filter(tx => inRange(tx, prevRange)),
    [transactions, prevRange, inRange]
  );

  const isIncome = (tx: any) => catMap[tx.categoryId]?.type === "income";
  const isExpense = (tx: any) => catMap[tx.categoryId]?.type === "expense";

  const totalIncome = useMemo(() => filtered.filter(isIncome).reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [filtered, catMap]);
  const totalExpenses = useMemo(() => filtered.filter(isExpense).reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [filtered, catMap]);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const prevIncome = useMemo(() => prevFiltered.filter(isIncome).reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [prevFiltered, catMap]);
  const prevExpenses = useMemo(() => prevFiltered.filter(isExpense).reduce((s, t) => s + toUsd(Number(t.amount), Number(t.exchangeRateToUsd)), 0), [prevFiltered, catMap]);
  const prevNet = prevIncome - prevExpenses;
  const prevRate = prevIncome > 0 ? (prevNet / prevIncome) * 100 : 0;

  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(isExpense).forEach(tx => {
      const cat = catMap[tx.categoryId]?.name || "Other";
      map[cat] = (map[cat] || 0) + toUsd(Number(tx.amount), Number(tx.exchangeRateToUsd));
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered, catMap]);

  const incomeByCat = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(isIncome).forEach(tx => {
      const cat = catMap[tx.categoryId]?.name || "Other";
      map[cat] = (map[cat] || 0) + toUsd(Number(tx.amount), Number(tx.exchangeRateToUsd));
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered, catMap]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number; label: string }> = {};
    const addMonths = period === "month" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
    for (let i = addMonths - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      months[key] = { income: 0, expenses: 0, label: format(d, "MMM yy") };
    }
    (transactions as any[]).forEach(tx => {
      const key = format(parseISO(tx.date), "yyyy-MM");
      if (!months[key]) return;
      const amt = toUsd(Number(tx.amount), Number(tx.exchangeRateToUsd));
      if (isIncome(tx)) months[key].income += amt;
      else if (isExpense(tx)) months[key].expenses += amt;
    });
    let cumulative = 0;
    return Object.entries(months).map(([, v]) => {
      cumulative += v.income - v.expenses;
      return { ...v, net: v.income - v.expenses, cumulative };
    });
  }, [transactions, period, catMap]);

  const budgetVsActual = useMemo(() => {
    return (budgets as any[]).map((b: any) => {
      const catName = catMap[b.categoryId]?.name || "Category";
      const limit = toUsd(Number(b.amount), 1);
      const spent = toUsd(Number(b.spent || 0), 1);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      const status = pct >= 100 ? "red" : pct >= 80 ? "yellow" : "green";
      return { name: catName, limit, spent, pct, status };
    });
  }, [budgets, catMap]);

  const tableRows = useMemo(() => {
    let rows = filtered.map(tx => ({
      ...tx,
      catName: catMap[tx.categoryId]?.name || "Uncategorized",
      catType: catMap[tx.categoryId]?.type || "expense",
      amountUsd: toUsd(Number(tx.amount), Number(tx.exchangeRateToUsd)),
    }));
    if (clickedCategory) rows = rows.filter(r => r.catName === clickedCategory);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.description?.toLowerCase().includes(q) ||
        r.catName.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "date") diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortKey === "amount") diff = a.amountUsd - b.amountUsd;
      else diff = a.catName.localeCompare(b.catName);
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  }, [filtered, catMap, clickedCategory, search, sortKey, sortDir]);

  const totalPages = Math.ceil(tableRows.length / PAGE_SIZE);
  const pageRows = tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: "date" | "amount" | "category") => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount (USD)"];
    const rows = tableRows.map(r => [
      format(parseISO(r.date), "yyyy-MM-dd"),
      r.description || "",
      r.catName,
      r.catType,
      r.amountUsd.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wealthly-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    { label: "Total Income", value: totalIncome, prev: prevIncome, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-50 dark:from-emerald-950/30", icon: "↑" },
    { label: "Total Expenses", value: totalExpenses, prev: prevExpenses, color: "text-red-600 dark:text-red-400", bg: "from-red-50 dark:from-red-950/30", icon: "↓" },
    { label: "Net Savings", value: netSavings, prev: prevNet, color: netSavings >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600", bg: "from-blue-50 dark:from-blue-950/30", icon: "=" },
    { label: "Savings Rate", value: savingsRate, prev: prevRate, color: "text-violet-600 dark:text-violet-400", bg: "from-violet-50 dark:from-violet-950/30", isPercent: true },
  ];

  const PERIOD_BTNS: [Period, string][] = [
    ["month", "This Month"], ["3m", "Last 3M"], ["6m", "Last 6M"], ["year", "This Year"], ["custom", "Custom"],
  ];

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 py-10">
      <AlertCircle className="w-8 h-8 opacity-50" />
      <p className="text-sm">{msg}</p>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {format(range.start, "MMM d, yyyy")} – {format(range.end, "MMM d, yyyy")}
            </p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2 self-start sm:self-auto" data-testid="button-export-csv">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* ── DATE RANGE FILTER ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          {PERIOD_BTNS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setPeriod(key); setPage(1); }}
              data-testid={`button-period-${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === key
                  ? "text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              style={period === key ? { backgroundColor: "#1B4FE4" } : {}}
            >
              {label}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex gap-2 items-center ml-1">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300" data-testid="input-custom-start" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300" data-testid="input-custom-end" />
            </div>
          )}
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k, i) => (
            <Card key={i} className={`border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br ${k.bg} to-white dark:to-gray-900`} data-testid={`card-kpi-${i}`}>
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>
                  {k.isPercent ? `${k.value.toFixed(1)}%` : formatAmount(k.value)}
                </p>
                <div className="mt-1.5">
                  <TrendBadge cur={k.value} prev={k.prev} />
                  <span className="text-xs text-gray-400 ml-1">vs prior period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── ROW 1: Donut + Monthly Bar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-expense-distribution">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Expense Distribution</CardTitle>
              {clickedCategory && (
                <button onClick={() => setClickedCategory(null)} className="text-xs text-blue-600 hover:underline ml-auto">
                  ✕ Clear filter
                </button>
              )}
            </CardHeader>
            <CardContent>
              {expenseByCat.length === 0 ? <EmptyState msg="No expenses in this period" /> : (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-[200px] h-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseByCat} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}
                          onClick={(d) => { setClickedCategory(d.name); setPage(1); }}>
                          {expenseByCat.map((_: any, i: number) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none"
                              style={{ cursor: "pointer", opacity: clickedCategory && clickedCategory !== _.name ? 0.4 : 1 }} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {expenseByCat.slice(0, 7).map((d: any, i: number) => {
                      const pct = totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(1) : "0";
                      return (
                        <div key={i} className="flex items-center gap-2 cursor-pointer" onClick={() => { setClickedCategory(d.name === clickedCategory ? null : d.name); setPage(1); }} data-testid={`legend-expense-${i}`}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{formatAmount(d.value)}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-income-vs-expenses">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Income vs Expenses by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.every(m => m.income === 0 && m.expenses === 0) ? <EmptyState msg="No data for this period" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 2: Cash Flow Area Chart ── */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-cashflow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cash Flow Over Time</CardTitle>
            <p className="text-xs text-gray-400">Monthly income, expenses, and cumulative savings</p>
          </CardHeader>
          <CardContent>
            {monthlyData.every(m => m.income === 0 && m.expenses === 0) ? <EmptyState msg="Add transactions to see your cash flow trend" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4FE4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B4FE4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" fill="url(#incGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#expGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="cumulative" name="Cumul. Savings" stroke="#1B4FE4" fill="url(#savGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── ROW 3: Top Spending + Income Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-top-spending">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCat.length === 0 ? <EmptyState msg="No expenses to show" /> : (
                <div className="space-y-3">
                  {expenseByCat.slice(0, 7).map((d: any, i: number) => {
                    const pct = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1 cursor-pointer" onClick={() => { setClickedCategory(d.name === clickedCategory ? null : d.name); setPage(1); }} data-testid={`bar-spending-${i}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatAmount(d.value)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-income-breakdown">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Income by Source</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCat.length === 0 ? <EmptyState msg="No income recorded in this period" /> : (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-[180px] h-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={incomeByCat} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                          {incomeByCat.map((_: any, i: number) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip formatter={formatAmount} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {incomeByCat.map((d: any, i: number) => {
                      const pct = totalIncome > 0 ? ((d.value / totalIncome) * 100).toFixed(1) : "0";
                      return (
                        <div key={i} className="flex items-center gap-2" data-testid={`legend-income-${i}`}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{formatAmount(d.value)}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 4: Budget vs Actual + Goals ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-budget-actual">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Budget vs Actual <span className="text-xs font-normal text-gray-400">(this month)</span></CardTitle>
            </CardHeader>
            <CardContent>
              {budgetVsActual.length === 0 ? (
                <EmptyState msg="No budgets set. Create budgets to track spending limits." />
              ) : (
                <div className="space-y-4">
                  {budgetVsActual.map((b: any, i: number) => (
                    <div key={i} className="space-y-1.5" data-testid={`budget-row-${i}`}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{b.name}</span>
                        <span className={b.status === "red" ? "text-red-600 font-semibold" : b.status === "yellow" ? "text-yellow-600 font-semibold" : "text-gray-600 dark:text-gray-400"}>
                          {formatAmount(b.spent)} / {formatAmount(b.limit)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(b.pct, 100)}%`,
                            backgroundColor: b.status === "red" ? "#EF4444" : b.status === "yellow" ? "#F59E0B" : "#10B981",
                          }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{b.pct.toFixed(0)}% used</span>
                        {b.status === "red" && <Badge variant="destructive" className="text-xs py-0 h-4">Over budget</Badge>}
                        {b.status === "yellow" && <Badge className="text-xs py-0 h-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Near limit</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-goals-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Savings Goals Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {(goals as any[]).length === 0 ? <EmptyState msg="No goals created yet. Set a savings goal to track progress." /> : (
                <div className="space-y-4">
                  {(goals as any[]).filter((g: any) => g.status === "active").map((g: any, i: number) => {
                    const cur = toUsd(Number(g.currentAmount), Number(g.exchangeRateToUsd || 1));
                    const target = toUsd(Number(g.targetAmount), Number(g.exchangeRateToUsd || 1));
                    const pct = target > 0 ? Math.min((cur / target) * 100, 100) : 0;
                    const remaining = Math.max(target - cur, 0);
                    const deadline = g.deadline ? format(parseISO(g.deadline), "MMM d, yyyy") : null;
                    return (
                      <div key={i} className="space-y-1.5" data-testid={`goal-row-${i}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{g.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{formatAmount(cur)} of {formatAmount(target)}</span>
                          <div className="text-right">
                            <span>{formatAmount(remaining)} left</span>
                            {deadline && <span className="ml-2">• Due {deadline}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 5: Transactions Table ── */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl" data-testid="card-transactions-table">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Transactions</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">{tableRows.length} transactions in period{clickedCategory ? ` · filtered by ${clickedCategory}` : ""}</p>
              </div>
              <div className="flex gap-2 items-center">
                {clickedCategory && (
                  <button onClick={() => setClickedCategory(null)}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100 transition-colors">
                    ✕ {clickedCategory}
                  </button>
                )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="pl-8 h-8 text-xs w-44"
                    data-testid="input-transaction-search"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tableRows.length === 0 ? (
              <div className="py-10"><EmptyState msg="No transactions match your filters" /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        {([["date", "Date"], ["category", "Category"], ["description", "Description"], ["amount", "Amount"]] as [string, string][]).map(([key, label]) => (
                          <th key={key} className="px-4 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {["date", "category", "amount"].includes(key) ? (
                              <button onClick={() => toggleSort(key as any)} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" data-testid={`sort-${key}`}>
                                {label} <ArrowUpDown className="w-3 h-3" />
                              </button>
                            ) : label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {pageRows.map((row: any, i: number) => (
                        <tr key={row.id || i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors" data-testid={`row-transaction-${row.id}`}>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {format(parseISO(row.date), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${PALETTE[expenseByCat.findIndex((e: any) => e.name === row.catName) % PALETTE.length] || "#1B4FE4"}22`, color: PALETTE[expenseByCat.findIndex((e: any) => e.name === row.catName) % PALETTE.length] || "#1B4FE4" }}>
                              {row.catName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                            {row.description || "—"}
                          </td>
                          <td className={`px-4 py-3 font-semibold whitespace-nowrap ${row.catType === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {row.catType === "income" ? "+" : "-"}{formatAmount(row.amountUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}

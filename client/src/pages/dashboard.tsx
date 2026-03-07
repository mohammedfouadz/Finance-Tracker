import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionDialog } from "@/components/transaction-dialog";
import {
  useTransactions, useCategories, useAssets, useBankAccounts,
  useInvestments, useDebts, useGoals, useAIInsights, useCreateGoalContribution,
} from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import {
  DollarSign, TrendingUp, TrendingDown, Landmark, Building2,
  LineChart, HandCoins, Target, Plus, ArrowUpRight, ArrowDownRight,
  RefreshCw, Sparkles, ChevronRight, AlertCircle, Clock, Wallet,
  Receipt,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart as ReLineChart, Line,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TxFilter = "all" | "income" | "expense";
type ChartRange = "1M" | "3M" | "6M" | "1Y";

function greeting(name: string, isAr: boolean) {
  const h = new Date().getHours();
  if (isAr) {
    const g = h < 12 ? "صباح الخير" : h < 17 ? "مساء الخير" : "مساء النور";
    return `${g}، ${name}! 👋`;
  }
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${g}, ${name}! 👋`;
}

function StatSkeleton() {
  return (
    <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
      <CardContent className="p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: assets = [] } = useAssets();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: investments = [] } = useInvestments();
  const { data: debts = [] } = useDebts();
  const { data: goals = [] } = useGoals();
  const { formatAmount } = useCurrency();
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const aiInsights = useAIInsights();
  const createContribution = useCreateGoalContribution();

  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [chartRange, setChartRange] = useState<ChartRange>("6M");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const now = new Date();
  const allTx = useMemo(() => (transactions as any[]), [transactions]);
  const allCats = useMemo(() => (categories as any[]), [categories]);

  const incomeCatIds = useMemo(() => new Set(allCats.filter((c: any) => c.type === "income").map((c: any) => c.id)), [allCats]);
  const expenseCatIds = useMemo(() => new Set(allCats.filter((c: any) => c.type === "expense").map((c: any) => c.id)), [allCats]);

  const curMonthStart = startOfMonth(now);
  const curMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const txInPeriod = (start: Date, end: Date) =>
    allTx.filter((tx: any) => {
      const d = new Date(tx.date);
      return isWithinInterval(d, { start, end });
    });

  const curMonthTx = useMemo(() => txInPeriod(curMonthStart, curMonthEnd), [allTx, curMonthStart, curMonthEnd]);
  const prevMonthTx = useMemo(() => txInPeriod(prevMonthStart, prevMonthEnd), [allTx, prevMonthStart, prevMonthEnd]);

  const sumTx = (txList: any[], catIds: Set<number>) =>
    txList.filter((tx: any) => catIds.has(tx.categoryId)).reduce((s: number, tx: any) => s + toUsd(tx.amount, tx.exchangeRateToUsd), 0);

  const curIncome = useMemo(() => sumTx(curMonthTx, incomeCatIds), [curMonthTx, incomeCatIds]);
  const curExpenses = useMemo(() => sumTx(curMonthTx, expenseCatIds), [curMonthTx, expenseCatIds]);
  const prevIncome = useMemo(() => sumTx(prevMonthTx, incomeCatIds), [prevMonthTx, incomeCatIds]);
  const prevExpenses = useMemo(() => sumTx(prevMonthTx, expenseCatIds), [prevMonthTx, expenseCatIds]);

  const totalAssetsValue = useMemo(() => (assets as any[]).reduce((s: number, a: any) => s + toUsd(a.currentValue || 0, a.exchangeRateToUsd), 0), [assets]);
  const totalBankBalance = useMemo(() => (bankAccounts as any[]).reduce((s: number, a: any) => s + toUsd(a.balance || 0, a.exchangeRateToUsd), 0), [bankAccounts]);
  const totalInvestmentsValue = useMemo(() => (investments as any[]).reduce((s: number, i: any) => s + toUsd(i.currentValue || 0, i.exchangeRateToUsd), 0), [investments]);
  const totalDebt = useMemo(() => (debts as any[]).filter((d: any) => d.status === "active").reduce((s: number, d: any) => s + toUsd(d.remainingAmount || 0, d.exchangeRateToUsd), 0), [debts]);

  const totalWealth = totalAssetsValue + totalBankBalance + totalInvestmentsValue - totalDebt;

  const trendPct = (cur: number, prev: number) => prev === 0 ? null : ((cur - prev) / prev) * 100;
  const incomeTrend = trendPct(curIncome, prevIncome);
  const expenseTrend = trendPct(curExpenses, prevExpenses);
  const bankTrend = null;
  const debtTrend = null;

  const wealthBreakdown = useMemo(() => {
    const d = [];
    if (totalBankBalance > 0) d.push({ name: isAr ? "البنوك" : "Bank Accounts", value: totalBankBalance, color: "#3b82f6" });
    if (totalInvestmentsValue > 0) d.push({ name: isAr ? "الاستثمارات" : "Investments", value: totalInvestmentsValue, color: "#22c55e" });
    if (totalAssetsValue > 0) d.push({ name: isAr ? "الأصول" : "Assets", value: totalAssetsValue, color: "#f59e0b" });
    if (d.length === 0) d.push({ name: isAr ? "لا بيانات" : "No Data", value: 1, color: "#e5e7eb" });
    return d;
  }, [totalBankBalance, totalInvestmentsValue, totalAssetsValue, isAr]);

  const wealthTotal = wealthBreakdown.reduce((s, w) => s + (w.name === (isAr ? "لا بيانات" : "No Data") ? 0 : w.value), 0);

  const chartData = useMemo(() => {
    const months = chartRange === "1M" ? 1 : chartRange === "3M" ? 3 : chartRange === "6M" ? 6 : 12;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const mTx = txInPeriod(mStart, mEnd);
      const inc = sumTx(mTx, incomeCatIds);
      const exp = sumTx(mTx, expenseCatIds);
      data.push({ month: format(monthDate, "MMM"), income: inc, expenses: exp });
    }
    return data;
  }, [allTx, chartRange, incomeCatIds, expenseCatIds]);

  const chartPeriodIncome = useMemo(() => chartData.reduce((s, d) => s + d.income, 0), [chartData]);
  const chartPeriodExpenses = useMemo(() => chartData.reduce((s, d) => s + d.expenses, 0), [chartData]);

  const filteredTx = useMemo(() =>
    allTx.slice(0, 8).map((tx: any) => {
      const cat = allCats.find((c: any) => c.id === tx.categoryId);
      return { ...tx, categoryName: cat?.name, categoryColor: cat?.color, categoryType: cat?.type };
    }).filter((tx: any) => {
      if (txFilter === "income") return tx.categoryType === "income";
      if (txFilter === "expense") return tx.categoryType === "expense";
      return true;
    })
  , [allTx, allCats, txFilter]);

  const activeGoals = useMemo(() => (goals as any[]).filter((g: any) => g.status === "active").slice(0, 4), [goals]);

  const topSpendingCategory = useMemo(() => {
    const catTotals: Record<number, number> = {};
    curMonthTx.filter((tx: any) => expenseCatIds.has(tx.categoryId)).forEach((tx: any) => {
      catTotals[tx.categoryId] = (catTotals[tx.categoryId] || 0) + toUsd(tx.amount, tx.exchangeRateToUsd);
    });
    const entries = Object.entries(catTotals);
    if (entries.length === 0) return null;
    const [topId, topAmt] = entries.sort(([, a], [, b]) => b - a)[0];
    const cat = allCats.find((c: any) => c.id === Number(topId));

    const prevCatTotals: Record<number, number> = {};
    prevMonthTx.filter((tx: any) => expenseCatIds.has(tx.categoryId)).forEach((tx: any) => {
      prevCatTotals[tx.categoryId] = (prevCatTotals[tx.categoryId] || 0) + toUsd(tx.amount, tx.exchangeRateToUsd);
    });
    const prevAmt = prevCatTotals[Number(topId)] || 0;
    const pctOfTotal = curExpenses > 0 ? (topAmt / curExpenses) * 100 : 0;
    return { name: cat?.name || "Unknown", color: cat?.color || "#666", amount: topAmt, pctOfTotal, prevAmt };
  }, [curMonthTx, prevMonthTx, expenseCatIds, allCats, curExpenses]);

  const upcomingBills = useMemo(() => {
    return (debts as any[])
      .filter((d: any) => d.status === "active" && d.dueDate)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [debts]);

  const netWorthTrend = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const mTx = txInPeriod(mStart, mEnd);
      const net = sumTx(mTx, incomeCatIds) - sumTx(mTx, expenseCatIds);
      data.push({ month: format(monthDate, "MMM"), net });
    }
    return data;
  }, [allTx, incomeCatIds, expenseCatIds]);

  const loadAiInsight = async () => {
    setAiLoading(true);
    try {
      const result = await aiInsights.mutateAsync(undefined);
      setAiInsight(result.insight);
    } catch {
      setAiInsight(isAr ? "تعذّر تحميل التوصية. حاول مجدداً." : "Could not load insight. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { loadAiInsight(); }, []);

  const handleContribute = async () => {
    if (!contributeGoalId || !contributeAmount) return;
    try {
      await createContribution.mutateAsync({
        goalId: contributeGoalId,
        amount: contributeAmount,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        contributionDate: new Date(),
        notes: null,
      });
      setContributeGoalId(null);
      setContributeAmount("");
    } catch {}
  };

  const billUrgency = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (days <= 3) return "danger";
    if (days <= 7) return "warning";
    return "normal";
  };

  const progressColor = (pct: number) => {
    if (pct < 30) return "bg-red-500";
    if (pct < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const TrendBadge = ({ trend, invert = false }: { trend: number | null; invert?: boolean }) => {
    if (trend === null) return null;
    const positive = invert ? trend < 0 : trend > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  return (
    <Layout>
      {/* ── WELCOME ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            {greeting((user as any)?.firstName || "there", isAr)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {format(now, "EEEE, MMMM d, yyyy")} — {isAr ? "نظرتك المالية اليوم" : "Here's your financial overview today"}
          </p>
        </div>
        <div className="hidden sm:block">
          <TransactionDialog />
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {txLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/bank-accounts">
            <Card className="cursor-pointer border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-0.5 transition-all duration-200 group" data-testid="card-bank-balance">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{isAr ? "رصيد البنوك" : "Bank Balance"}</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-bank-balance">{formatAmount(totalBankBalance)}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{(bankAccounts as any[]).length} {isAr ? "حسابات" : "accounts"}</p>
                  <TrendBadge trend={bankTrend} />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/income">
            <Card className="cursor-pointer border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-gray-900 hover:shadow-lg hover:shadow-green-100 dark:hover:shadow-green-900/20 hover:-translate-y-0.5 transition-all duration-200 group" data-testid="card-total-income">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{isAr ? "دخل الشهر" : "This Month's Income"}</span>
                  <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatAmount(curIncome)}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{isAr ? "مقارنةً بالشهر الماضي" : "vs last month"}</p>
                  <TrendBadge trend={incomeTrend} />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/expenses">
            <Card className="cursor-pointer border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-gray-900 hover:shadow-lg hover:shadow-red-100 dark:hover:shadow-red-900/20 hover:-translate-y-0.5 transition-all duration-200 group" data-testid="card-total-expenses">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{isAr ? "مصروفات الشهر" : "This Month's Expenses"}</span>
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{formatAmount(curExpenses)}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{isAr ? "مقارنةً بالشهر الماضي" : "vs last month"}</p>
                  <TrendBadge trend={expenseTrend} invert />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/debts">
            <Card className="cursor-pointer border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-gray-900 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20 hover:-translate-y-0.5 transition-all duration-200 group" data-testid="card-total-debt">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{isAr ? "إجمالي الديون" : "Total Debt"}</span>
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HandCoins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-total-debt">{formatAmount(totalDebt)}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{(debts as any[]).filter((d: any) => d.status === "active").length} {isAr ? "ديون نشطة" : "active debts"}</p>
                  <TrendBadge trend={debtTrend} />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* ── INCOME VS EXPENSES CHART ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-financial-overview">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold dark:text-white">{isAr ? "الدخل مقابل المصروفات" : "Income vs Expenses"}</CardTitle>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {(["1M","3M","6M","1Y"] as ChartRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartRange === r ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    data-testid={`button-chart-range-${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{isAr ? "الدخل:" : "Income:"}</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatAmount(chartPeriodIncome)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{isAr ? "المصروفات:" : "Expenses:"}</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatAmount(chartPeriodExpenses)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64">
              {chartData.some(d => d.income > 0 || d.expenses > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatAmount(v)} width={60} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                      formatter={(v: any) => formatAmount(v)}
                    />
                    <Bar dataKey="income" fill="#22c55e" fillOpacity={0.85} radius={[4,4,0,0]} name={isAr ? "الدخل" : "Income"} />
                    <Bar dataKey="expenses" fill="#ef4444" fillOpacity={0.85} radius={[4,4,0,0]} name={isAr ? "المصروفات" : "Expenses"} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  {isAr ? "لا توجد بيانات للفترة المحددة" : "No data for selected period"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── WEALTH BREAKDOWN ── */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-wealth-breakdown">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold dark:text-white">{isAr ? "توزيع الثروة" : "Wealth Breakdown"}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">{isAr ? "إجمالي:" : "Total:"} <span className="font-bold text-gray-900 dark:text-white">{formatAmount(totalWealth)}</span></p>
          </CardHeader>
          <CardContent>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wealthBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      if (percent < 0.05) return null;
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {wealthBreakdown.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatAmount(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-1">
              {wealthBreakdown.filter(w => w.name !== "No Data" && w.name !== "لا بيانات").map((w, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: w.color }} />
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{w.name}</span>
                  </div>
                  <div className="text-end">
                    <span className="font-semibold text-gray-900 dark:text-white text-xs">{formatAmount(w.value)}</span>
                    {wealthTotal > 0 && <span className="text-gray-400 text-xs ms-1">({((w.value / wealthTotal) * 100).toFixed(0)}%)</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TRANSACTIONS + GOALS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Transactions */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-recent-transactions">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold dark:text-white">{isAr ? "المعاملات الأخيرة" : "Recent Transactions"}</CardTitle>
              <TransactionDialog />
            </div>
            <div className="flex items-center gap-1 mt-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
              {([["all", isAr ? "الكل" : "All"], ["income", isAr ? "دخل" : "Income"], ["expense", isAr ? "مصروف" : "Expenses"]] as [TxFilter, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setTxFilter(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${txFilter === v ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                  data-testid={`button-tx-filter-${v}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTx.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">{isAr ? "لا توجد معاملات" : "No transactions yet"}</p>
            ) : (
              <div className="space-y-1">
                {filteredTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-testid={`row-recent-tx-${tx.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (tx.categoryColor || "#666") + "25" }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tx.categoryColor || "#666" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{tx.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{tx.categoryName} · {format(new Date(tx.date), "MMM d")}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${tx.categoryType === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {tx.categoryType === "income" ? "+" : "-"}{formatAmount(toUsd(tx.amount, tx.exchangeRateToUsd))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/income">
              <Button variant="ghost" className="w-full mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary" data-testid="button-view-all-transactions">
                {isAr ? "عرض الكل" : "View All"} <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-goals-progress">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold dark:text-white">{isAr ? "تقدم الأهداف" : "Goals Progress"}</CardTitle>
              <Link href="/goals">
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-primary h-7">
                  {isAr ? "الكل" : "All"} <ChevronRight className="w-3 h-3 ms-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">{isAr ? "لا توجد أهداف نشطة" : "No active goals"}</p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal: any) => {
                  const targetUsd = toUsd(goal.targetAmount, goal.exchangeRateToUsd);
                  const currentUsd = toUsd(goal.currentAmount, goal.exchangeRateToUsd);
                  const progress = targetUsd > 0 ? Math.min((currentUsd / targetUsd) * 100, 100) : 0;
                  const remaining = targetUsd - currentUsd;
                  return (
                    <div key={goal.id} data-testid={`row-goal-${goal.id}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{goal.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{progress.toFixed(0)}%</span>
                          <button
                            onClick={() => setContributeGoalId(goal.id)}
                            className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                            data-testid={`button-contribute-${goal.id}`}
                          >
                            <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{progress.toFixed(0)}% · {formatAmount(currentUsd)} / {formatAmount(targetUsd)}</span>
                        {remaining > 0 && <span className="text-xs text-gray-400">{isAr ? `متبقي ${formatAmount(remaining)}` : `${formatAmount(remaining)} left`}</span>}
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(goal.deadline), "MMM d, yyyy")}
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

      {/* ── BOTTOM 4 CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* Upcoming Bills */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-upcoming-bills">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold dark:text-white flex items-center gap-2">
              <span>💳</span> {isAr ? "الفواتير القادمة" : "Upcoming Bills"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBills.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">{isAr ? "لا توجد فواتير قريبة" : "No upcoming bills"}</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingBills.map((debt: any) => {
                  const urgency = billUrgency(debt.dueDate);
                  const daysLeft = Math.ceil((new Date(debt.dueDate).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={debt.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${urgency === "danger" ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" : urgency === "warning" ? "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`} data-testid={`bill-${debt.id}`}>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{debt.creditorName}</p>
                        <p className={`text-xs ${urgency === "danger" ? "text-red-500" : urgency === "warning" ? "text-yellow-600" : "text-gray-400"}`}>
                          {daysLeft <= 0 ? (isAr ? "متأخر" : "Overdue") : `${daysLeft}d left`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{formatAmount(toUsd(debt.remainingAmount, debt.exchangeRateToUsd))}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/debts">
              <Button variant="ghost" className="w-full mt-2 text-xs text-gray-400 h-7 hover:text-primary">
                {isAr ? "عرض الديون" : "View Debts"} <ChevronRight className="w-3 h-3 ms-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Spending Category */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-top-spending">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold dark:text-white flex items-center gap-2">
              <span>🏆</span> {isAr ? "أعلى فئة إنفاق" : "Top Spending Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSpendingCategory ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: topSpendingCategory.color + "25" }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: topSpendingCategory.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{topSpendingCategory.name}</p>
                    <p className="text-xs text-gray-400">{topSpendingCategory.pctOfTotal.toFixed(0)}% {isAr ? "من المصروفات" : "of expenses"}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{formatAmount(topSpendingCategory.amount)}</p>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(topSpendingCategory.pctOfTotal, 100)}%`, backgroundColor: topSpendingCategory.color }} />
                </div>
                {topSpendingCategory.prevAmt > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {isAr ? "الشهر الماضي:" : "Last month:"} {formatAmount(topSpendingCategory.prevAmt)}
                    <span className={`ms-1 font-semibold ${topSpendingCategory.amount > topSpendingCategory.prevAmt ? "text-red-500" : "text-green-600"}`}>
                      ({topSpendingCategory.amount > topSpendingCategory.prevAmt ? "+" : ""}{(((topSpendingCategory.amount - topSpendingCategory.prevAmt) / topSpendingCategory.prevAmt) * 100).toFixed(0)}%)
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">{isAr ? "لا توجد بيانات لهذا الشهر" : "No expense data this month"}</p>
            )}
          </CardContent>
        </Card>

        {/* AI Quick Insight */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" data-testid="card-ai-insight">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" /> {isAr ? "توصية ذكية" : "AI Quick Insight"}
              </CardTitle>
              <button
                onClick={loadAiInsight}
                disabled={aiLoading}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                data-testid="button-refresh-insight"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${aiLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ) : aiInsight ? (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsight}</p>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">{isAr ? "انقر تحديث" : "Click refresh to load"}</p>
            )}
            <Link href="/reports/ai">
              <Button variant="ghost" className="w-full mt-3 text-xs text-blue-600 dark:text-blue-400 h-7 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                {isAr ? "تقرير كامل" : "Full AI Report"} <ChevronRight className="w-3 h-3 ms-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Net Worth Trend */}
        <Card className="border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm" data-testid="card-net-worth-trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold dark:text-white flex items-center gap-2">
              <span>📈</span> {isAr ? "اتجاه التدفق النقدي" : "Cashflow Trend"}
            </CardTitle>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatAmount(totalWealth)}</p>
            <p className="text-xs text-gray-400">{isAr ? "إجمالي الثروة الحالية" : "Current net worth"}</p>
          </CardHeader>
          <CardContent>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={netWorthTrend}>
                  <Line
                    type="monotone" dataKey="net"
                    stroke="#3b82f6" strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "11px" }}
                    formatter={(v: any) => [formatAmount(v), isAr ? "صافي" : "Net"]}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MOBILE FAB ── */}
      <div className="fixed bottom-6 end-6 z-50 lg:hidden">
        <TransactionDialog />
      </div>

      {/* ── CONTRIBUTE TO GOAL DIALOG ── */}
      <Dialog open={contributeGoalId !== null} onOpenChange={() => { setContributeGoalId(null); setContributeAmount(""); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مساهمة للهدف" : "Add Goal Contribution"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="number"
              placeholder={isAr ? "المبلغ" : "Amount"}
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              data-testid="input-contribution-amount"
            />
            <Button
              className="w-full"
              onClick={handleContribute}
              disabled={!contributeAmount || createContribution.isPending}
              data-testid="button-submit-contribution"
            >
              {createContribution.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save Contribution")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

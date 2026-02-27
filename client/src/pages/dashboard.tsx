import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories, useAssets, useBankAccounts, useInvestments, useDebts, useGoals } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Landmark, Building2, LineChart, HandCoins, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

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
  const { t } = useI18n();

  const currentYear = new Date().getFullYear();
  const allTx = useMemo(() => (transactions as any[]), [transactions]);
  const allCats = useMemo(() => (categories as any[]), [categories]);

  const incomeCatIds = useMemo(() =>
    new Set(allCats.filter((c: any) => c.type === "income").map((c: any) => c.id))
  , [allCats]);

  const expenseCatIds = useMemo(() =>
    new Set(allCats.filter((c: any) => c.type === "expense").map((c: any) => c.id))
  , [allCats]);

  const totalIncome = useMemo(() =>
    allTx.filter((tx: any) => incomeCatIds.has(tx.categoryId)).reduce((s: number, tx: any) => s + toUsd(tx.amount, tx.exchangeRateToUsd), 0)
  , [allTx, incomeCatIds]);

  const totalExpenses = useMemo(() =>
    allTx.filter((tx: any) => expenseCatIds.has(tx.categoryId)).reduce((s: number, tx: any) => s + toUsd(tx.amount, tx.exchangeRateToUsd), 0)
  , [allTx, expenseCatIds]);

  const totalAssetsValue = useMemo(() =>
    (assets as any[]).reduce((s: number, a: any) => s + toUsd(a.currentValue || 0, a.exchangeRateToUsd), 0)
  , [assets]);

  const totalBankBalance = useMemo(() =>
    (bankAccounts as any[]).reduce((s: number, a: any) => s + toUsd(a.balance || 0, a.exchangeRateToUsd), 0)
  , [bankAccounts]);

  const totalInvestmentsValue = useMemo(() =>
    (investments as any[]).reduce((s: number, i: any) => s + toUsd(i.currentValue || 0, i.exchangeRateToUsd), 0)
  , [investments]);

  const totalDebt = useMemo(() =>
    (debts as any[]).filter((d: any) => d.status === "active").reduce((s: number, d: any) => s + toUsd(d.remainingAmount || 0, d.exchangeRateToUsd), 0)
  , [debts]);

  const totalWealth = totalAssetsValue + totalBankBalance + totalInvestmentsValue - totalDebt;
  const netCashflow = totalIncome - totalExpenses;

  const wealthBreakdown = useMemo(() => {
    const data = [];
    if (totalBankBalance > 0) data.push({ name: "Bank Accounts", value: totalBankBalance, color: "#3b82f6" });
    if (totalInvestmentsValue > 0) data.push({ name: "Investments", value: totalInvestmentsValue, color: "#22c55e" });
    if (totalAssetsValue > 0) data.push({ name: "Assets", value: totalAssetsValue, color: "#f59e0b" });
    if (data.length === 0) data.push({ name: "No Data", value: 1, color: "#e5e7eb" });
    return data;
  }, [totalBankBalance, totalInvestmentsValue, totalAssetsValue]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: { month: string; income: number; expenses: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const inc = allTx
        .filter((tx: any) => { const d = new Date(tx.date); return d.getMonth() === m && d.getFullYear() === currentYear && incomeCatIds.has(tx.categoryId); })
        .reduce((s: number, tx: any) => s + toUsd(tx.amount, tx.exchangeRateToUsd), 0);
      const exp = allTx
        .filter((tx: any) => { const d = new Date(tx.date); return d.getMonth() === m && d.getFullYear() === currentYear && expenseCatIds.has(tx.categoryId); })
        .reduce((s: number, tx: any) => s + toUsd(tx.amount, tx.exchangeRateToUsd), 0);
      if (inc > 0 || exp > 0) {
        data.push({ month: monthNames[m], income: inc, expenses: exp });
      }
    }
    return data;
  }, [allTx, currentYear, incomeCatIds, expenseCatIds]);

  const recentTransactions = useMemo(() =>
    allTx.slice(0, 5).map((tx: any) => {
      const cat = allCats.find((c: any) => c.id === tx.categoryId);
      return { ...tx, categoryName: cat?.name, categoryColor: cat?.color, categoryType: cat?.type };
    })
  , [allTx, allCats]);

  const activeGoals = useMemo(() => (goals as any[]).filter((g: any) => g.status === "active").slice(0, 3), [goals]);

  if (txLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">
          {t("dashboard")}
        </h2>
        <p className="text-[#666666] dark:text-gray-400 mt-1">Welcome back, {(user as any)?.firstName}! Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-wealth">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Total Wealth</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-wealth">{formatAmount(totalWealth)}</p>
            <p className="text-xs text-[#999] dark:text-gray-500 mt-1">Assets + Banks + Investments - Debts</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-net-cashflow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Net Cashflow</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${netCashflow >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                {netCashflow >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-net-cashflow">{formatAmount(netCashflow)}</p>
            <p className="text-xs text-[#999] dark:text-gray-500 mt-1">Income - Expenses ({currentYear})</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-debt">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Total Debt</span>
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <HandCoins className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-debt">{formatAmount(totalDebt)}</p>
            <p className="text-xs text-[#999] dark:text-gray-500 mt-1">{(debts as any[]).filter((d: any) => d.status === "active").length} active debts</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-bank-balance">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Bank Balance</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-bank-balance">{formatAmount(totalBankBalance)}</p>
            <p className="text-xs text-[#999] dark:text-gray-500 mt-1">{(bankAccounts as any[]).length} accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-financial-overview">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Income vs Expenses</CardTitle>
            <p className="text-sm text-[#666] dark:text-gray-400">{currentYear} monthly overview</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={2} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatAmount(v)} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(v: any) => formatAmount(v)} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#999] dark:text-gray-500">No transaction data for {currentYear}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-wealth-breakdown">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Wealth Breakdown</CardTitle>
            <p className="text-sm text-[#666] dark:text-gray-400">Where your wealth sits</p>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wealthBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {wealthBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatAmount(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {wealthBreakdown.filter(w => w.name !== "No Data").map((w, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-[#666] dark:text-gray-400">{w.name}</span>
                  </div>
                  <span className="font-semibold text-[#1a1a1a] dark:text-white">{formatAmount(w.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-recent-transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-[#999] dark:text-gray-500 py-6">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0" data-testid={`row-recent-tx-${tx.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (tx.categoryColor || "#666") + "20" }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.categoryColor || "#666" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">{tx.description}</p>
                        <p className="text-xs text-[#999] dark:text-gray-500">{tx.categoryName} · {format(new Date(tx.date), "MMM d")}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.categoryType === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.categoryType === "income" ? "+" : "-"}{formatAmount(toUsd(tx.amount, tx.exchangeRateToUsd))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-goals-progress">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-center text-[#999] dark:text-gray-500 py-6">No active goals</p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal: any) => {
                  const targetUsd = toUsd(goal.targetAmount, goal.exchangeRateToUsd);
                  const currentUsd = toUsd(goal.currentAmount, goal.exchangeRateToUsd);
                  const progress = targetUsd > 0 ? (currentUsd / targetUsd) * 100 : 0;
                  return (
                    <div key={goal.id} data-testid={`row-goal-${goal.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-[#1a1a1a] dark:text-white">{goal.name}</span>
                        </div>
                        <span className="text-xs text-[#999] dark:text-gray-500">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-[#999] dark:text-gray-500">{formatAmount(currentUsd)}</span>
                        <span className="text-xs text-[#999] dark:text-gray-500">{formatAmount(targetUsd)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

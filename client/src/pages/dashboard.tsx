import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { DollarSign, Receipt, TrendingUp, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { formatAmount } = useCurrency();
  const { t } = useI18n();

  const currentYear = new Date().getFullYear();

  const allTx = useMemo(() => (transactions as any[]), [transactions]);

  const totalIncome = useMemo(() =>
    allTx.filter((tx: any) => tx.type === "income").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [allTx]);

  const totalExpenses = useMemo(() =>
    allTx.filter((tx: any) => tx.type === "expense").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [allTx]);

  const totalInvestments = useMemo(() =>
    allTx.filter((tx: any) => tx.type === "investment").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [allTx]);

  const totalSavings = useMemo(() =>
    allTx.filter((tx: any) => tx.type === "savings").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [allTx]);

  const netCashflow = totalIncome - totalExpenses - totalInvestments - totalSavings;
  const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100) : 0;

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: { month: string; income: number; expenses: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const inc = allTx
        .filter((tx: any) => { const d = new Date(tx.date); return d.getMonth() === m && d.getFullYear() === currentYear && tx.type === "income"; })
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      const exp = allTx
        .filter((tx: any) => { const d = new Date(tx.date); return d.getMonth() === m && d.getFullYear() === currentYear && tx.type === "expense"; })
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      if (inc > 0 || exp > 0) {
        data.push({ month: monthNames[m], income: inc, expenses: exp });
      }
    }
    return data;
  }, [allTx, currentYear]);

  const totalOutflow = totalExpenses + totalInvestments + totalSavings;
  const maxOutflow = Math.max(totalExpenses, totalInvestments, totalSavings, 1);

  if (txLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">
          {t("dashboard")}
        </h2>
        <p className="text-[#666666] dark:text-gray-400 mt-1">Welcome back! Here's your financial overview for {currentYear}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-income">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Total Income</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-income">{formatAmount(totalIncome)}</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-expenses">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Total Expenses</span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-expenses">{formatAmount(totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm rounded-2xl ${netCashflow >= 0 ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950'}`} data-testid="card-net-cashflow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${netCashflow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Net Cashflow</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${netCashflow >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <TrendingUp className={`w-4 h-4 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`} data-testid="text-net-cashflow">{formatAmount(netCashflow)}</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-savings-rate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666] dark:text-gray-400">Savings Rate</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                <Percent className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-savings-rate">{savingsRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-financial-overview">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Financial Overview</CardTitle>
            <p className="text-sm text-[#666] dark:text-gray-400">Income vs Expenses over time</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={2} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatAmount(value)} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value: any) => formatAmount(value)}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#e11d48" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-cashflow-breakdown">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#1a1a1a] dark:text-white">Cashflow Breakdown</CardTitle>
            <p className="text-sm text-[#666] dark:text-gray-400">Where your money goes</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-gray-300">Investments</span>
                <span className="text-sm font-semibold text-[#1a1a1a] dark:text-white" data-testid="text-breakdown-investments">{formatAmount(totalInvestments)}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalOutflow > 0 ? (totalInvestments / maxOutflow) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-gray-300">Bank Savings</span>
                <span className="text-sm font-semibold text-[#1a1a1a] dark:text-white" data-testid="text-breakdown-savings">{formatAmount(totalSavings)}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${totalOutflow > 0 ? (totalSavings / maxOutflow) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-gray-300">Expenses</span>
                <span className="text-sm font-semibold text-[#1a1a1a] dark:text-white" data-testid="text-breakdown-expenses">{formatAmount(totalExpenses)}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${totalOutflow > 0 ? (totalExpenses / maxOutflow) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-gray-300">Remaining (Net)</span>
                <span className={`text-sm font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-breakdown-remaining">{formatAmount(netCashflow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories, useGoals } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { Link } from "wouter";
import { Wallet, Receipt, LineChart, PiggyBank, TrendingUp, TrendingDown, Target, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useGoals();
  const { formatAmount } = useCurrency();
  const { t } = useI18n();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTx = useMemo(() =>
    (transactions as any[]).filter((tx: any) => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
  , [transactions, currentMonth, currentYear]);

  const totalIncome = useMemo(() =>
    monthlyTx.filter((tx: any) => tx.type === "income").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [monthlyTx]);

  const totalExpenses = useMemo(() =>
    monthlyTx.filter((tx: any) => tx.type === "expense").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [monthlyTx]);

  const totalInvestments = useMemo(() =>
    monthlyTx.filter((tx: any) => tx.type === "investment").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [monthlyTx]);

  const totalSavings = useMemo(() =>
    monthlyTx.filter((tx: any) => tx.type === "savings").reduce((s: number, tx: any) => s + Number(tx.amount), 0)
  , [monthlyTx]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {};
    monthlyTx.filter((tx: any) => tx.type === "expense").forEach((tx: any) => {
      const cat = (categories as any[]).find((c: any) => c.id === tx.categoryId);
      const name = cat?.name || "Other";
      const color = cat?.color || "#94a3b8";
      if (!map[name]) map[name] = { name, amount: 0, color };
      map[name].amount += Number(tx.amount);
    });
    return Object.values(map);
  }, [monthlyTx, categories]);

  const last6MonthsData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("en", { month: "short" });
      const inc = (transactions as any[])
        .filter((tx: any) => { const dt = new Date(tx.date); return dt.getMonth() === m && dt.getFullYear() === y && tx.type === "income"; })
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      const exp = (transactions as any[])
        .filter((tx: any) => { const dt = new Date(tx.date); return dt.getMonth() === m && dt.getFullYear() === y && tx.type === "expense"; })
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      months.push({ month: label, income: inc, expenses: exp });
    }
    return months;
  }, [transactions, currentMonth, currentYear]);

  const activeGoals = (goals as any[]).filter((g: any) => g.status === "active" || !g.status);

  if (txLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  const summaryCards = [
    { label: t("totalIncome"), value: totalIncome, icon: Wallet, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", trend: TrendingUp },
    { label: t("totalExpenses"), value: totalExpenses, icon: Receipt, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", trend: TrendingDown },
    { label: t("investments"), value: totalInvestments, icon: LineChart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", trend: TrendingUp },
    { label: t("bankSavings"), value: totalSavings, icon: PiggyBank, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", trend: TrendingUp },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">
          {t("dashboard")}
        </h2>
        <p className="text-[#666666] dark:text-gray-400 mt-1">{t("thisMonth")} — {now.toLocaleDateString("en", { month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <card.trend className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-sm text-[#666] dark:text-gray-400">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`} data-testid={`text-summary-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
                {formatAmount(card.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg">{t("monthlyOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6MonthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(value: any) => formatAmount(value)}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("income")} />
                  <Bar dataKey="expenses" fill="#e11d48" radius={[4, 4, 0, 0]} name={t("expenses")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg">{t("expenseCategoriesBudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {expenseByCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {expenseByCategory.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="dark:text-gray-300">{cat.name}</span>
                      </div>
                      <span className="font-medium dark:text-white">{formatAmount(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{t("noEntries")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {activeGoals.length > 0 && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5" /> Financial Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.slice(0, 3).map((goal: any) => {
                const progress = Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);
                return (
                  <div key={goal.id} className="border dark:border-gray-700 rounded-xl p-4">
                    <h4 className="font-semibold dark:text-white">{goal.name}</h4>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>{formatAmount(goal.currentAmount)}</span>
                      <span>{formatAmount(goal.targetAmount)}</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% complete</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/income">
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="font-semibold dark:text-white">{t("income")}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/expenses">
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-red-500" />
                <span className="font-semibold dark:text-white">{t("expenses")}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </Layout>
  );
}

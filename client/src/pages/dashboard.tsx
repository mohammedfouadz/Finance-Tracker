import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { ArrowUp, ArrowDown, Wallet, PiggyBank, MoreHorizontal } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { TransactionDialog } from "@/components/transaction-dialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: transactions, isLoading: isTransLoading } = useTransactions();
  const { data: categories } = useCategories();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/");
    }
  }, [user, isAuthLoading, setLocation]);

  if (isAuthLoading || isTransLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  // Calculate totals
  const totalIncome = transactions
    ?.filter(t => categories?.find(c => c.id === t.categoryId)?.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalExpense = transactions
    ?.filter(t => categories?.find(c => c.id === t.categoryId)?.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const stats = [
    { 
      label: "Total Balance", 
      value: balance, 
      type: "neutral",
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      label: "Total Income", 
      value: totalIncome, 
      type: "income",
      icon: ArrowUp,
      color: "text-success",
      bg: "bg-success/10"
    },
    { 
      label: "Total Expenses", 
      value: totalExpense, 
      type: "expense",
      icon: ArrowDown,
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    { 
      label: "Savings Rate", 
      value: savingsRate, 
      type: "percentage",
      icon: PiggyBank,
      color: "text-accent",
      bg: "bg-accent/10"
    },
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName}. Here's your financial overview.
          </p>
        </div>
        <TransactionDialog />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold font-mono">
                  {stat.type === "percentage" 
                    ? `${stat.value.toFixed(1)}%` 
                    : `$${Math.abs(stat.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Recent Transactions */}
      <Card className="border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <a href="/transactions" className="text-sm text-primary hover:underline font-medium">View All</a>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.slice(0, 5).map((t) => {
              const category = categories?.find(c => c.id === t.categoryId);
              const isIncome = category?.type === 'income';
              
              return (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {isIncome ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{category?.name} • {format(new Date(t.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${isIncome ? 'text-success' : 'text-foreground'}`}>
                    {isIncome ? '+' : '-'}${Number(t.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
            {(!transactions || transactions.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No transactions found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

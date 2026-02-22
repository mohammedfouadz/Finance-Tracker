import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { ArrowUp, ArrowDown, Wallet, PiggyBank, MoreHorizontal, Receipt, LineChart } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { TransactionDialog } from "@/components/transaction-dialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
      label: "Total Income", 
      value: totalIncome, 
      type: "income",
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/5"
    },
    { 
      label: "Total Expenses", 
      value: totalExpense, 
      type: "expense",
      icon: Receipt,
      color: "text-black",
      bg: "bg-secondary/50"
    },
    { 
      label: "Net Cashflow", 
      value: balance, 
      type: "neutral",
      icon: LineChart,
      color: "text-[#e11d48]",
      bg: "bg-red-50"
    },
    { 
      label: "Savings Rate", 
      value: savingsRate, 
      type: "percentage",
      icon: PiggyBank,
      color: "text-success",
      bg: "bg-green-50"
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Dashboard</h2>
        <p className="text-[#666666] mt-1">
          Welcome back! Here's your financial overview for 2026.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666666] mb-2">{stat.label}</p>
                  <h3 className={cn(
                    "text-2xl font-bold tracking-tight",
                    stat.label === "Net Cashflow" && stat.value < 0 ? "text-[#e11d48]" : "text-[#1a1a1a]"
                  )}>
                    {stat.type === "percentage" 
                      ? `${stat.value.toFixed(1)}%` 
                      : `${stat.value < 0 ? '-' : ''}$${Math.abs(stat.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  </h3>
                </div>
                <div className={cn("p-4 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white p-4">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl font-bold">Financial Overview</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Income vs Expenses over time</p>
          </CardHeader>
          <CardContent>
            <DashboardCharts type="bar" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white p-4">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl font-bold">Cashflow Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Where your money goes</p>
          </CardHeader>
          <CardContent>
            <DashboardCharts type="list" />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

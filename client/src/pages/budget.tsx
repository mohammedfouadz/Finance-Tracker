import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTransactions, useCategories, useBudgets, useCreateBudget, useUpdateBudget } from "@/hooks/use-finance";
import { useCurrency, toUsd } from "@/lib/currency";
import { PiggyBank, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function BudgetPage() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});

  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: transactions, isLoading: isTransLoading } = useTransactions();
  const { data: budgetData, isLoading: isBudgetLoading } = useBudgets(month, year);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isLoading = isCatLoading || isTransLoading || isBudgetLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const expenseCategories = categories?.filter((c: any) => c.type === "expense") || [];

  const budgetMap = new Map((budgetData || []).map((b: any) => [b.categoryId, b]));

  const handleSaveBudget = async (categoryId: number) => {
    const amountStr = editingAmounts[categoryId];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      const existing = budgetMap.get(categoryId) as any;
      if (existing) {
        await updateBudget.mutateAsync({ id: existing.id, amount: amountStr });
      } else {
        await createBudget.mutateAsync({ userId: user!.id, categoryId, month, year, amount: amountStr });
      }
      setEditingAmounts(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      toast({ title: "Budget saved" });
    } catch {
      toast({ title: "Failed to save budget", variant: "destructive" });
    }
  };

  const totalBudgeted = (budgetData || []).reduce((s: number, b: any) => s + Number(b.amount), 0);
  const totalSpent = expenseCategories.reduce((total: number, cat: any) => {
    const spent = (transactions || [])
      .filter((t: any) => t.categoryId === cat.id && new Date(t.date).getMonth() + 1 === month && new Date(t.date).getFullYear() === year)
      .reduce((s: number, t: any) => s + toUsd(t.amount, t.exchangeRateToUsd), 0);
    return total + spent;
  }, 0);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Budget Planning</h2>
          <p className="text-muted-foreground">Set and track monthly spending limits per category.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold min-w-[140px] text-center" data-testid="text-month-year">{MONTH_NAMES[month - 1]} {year}</span>
          <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budgeted</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-budgeted">{formatAmount(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent This Month</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudgeted && totalBudgeted > 0 ? "text-destructive" : "text-foreground"}`} data-testid="text-total-spent">{formatAmount(totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Category Budgets</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-6">
            {expenseCategories.map((category: any) => {
              const spent = (transactions || [])
                .filter((t: any) => t.categoryId === category.id && new Date(t.date).getMonth() + 1 === month && new Date(t.date).getFullYear() === year)
                .reduce((s: number, t: any) => s + toUsd(t.amount, t.exchangeRateToUsd), 0);

              const existingBudget = budgetMap.get(category.id) as any;
              const limit = existingBudget ? Number(existingBudget.amount) : 0;
              const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const isOver = limit > 0 && spent > limit;
              const isEditing = editingAmounts[category.id] !== undefined;
              const currentEditValue = editingAmounts[category.id] ?? (limit > 0 ? String(limit) : "");

              return (
                <div key={category.id} className="space-y-2" data-testid={`budget-row-${category.id}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: category.color + "20" }}>
                        <PiggyBank className="w-4 h-4" style={{ color: category.color }} />
                      </div>
                      <span className="font-medium truncate">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-muted-foreground">{formatAmount(spent)}</span>
                      <span className="text-muted-foreground">/</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="w-24 h-8 text-sm text-right"
                          placeholder="Set limit"
                          value={currentEditValue}
                          onChange={e => setEditingAmounts(prev => ({ ...prev, [category.id]: e.target.value }))}
                          data-testid={`input-budget-${category.id}`}
                        />
                        {isEditing && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => handleSaveBudget(category.id)}
                            disabled={createBudget.isPending || updateBudget.isPending}
                            data-testid={`button-save-budget-${category.id}`}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {limit > 0 ? (
                    <>
                      <Progress value={percent} className={`h-2 ${isOver ? "[&>div]:bg-destructive" : ""}`} />
                      <p className={`text-xs ${isOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {isOver ? `${formatAmount(spent - limit)} over budget` : `${formatAmount(limit - spent)} remaining`}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No budget set — type an amount above and click save</p>
                  )}
                </div>
              );
            })}
            {expenseCategories.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No expense categories found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useTransactions, useCategories, useCreateTransaction, useDeleteTransaction } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { Plus, Trash2, AlertTriangle, TrendingDown } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: new Date().toISOString().split("T")[0], currencyCode: "USD", exchangeRateToUsd: "1" });

  const expenseCategories = useMemo(() => categories?.filter((c: any) => c.type === "expense") || [], [categories]);
  const incomeCategories = useMemo(() => categories?.filter((c: any) => c.type === "income") || [], [categories]);

  const monthTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const totalMonthlyIncome = useMemo(() => {
    const incomeCatIds = new Set(incomeCategories.map((c: any) => c.id));
    return monthTransactions.filter((t: any) => incomeCatIds.has(t.categoryId)).reduce((sum: number, t: any) => sum + toUsd(t.amount, t.exchangeRateToUsd), 0);
  }, [monthTransactions, incomeCategories]);

  const expenseTransactions = useMemo(() => {
    const expCatIds = new Set(expenseCategories.map((c: any) => c.id));
    return monthTransactions.filter((t: any) => expCatIds.has(t.categoryId));
  }, [monthTransactions, expenseCategories]);

  const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + toUsd(t.amount, t.exchangeRateToUsd), 0);

  const categoryBreakdown = useMemo(() => {
    return expenseCategories.map((cat: any) => {
      const spent = expenseTransactions.filter((t: any) => t.categoryId === cat.id).reduce((sum: number, t: any) => sum + toUsd(t.amount, t.exchangeRateToUsd), 0);
      const allocPct = Number(cat.allocationPercentage) || 0;
      const maxAllowed = totalMonthlyIncome > 0 ? (allocPct / 100) * totalMonthlyIncome : 0;
      const pctUsed = maxAllowed > 0 ? (spent / maxAllowed) * 100 : 0;
      const isOver = spent > maxAllowed && maxAllowed > 0;
      return { ...cat, spent, allocPct, maxAllowed, pctUsed, isOver };
    }).filter((c: any) => c.spent > 0 || c.allocPct > 0);
  }, [expenseCategories, expenseTransactions, totalMonthlyIncome]);

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
      setFormData({ description: "", amount: "", categoryId: "", date: new Date().toISOString().split("T")[0], currencyCode: "USD", exchangeRateToUsd: "1" });
      setShowForm(false);
      toast({ title: "Expense added successfully" });
    } catch {
      toast({ title: "Failed to add expense", variant: "destructive" });
    }
  };

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Expenses</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track spending vs budget per category.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-expense">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Monthly Income</p>
            <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{formatAmount(totalMonthlyIncome)}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Expenses</p>
            <h3 className="text-2xl font-bold text-[#e11d48]" data-testid="text-total-expenses">{formatAmount(totalExpenses)}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Remaining</p>
            <h3 className={`text-2xl font-bold ${totalMonthlyIncome - totalExpenses < 0 ? 'text-[#e11d48]' : 'text-green-600'}`}>
              {formatAmount(totalMonthlyIncome - totalExpenses)}
            </h3>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Item Name</label>
                  <Input data-testid="input-description" placeholder="e.g. Rent" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Amount</label>
                  <Input data-testid="input-amount" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Category</label>
                  <Select value={formData.categoryId || undefined} onValueChange={v => setFormData({...formData, categoryId: v})}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Date</label>
                  <Input data-testid="input-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <CurrencyFields
                  currencyCode={formData.currencyCode}
                  exchangeRate={formData.exchangeRateToUsd}
                  amount={formData.amount}
                  onCurrencyChange={(code) => setFormData({...formData, currencyCode: code})}
                  onExchangeRateChange={(rate) => setFormData({...formData, exchangeRateToUsd: rate})}
                  showUsdPreview={true}
                />
                <Button type="submit" disabled={createTransaction.isPending} data-testid="button-submit-expense">
                  {createTransaction.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
        <CardHeader><CardTitle>Budget vs Actual ({MONTHS[selectedMonth - 1]})</CardTitle></CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-6">No budget allocations set. Go to Settings to configure category budgets.</p>
          ) : (
            <div className="space-y-6">
              {categoryBreakdown.map((cat: any) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.name}</span>
                      {cat.isOver && <AlertTriangle className="w-4 h-4 text-[#e11d48]" />}
                    </div>
                    <div className="text-sm text-right">
                      <span className={cat.isOver ? "text-[#e11d48] font-bold" : "text-[#1a1a1a] dark:text-white font-bold"}>{formatAmount(cat.spent)}</span>
                      <span className="text-[#999] dark:text-gray-500"> / {formatAmount(cat.maxAllowed)}</span>
                      <span className="text-[#999] dark:text-gray-500 ml-2">({cat.allocPct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#f1f5f9] dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(cat.pctUsed, 100)}%`,
                        backgroundColor: cat.isOver ? '#e11d48' : cat.pctUsed > 80 ? '#f59e0b' : '#2563eb'
                      }}
                    />
                  </div>
                  {cat.isOver && (
                    <p className="text-xs text-[#e11d48] font-medium">Over budget by {formatAmount(cat.spent - cat.maxAllowed)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Expense Entries</CardTitle></CardHeader>
        <CardContent>
          {expenseTransactions.length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No expenses recorded this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">USD Value</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t: any) => {
                      const cat = categories?.find((c: any) => c.id === t.categoryId);
                      const curr = t.currencyCode || "USD";
                      const usdVal = toUsd(t.amount, t.exchangeRateToUsd);
                      return (
                        <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-expense-${t.id}`}>
                          <td className="py-3 px-4">{format(new Date(t.date), "MMM d, yyyy")}</td>
                          <td className="py-3 px-4 font-medium">{t.description}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">{cat?.name}</span></td>
                          <td className="py-3 px-4 text-right font-bold text-[#e11d48]">{getCurrencySymbol(curr)}{Number(t.amount).toLocaleString()} {curr}</td>
                          <td className="py-3 px-4 text-right text-[#666] dark:text-gray-400">{curr !== "USD" ? formatAmount(usdVal) : ""}</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteTransaction.mutateAsync(t.id).then(() => toast({ title: "Deleted" }))}
                              data-testid={`button-delete-${t.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
    </Layout>
  );
}

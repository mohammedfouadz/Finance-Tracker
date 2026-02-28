import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions, useCategories, useCreateTransaction, useDeleteTransaction } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function IncomePage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: "", categoryId: "", date: new Date().toISOString().split("T")[0], currencyCode: "USD", exchangeRateToUsd: "1" });

  const incomeCategories = useMemo(() => categories?.filter((c: any) => c.type === "income") || [], [categories]);

  const incomeTransactions = useMemo(() => {
    if (!transactions || !categories) return [];
    const incomeCatIds = new Set(incomeCategories.map((c: any) => c.id));
    return transactions.filter((t: any) => incomeCatIds.has(t.categoryId));
  }, [transactions, incomeCategories, categories]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let m = 0; m < 12; m++) totals[m] = 0;
    incomeTransactions.forEach((t: any) => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        totals[d.getMonth()] += toUsd(t.amount, t.exchangeRateToUsd);
      }
    });
    return totals;
  }, [incomeTransactions, selectedYear]);

  const totalIncome = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
  const currentMonth = new Date().getMonth();
  const currentMonthIncome = monthlyTotals[currentMonth] || 0;

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
      toast({ title: "Income added successfully" });
    } catch {
      toast({ title: "Failed to add income", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction.mutateAsync(id);
      toast({ title: "Income entry deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Income</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track and manage your income sources.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-income">
            <Plus className="w-4 h-4 mr-2" /> Add Income
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-2">Total Income ({selectedYear})</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-income">{formatAmount(totalIncome)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-green-50"><DollarSign className="w-6 h-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-2">This Month</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-monthly-income">{formatAmount(currentMonthIncome)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-blue-50"><DollarSign className="w-6 h-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-2">Monthly Average</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{formatAmount(totalIncome / 12)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-purple-50"><DollarSign className="w-6 h-6 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Add Income Entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Description</label>
                  <Input data-testid="input-description" placeholder="e.g. Monthly Salary" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
                      {incomeCategories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
                  onCurrencyChange={(code) => setFormData(prev => ({...prev, currencyCode: code}))}
                  onExchangeRateChange={(rate) => setFormData(prev => ({...prev, exchangeRateToUsd: rate}))}
                  showUsdPreview={true}
                />
                <Button type="submit" disabled={createTransaction.isPending} data-testid="button-submit-income">
                  {createTransaction.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
        <CardHeader><CardTitle>Monthly Income Overview ({selectedYear})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Total Income</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((month, i) => (
                  <tr key={i} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors">
                    <td className="py-3 px-4 font-medium">{month}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#1a1a1a] dark:text-white">{formatAmount(monthlyTotals[i])}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5 font-bold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right text-primary">{formatAmount(totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Income Entries</CardTitle></CardHeader>
        <CardContent>
          {incomeTransactions.length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No income entries yet. Click "Add Income" to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">USD Value</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions
                    .filter((t: any) => new Date(t.date).getFullYear() === selectedYear)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t: any) => {
                      const cat = categories?.find((c: any) => c.id === t.categoryId);
                      const curr = t.currencyCode || "USD";
                      const usdVal = toUsd(t.amount, t.exchangeRateToUsd);
                      return (
                        <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-income-${t.id}`}>
                          <td className="py-3 px-4">{format(new Date(t.date), "MMM d, yyyy")}</td>
                          <td className="py-3 px-4 font-medium">{t.description}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">{cat?.name}</span></td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">{getCurrencySymbol(curr)}{Number(t.amount).toLocaleString()} {curr}</td>
                          <td className="py-3 px-4 text-right text-[#666] dark:text-gray-400">{curr !== "USD" ? formatAmount(usdVal) : ""}</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(t.id)} data-testid={`button-delete-${t.id}`}>
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

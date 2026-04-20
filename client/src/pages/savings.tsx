import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions, useCategories, useCreateTransaction, useCreateCategory, useDeleteTransaction } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { Plus, Trash2, PiggyBank, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SavingsPage() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const createCategory = useCreateCategory();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ bankName: "", amount: "", date: new Date().toISOString().split("T")[0] });

  const savingsCategoryId = useMemo(() => {
    const cat = categories?.find((c: any) => c.name === "Bank Savings" || (c.name === "Savings" && c.type === "expense"));
    return cat?.id;
  }, [categories]);

  const getOrCreateSavingsCategory = async () => {
    if (savingsCategoryId) return savingsCategoryId;
    const created = await createCategory.mutateAsync({
      name: "Bank Savings",
      type: "expense",
      color: "#2563eb",
      userId: user!.id,
    });
    return created.id;
  };

  const savingsTransactions = useMemo(() => {
    if (!transactions || !categories) return [];
    const savCatIds = new Set(
      categories.filter((c: any) => c.name === "Bank Savings" || (c.name === "Savings" && c.type === "expense")).map((c: any) => c.id)
    );
    return transactions.filter((t: any) => savCatIds.has(t.categoryId));
  }, [transactions, categories]);

  const monthTransactions = useMemo(() => {
    return savingsTransactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [savingsTransactions, selectedMonth, selectedYear]);

  const totalMonthlyIncome = useMemo(() => {
    if (!transactions || !categories) return 0;
    const incomeCatIds = new Set(categories.filter((c: any) => c.type === "income").map((c: any) => c.id));
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear && incomeCatIds.has(t.categoryId);
    }).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  }, [transactions, categories, selectedMonth, selectedYear]);

  const totalMonthlySavings = monthTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalAllTimeSavings = savingsTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const savingsPct = totalMonthlyIncome > 0 ? (totalMonthlySavings / totalMonthlyIncome) * 100 : 0;

  const bankBreakdown = useMemo(() => {
    const banks: Record<string, number> = {};
    monthTransactions.forEach((t: any) => {
      const bankName = t.description || "Unknown Bank";
      banks[bankName] = (banks[bankName] || 0) + Number(t.amount);
    });
    return Object.entries(banks).map(([name, amount]) => ({ name, amount }));
  }, [monthTransactions]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.bankName || !formData.amount) return;
    try {
      const catId = await getOrCreateSavingsCategory();
      await createTransaction.mutateAsync({
        userId: user!.id,
        description: formData.bankName,
        amount: formData.amount,
        categoryId: catId,
        date: new Date(formData.date),
      });
      setFormData({ bankName: "", amount: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast({ title: "Savings recorded" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
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
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Bank Savings</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track monthly savings by bank.</p>
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
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-savings">
            <Plus className="w-4 h-4 mr-2" /> Add Savings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">This Month</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-monthly-savings">{formatAmount(totalMonthlySavings)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30"><PiggyBank className="w-6 h-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">% of Income</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{savingsPct.toFixed(1)}%</h3>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30"><PiggyBank className="w-6 h-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">All-Time Savings</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{formatAmount(totalAllTimeSavings)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30"><Building2 className="w-6 h-6 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Add Savings Entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Bank Name</label>
                <Input data-testid="input-bank" placeholder="e.g. Chase, BOA..." value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Amount</label>
                <Input data-testid="input-amount" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Date</label>
                <Input data-testid="input-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <Button type="submit" disabled={createTransaction.isPending} data-testid="button-submit-savings">
                {createTransaction.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {bankBreakdown.length > 0 && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Savings by Bank ({MONTHS[selectedMonth - 1]})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bankBreakdown.map((bank, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-[#f8f9fa] dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{bank.name}</span>
                  </div>
                  <span className="font-bold text-[#1a1a1a] dark:text-white">{formatAmount(bank.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Savings Entries</CardTitle></CardHeader>
        <CardContent>
          {monthTransactions.length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No savings recorded this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Bank Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Saved Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTransactions
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t: any) => (
                      <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-savings-${t.id}`}>
                        <td className="py-3 px-4">{format(new Date(t.date), "MMM d, yyyy")}</td>
                        <td className="py-3 px-4 font-medium">{t.description}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">{formatAmount(Number(t.amount))}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => deleteTransaction.mutateAsync(t.id).then(() => toast({ title: "Deleted" }))}
                            data-testid={`button-delete-${t.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

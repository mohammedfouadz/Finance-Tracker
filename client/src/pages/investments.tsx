import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions, useCategories, useCreateTransaction, useCreateCategory, useDeleteTransaction } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { Plus, Trash2, TrendingUp, Gem, BarChart3, Bitcoin } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const INVESTMENT_TYPES = [
  { name: "Gold", icon: Gem, color: "#f59e0b", bgColor: "bg-amber-50" },
  { name: "Stocks", icon: BarChart3, color: "#2563eb", bgColor: "bg-blue-50" },
  { name: "Cryptocurrencies", icon: Bitcoin, color: "#8b5cf6", bgColor: "bg-purple-50" },
];

export default function InvestmentsPage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const createCategory = useCreateCategory();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: "", investmentType: "", date: new Date().toISOString().split("T")[0] });

  const investmentCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c: any) =>
      INVESTMENT_TYPES.some(it => c.name.toLowerCase().includes(it.name.toLowerCase())) ||
      (c.name === "Investments" && c.type === "income")
    );
  }, [categories]);

  const getOrCreateCategory = async (typeName: string) => {
    const existing = categories?.find((c: any) => c.name === typeName && c.type === "expense");
    if (existing) return existing.id;
    const created = await createCategory.mutateAsync({
      name: typeName,
      type: "expense",
      color: INVESTMENT_TYPES.find(it => it.name === typeName)?.color || "#8b5cf6",
      userId: user!.id,
    });
    return created.id;
  };

  const investmentTransactions = useMemo(() => {
    if (!transactions || !categories) return [];
    const invCatNames = INVESTMENT_TYPES.map(t => t.name.toLowerCase());
    const invCatIds = new Set(
      categories.filter((c: any) => invCatNames.some(n => c.name.toLowerCase().includes(n))).map((c: any) => c.id)
    );
    return transactions.filter((t: any) => invCatIds.has(t.categoryId));
  }, [transactions, categories]);

  const monthTransactions = useMemo(() => {
    return investmentTransactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [investmentTransactions, selectedMonth, selectedYear]);

  const totalMonthlyIncome = useMemo(() => {
    if (!transactions || !categories) return 0;
    const incomeCatIds = new Set(categories.filter((c: any) => c.type === "income").map((c: any) => c.id));
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear && incomeCatIds.has(t.categoryId);
    }).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  }, [transactions, categories, selectedMonth, selectedYear]);

  const typeBreakdown = useMemo(() => {
    return INVESTMENT_TYPES.map(type => {
      const catIds = new Set(
        categories?.filter((c: any) => c.name.toLowerCase().includes(type.name.toLowerCase())).map((c: any) => c.id) || []
      );
      const total = monthTransactions.filter((t: any) => catIds.has(t.categoryId)).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const pct = totalMonthlyIncome > 0 ? (total / totalMonthlyIncome) * 100 : 0;
      return { ...type, total, pct };
    });
  }, [monthTransactions, categories, totalMonthlyIncome]);

  const totalInvestments = typeBreakdown.reduce((sum, t) => sum + t.total, 0);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.investmentType) return;
    try {
      const catId = await getOrCreateCategory(formData.investmentType);
      await createTransaction.mutateAsync({
        userId: user!.id,
        description: formData.description,
        amount: formData.amount,
        categoryId: catId,
        date: new Date(formData.date),
      });
      setFormData({ description: "", amount: "", investmentType: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast({ title: "Investment recorded" });
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
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Investments</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track Gold, Stocks and Crypto investments.</p>
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
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-investment">
            <Plus className="w-4 h-4 mr-2" /> Add Investment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {typeBreakdown.map((type, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">{type.name}</p>
                  <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{formatAmount(type.total)}</h3>
                  <p className="text-xs text-[#999] dark:text-gray-500 mt-1">{type.pct.toFixed(1)}% of income</p>
                </div>
                <div className={`p-4 rounded-xl ${type.bgColor}`}>
                  <type.icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Invested</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-investments">{formatAmount(totalInvestments)}</h3>
                <p className="text-xs text-[#999] dark:text-gray-500 mt-1">{totalMonthlyIncome > 0 ? ((totalInvestments / totalMonthlyIncome) * 100).toFixed(1) : 0}% of income</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50"><TrendingUp className="w-6 h-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Record Investment</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Description</label>
                <Input data-testid="input-description" placeholder="e.g. Gold coins" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Amount</label>
                <Input data-testid="input-amount" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Type</label>
                <Select value={formData.investmentType} onValueChange={v => setFormData({...formData, investmentType: v})}>
                  <SelectTrigger data-testid="select-type"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Date</label>
                <Input data-testid="input-date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <Button type="submit" disabled={createTransaction.isPending} data-testid="button-submit-investment">
                {createTransaction.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Investment Entries</CardTitle></CardHeader>
        <CardContent>
          {monthTransactions.length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No investments recorded this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTransactions
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t: any) => {
                      const cat = categories?.find((c: any) => c.id === t.categoryId);
                      return (
                        <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-investment-${t.id}`}>
                          <td className="py-3 px-4">{format(new Date(t.date), "MMM d, yyyy")}</td>
                          <td className="py-3 px-4 font-medium">{t.description}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">{cat?.name}</span></td>
                          <td className="py-3 px-4 text-right font-bold">{formatAmount(Number(t.amount))}</td>
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

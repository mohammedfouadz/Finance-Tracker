import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { Plus, Trash2, Save } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, updatePreferences } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const { t } = useI18n();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "expense", color: "#2563eb", allocationPercentage: "" });
  const [editingAllocations, setEditingAllocations] = useState<Record<number, string>>({});

  const expenseCategories = useMemo(() => categories?.filter((c: any) => c.type === "expense") || [], [categories]);
  const incomeCategories = useMemo(() => categories?.filter((c: any) => c.type === "income") || [], [categories]);

  const totalAllocation = useMemo(() => {
    return expenseCategories.reduce((sum: number, c: any) => {
      const alloc = editingAllocations[c.id] !== undefined ? Number(editingAllocations[c.id]) : Number(c.allocationPercentage || 0);
      return sum + alloc;
    }, 0);
  }, [expenseCategories, editingAllocations]);

  const handleCreateCategory = async (e: any) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await createCategory.mutateAsync({
        name: formData.name,
        type: formData.type,
        color: formData.color,
        userId: user!.id,
        allocationPercentage: formData.allocationPercentage || undefined,
      });
      setFormData({ name: "", type: "expense", color: "#2563eb", allocationPercentage: "" });
      setShowForm(false);
      toast({ title: "Category created" });
    } catch {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  };

  const handleSaveAllocation = async (catId: number) => {
    const val = editingAllocations[catId];
    if (val === undefined) return;
    try {
      await updateCategory.mutateAsync({ id: catId, allocationPercentage: val });
      const newEditing = { ...editingAllocations };
      delete newEditing[catId];
      setEditingAllocations(newEditing);
      toast({ title: "Budget allocation updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    try {
      await deleteCategory.mutateAsync(catId);
      toast({ title: "Category deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    try {
      await updatePreferences({ currency: value });
      toast({ title: "Currency updated" });
    } catch {
      toast({ title: "Failed to update currency", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">{t("settings")}</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">{t("manageCategories")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-category">
          <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t("addCategory")}
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
        <CardHeader><CardTitle>{t("currency")}</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>{t("addCategory")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">{t("name")}</label>
                <Input data-testid="input-name" placeholder="e.g. Subscriptions" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">{t("type")}</label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t("expenses")}</SelectItem>
                    <SelectItem value="income">{t("income")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">{t("color")}</label>
                <Input data-testid="input-color" type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="h-10" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">{t("budgetAllocation")} %</label>
                <Input data-testid="input-allocation" type="number" step="0.1" min="0" max="100" placeholder="e.g. 10" value={formData.allocationPercentage} onChange={e => setFormData({...formData, allocationPercentage: e.target.value})} />
              </div>
              <Button type="submit" disabled={createCategory.isPending} data-testid="button-submit-category">
                {createCategory.isPending ? "..." : t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("expenseCategoriesBudget")}</CardTitle>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${totalAllocation > 100 ? 'bg-red-50 dark:bg-red-950 text-[#e11d48]' : totalAllocation === 100 ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-amber-50 dark:bg-amber-950 text-amber-700'}`}>
              Total: {totalAllocation.toFixed(1)}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-800">
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("category")}</th>
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("color")}</th>
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("system")}</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("budgetAllocation")} %</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {expenseCategories.map((cat: any) => {
                  const currentAlloc = editingAllocations[cat.id] !== undefined ? editingAllocations[cat.id] : (cat.allocationPercentage || "");
                  const isEditing = editingAllocations[cat.id] !== undefined;
                  return (
                    <tr key={cat.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-category-${cat.id}`}>
                      <td className="py-3 px-4 font-medium dark:text-white">{cat.name}</td>
                      <td className="py-3 px-4"><div className="w-6 h-6 rounded-full" style={{ backgroundColor: cat.color }} /></td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isSystem ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{cat.isSystem ? t("system") : t("custom")}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-20 text-center h-8"
                            value={currentAlloc}
                            onChange={e => setEditingAllocations({ ...editingAllocations, [cat.id]: e.target.value })}
                            data-testid={`input-alloc-${cat.id}`}
                          />
                          <span className="text-[#999] dark:text-gray-500">%</span>
                          {isEditing && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => handleSaveAllocation(cat.id)} data-testid={`button-save-alloc-${cat.id}`}>
                              <Save className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!cat.isSystem && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteCategory(cat.id)} data-testid={`button-delete-${cat.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>{t("incomeCategories")}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-800">
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("category")}</th>
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("color")}</th>
                  <th className="text-left rtl:text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("system")}</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {incomeCategories.map((cat: any) => (
                  <tr key={cat.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors">
                    <td className="py-3 px-4 font-medium dark:text-white">{cat.name}</td>
                    <td className="py-3 px-4"><div className="w-6 h-6 rounded-full" style={{ backgroundColor: cat.color }} /></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isSystem ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{cat.isSystem ? t("system") : t("custom")}</span></td>
                    <td className="py-3 px-4 text-center">
                      {!cat.isSystem && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

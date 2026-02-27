import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Gem, BarChart3, Bitcoin, Building2, Landmark, MoreHorizontal, X } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const INVESTMENT_TYPES = [
  { name: "Gold", icon: Gem, color: "#f59e0b", bgColor: "bg-amber-50 dark:bg-amber-950" },
  { name: "Stocks", icon: BarChart3, color: "#2563eb", bgColor: "bg-blue-50 dark:bg-blue-950" },
  { name: "Crypto", icon: Bitcoin, color: "#8b5cf6", bgColor: "bg-purple-50 dark:bg-purple-950" },
  { name: "Real Estate", icon: Building2, color: "#059669", bgColor: "bg-emerald-50 dark:bg-emerald-950" },
  { name: "Bonds", icon: Landmark, color: "#dc2626", bgColor: "bg-red-50 dark:bg-red-950" },
  { name: "Other", icon: MoreHorizontal, color: "#6b7280", bgColor: "bg-gray-50 dark:bg-gray-800" },
];

const emptyForm = {
  name: "",
  type: "",
  quantity: "",
  purchasePrice: "",
  unitPriceAtPurchase: "",
  currentValue: "",
  currencyCode: "USD",
  exchangeRateToUsd: "1",
  purchaseDate: new Date().toISOString().split("T")[0],
  platform: "",
  status: "active",
  sellDate: "",
  sellPrice: "",
  notes: "",
};

export default function InvestmentsPage() {
  const { user } = useAuth();
  const { data: investments, isLoading } = useInvestments();
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const deleteInvestment = useDeleteInvestment();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const activeInvestments = useMemo(() => {
    if (!investments) return [];
    return (investments as any[]).filter((inv: any) => inv.status === "active");
  }, [investments]);

  const soldInvestments = useMemo(() => {
    if (!investments) return [];
    return (investments as any[]).filter((inv: any) => inv.status === "sold");
  }, [investments]);

  const totalPortfolioValue = useMemo(() => {
    return activeInvestments.reduce((sum: number, inv: any) => sum + toUsd(inv.currentValue, inv.exchangeRateToUsd), 0);
  }, [activeInvestments]);

  const totalGainLoss = useMemo(() => {
    return activeInvestments.reduce((sum: number, inv: any) => sum + (toUsd(inv.currentValue, inv.exchangeRateToUsd) - toUsd(inv.purchasePrice, inv.exchangeRateToUsd)), 0);
  }, [activeInvestments]);

  const typeBreakdown = useMemo(() => {
    if (!investments) return INVESTMENT_TYPES.map(t => ({ ...t, total: 0, count: 0 }));
    return INVESTMENT_TYPES.map(type => {
      const matching = activeInvestments.filter((inv: any) => inv.type === type.name);
      const total = matching.reduce((sum: number, inv: any) => sum + toUsd(inv.currentValue, inv.exchangeRateToUsd), 0);
      return { ...type, total, count: matching.length };
    });
  }, [investments, activeInvestments]);

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setFormData({
      name: inv.name || "",
      type: inv.type || "",
      quantity: inv.quantity || "",
      purchasePrice: inv.purchasePrice || "",
      unitPriceAtPurchase: inv.unitPriceAtPurchase || "",
      currentValue: inv.currentValue || "",
      currencyCode: inv.currencyCode || "USD",
      exchangeRateToUsd: String(inv.exchangeRateToUsd || "1"),
      purchaseDate: inv.purchaseDate ? new Date(inv.purchaseDate).toISOString().split("T")[0] : "",
      platform: inv.platform || "",
      status: inv.status || "active",
      sellDate: inv.sellDate ? new Date(inv.sellDate).toISOString().split("T")[0] : "",
      sellPrice: inv.sellPrice || "",
      notes: inv.notes || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.purchasePrice || !formData.currentValue || !formData.purchaseDate) return;
    try {
      const payload: any = {
        userId: user!.id,
        name: formData.name,
        type: formData.type,
        quantity: formData.quantity || null,
        purchasePrice: formData.purchasePrice,
        unitPriceAtPurchase: formData.unitPriceAtPurchase || null,
        currentValue: formData.currentValue,
        currencyCode: formData.currencyCode,
        exchangeRateToUsd: formData.exchangeRateToUsd,
        purchaseDate: new Date(formData.purchaseDate),
        platform: formData.platform || null,
        status: formData.status,
        sellDate: formData.status === "sold" && formData.sellDate ? new Date(formData.sellDate) : null,
        sellPrice: formData.status === "sold" && formData.sellPrice ? formData.sellPrice : null,
        notes: formData.notes || null,
      };

      if (editingId) {
        await updateInvestment.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Investment updated" });
      } else {
        await createInvestment.mutateAsync(payload);
        toast({ title: "Investment added" });
      }
      cancelForm();
    } catch {
      toast({ title: "Failed to save investment", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInvestment.mutateAsync(id);
      toast({ title: "Investment deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const isPending = createInvestment.isPending || updateInvestment.isPending;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="loading-spinner">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Investments</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1" data-testid="text-page-subtitle">Track and manage your investment portfolio.</p>
        </div>
        <Button onClick={() => { if (showForm && !editingId) { cancelForm(); } else { cancelForm(); setShowForm(true); } }} data-testid="button-add-investment">
          {showForm && !editingId ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Investment</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-portfolio">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Portfolio Value</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-portfolio">{formatAmount(totalPortfolioValue)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-total-gain-loss">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Gain/Loss</p>
                <h3 className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-total-gain-loss">
                  {totalGainLoss >= 0 ? "+" : ""}{formatAmount(totalGainLoss)}
                </h3>
              </div>
              <div className={`p-4 rounded-xl ${totalGainLoss >= 0 ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
                {totalGainLoss >= 0 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-active-count">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Active Investments</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-active-count">{activeInvestments.length}</h3>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-sold-count">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Sold Investments</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-sold-count">{soldInvestments.length}</h3>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <Landmark className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {typeBreakdown.map((type) => (
          <Card key={type.name} className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid={`card-type-${type.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`p-3 rounded-xl ${type.bgColor}`}>
                  <type.icon className="w-5 h-5" style={{ color: type.color }} />
                </div>
                <p className="text-xs font-medium text-[#666] dark:text-gray-400">{type.name}</p>
                <p className="text-sm font-bold text-[#1a1a1a] dark:text-white" data-testid={`text-type-total-${type.name.toLowerCase().replace(/\s+/g, "-")}`}>{formatAmount(type.total)}</p>
                <p className="text-xs text-[#999] dark:text-gray-500">{type.count} active</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6" data-testid="card-investment-form">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Investment" : "Add Investment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="form-investment">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Name</label>
                <Input data-testid="input-name" placeholder="e.g. Apple Stock" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Quantity</label>
                <Input data-testid="input-quantity" type="number" step="any" placeholder="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Purchase Price</label>
                <Input data-testid="input-purchase-price" type="number" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Unit Price at Purchase</label>
                <Input data-testid="input-unit-price" type="number" step="0.01" placeholder="0.00" value={formData.unitPriceAtPurchase} onChange={e => setFormData({ ...formData, unitPriceAtPurchase: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Current Value</label>
                <Input data-testid="input-current-value" type="number" step="0.01" placeholder="0.00" value={formData.currentValue} onChange={e => setFormData({ ...formData, currentValue: e.target.value })} />
              </div>
              <CurrencyFields
                currencyCode={formData.currencyCode}
                exchangeRate={formData.exchangeRateToUsd}
                amount={formData.currentValue}
                onCurrencyChange={(code) => setFormData({ ...formData, currencyCode: code })}
                onExchangeRateChange={(rate) => setFormData({ ...formData, exchangeRateToUsd: rate })}
                showUsdPreview={true}
              />
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Purchase Date</label>
                <Input data-testid="input-purchase-date" type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Platform</label>
                <Input data-testid="input-platform" placeholder="e.g. Robinhood" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status === "sold" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Sell Date</label>
                    <Input data-testid="input-sell-date" type="date" value={formData.sellDate} onChange={e => setFormData({ ...formData, sellDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Sell Price</label>
                    <Input data-testid="input-sell-price" type="number" step="0.01" placeholder="0.00" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: e.target.value })} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Notes</label>
                <Textarea data-testid="input-notes" placeholder="Optional notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="resize-none" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3 flex-wrap">
                <Button type="submit" disabled={isPending} data-testid="button-submit-investment">
                  {isPending ? "Saving..." : editingId ? "Update Investment" : "Save Investment"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelForm} data-testid="button-cancel-edit">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid="card-investments-table">
        <CardHeader>
          <CardTitle>All Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {!investments || (investments as any[]).length === 0 ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8" data-testid="text-no-investments">No investments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-investments">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Purchase Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Current Value (USD)</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Gain/Loss</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Currency</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Platform</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(investments as any[])
                    .sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                    .map((inv: any) => {
                      const currentValueUsd = toUsd(inv.currentValue, inv.exchangeRateToUsd);
                      const purchasePriceUsd = toUsd(inv.purchasePrice, inv.exchangeRateToUsd);
                      const gainLoss = currentValueUsd - purchasePriceUsd;
                      const typeInfo = INVESTMENT_TYPES.find(t => t.name === inv.type);
                      return (
                        <tr key={inv.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-investment-${inv.id}`}>
                          <td className="py-3 px-4 font-medium text-[#1a1a1a] dark:text-white" data-testid={`text-name-${inv.id}`}>{inv.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="text-xs" style={{ borderColor: typeInfo?.color, color: typeInfo?.color }} data-testid={`badge-type-${inv.id}`}>
                              {inv.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-[#1a1a1a] dark:text-white" data-testid={`text-quantity-${inv.id}`}>{inv.quantity || "-"}</td>
                          <td className="py-3 px-4 text-right text-[#1a1a1a] dark:text-white" data-testid={`text-purchase-price-${inv.id}`}>{formatAmount(purchasePriceUsd)}</td>
                          <td className="py-3 px-4 text-right font-bold text-[#1a1a1a] dark:text-white" data-testid={`text-current-value-${inv.id}`}>
                            <div>{formatAmount(currentValueUsd)}</div>
                            {inv.currencyCode !== "USD" && (
                              <div className="text-xs text-[#666] dark:text-gray-400">{formatAmount(Number(inv.currentValue))} {inv.currencyCode}</div>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`} data-testid={`text-gain-loss-${inv.id}`}>
                            {gainLoss >= 0 ? "+" : ""}{formatAmount(gainLoss)}
                          </td>
                          <td className="py-3 px-4 text-[#666] dark:text-gray-400" data-testid={`text-currency-${inv.id}`}>{inv.currencyCode || "USD"}</td>
                          <td className="py-3 px-4 text-[#666] dark:text-gray-400" data-testid={`text-platform-${inv.id}`}>{inv.platform || "-"}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={inv.status === "active" ? "default" : "secondary"} className="text-xs" data-testid={`badge-status-${inv.id}`}>
                              {inv.status === "active" ? "Active" : "Sold"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEdit(inv)} data-testid={`button-edit-${inv.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(inv.id)} data-testid={`button-delete-${inv.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

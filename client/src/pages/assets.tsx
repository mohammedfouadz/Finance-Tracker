import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { Plus, Trash2, Pencil, Building2, DollarSign, Hash, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ASSET_TYPES = ["Real Estate", "Vehicle", "Equipment", "Jewelry", "Other"];
const ASSET_STATUSES = ["Owned", "Rented", "Sold"];

const emptyForm = {
  name: "",
  type: "",
  location: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  purchasePrice: "",
  currentValue: "",
  monthlyIncome: "",
  status: "Owned",
  notes: "",
  currencyCode: "USD",
  exchangeRateToUsd: "1",
};

export default function AssetsPage() {
  const { user } = useAuth();
  const { data: assets, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const totalAssetsValue = useMemo(() => {
    if (!assets) return 0;
    return assets.reduce((sum: number, a: any) => sum + toUsd(a.currentValue, a.exchangeRateToUsd), 0);
  }, [assets]);

  const totalMonthlyIncome = useMemo(() => {
    if (!assets) return 0;
    return assets.reduce((sum: number, a: any) => sum + Number(a.monthlyIncome || 0), 0);
  }, [assets]);

  const assetCount = assets?.length || 0;

  const avgAppreciation = useMemo(() => {
    if (!assets || assets.length === 0) return 0;
    const totalGain = assets.reduce((sum: number, a: any) => {
      const currentValueUsd = toUsd(a.currentValue, a.exchangeRateToUsd);
      const purchasePriceUsd = toUsd(a.purchasePrice, a.exchangeRateToUsd);
      return sum + (currentValueUsd - purchasePriceUsd);
    }, 0);
    const totalPurchase = assets.reduce((sum: number, a: any) => sum + toUsd(a.purchasePrice, a.exchangeRateToUsd), 0);
    return totalPurchase > 0 ? (totalGain / totalPurchase) * 100 : 0;
  }, [assets]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.purchasePrice || !formData.currentValue) return;
    try {
      const payload = {
        userId: user!.id,
        name: formData.name,
        type: formData.type,
        location: formData.location || null,
        purchaseDate: new Date(formData.purchaseDate),
        purchasePrice: formData.purchasePrice,
        currentValue: formData.currentValue,
        monthlyIncome: formData.monthlyIncome || null,
        status: formData.status,
        notes: formData.notes || null,
        currencyCode: formData.currencyCode,
        exchangeRateToUsd: formData.exchangeRateToUsd,
      };

      if (editingId) {
        await updateAsset.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Asset updated" });
      } else {
        await createAsset.mutateAsync(payload as any);
        toast({ title: "Asset added" });
      }
      setFormData(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleEdit = (asset: any) => {
    setFormData({
      name: asset.name,
      type: asset.type,
      location: asset.location || "",
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      purchasePrice: String(asset.purchasePrice),
      currentValue: String(asset.currentValue),
      monthlyIncome: asset.monthlyIncome ? String(asset.monthlyIncome) : "",
      status: asset.status || "Owned",
      notes: asset.notes || "",
      currencyCode: asset.currencyCode || "USD",
      exchangeRateToUsd: String(asset.exchangeRateToUsd || 1),
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAsset.mutateAsync(id);
      toast({ title: "Asset deleted" });
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
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Assets & Properties</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Manage your assets, properties and valuables.</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }} data-testid="button-add-asset">
          <Plus className="w-4 h-4 mr-2" /> Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Assets Value</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-assets-value">{formatAmount(totalAssetsValue)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-blue-50">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Monthly Income</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-monthly-income">{formatAmount(totalMonthlyIncome)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Number of Assets</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-asset-count">{assetCount}</h3>
              </div>
              <div className="p-4 rounded-xl bg-purple-50">
                <Hash className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Average Appreciation</p>
                <h3 className={`text-2xl font-bold ${avgAppreciation >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-avg-appreciation">{avgAppreciation.toFixed(1)}%</h3>
              </div>
              <div className="p-4 rounded-xl bg-amber-50">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>{editingId ? "Edit Asset" : "Add New Asset"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Name</label>
                <Input data-testid="input-name" placeholder="e.g. Downtown Apartment" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger data-testid="select-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Location</label>
                <Input data-testid="input-location" placeholder="e.g. New York, NY" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Purchase Date</label>
                <Input data-testid="input-purchase-date" type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Purchase Price</label>
                <Input data-testid="input-purchase-price" type="number" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Current Value</label>
                <Input data-testid="input-current-value" type="number" step="0.01" placeholder="0.00" value={formData.currentValue} onChange={e => setFormData({...formData, currentValue: e.target.value})} />
              </div>
              <CurrencyFields
                currencyCode={formData.currencyCode}
                exchangeRate={formData.exchangeRateToUsd}
                amount={formData.currentValue}
                onCurrencyChange={(code) => setFormData({...formData, currencyCode: code})}
                onExchangeRateChange={(rate) => setFormData({...formData, exchangeRateToUsd: rate})}
                showUsdPreview={true}
              />
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Monthly Income (optional)</label>
                <Input data-testid="input-monthly-income" type="number" step="0.01" placeholder="0.00" value={formData.monthlyIncome} onChange={e => setFormData({...formData, monthlyIncome: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger data-testid="select-status"><SelectValue placeholder="Select status..." /></SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Notes</label>
                <Input data-testid="input-notes" placeholder="Optional notes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createAsset.isPending || updateAsset.isPending} data-testid="button-submit-asset">
                  {(createAsset.isPending || updateAsset.isPending) ? "Saving..." : editingId ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>All Assets</CardTitle></CardHeader>
        <CardContent>
          {(!assets || assets.length === 0) ? (
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No assets recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Location</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Currency</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Purchase Price (USD)</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Current Value (USD)</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Gain/Loss</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Monthly Income</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a: any) => {
                    const purchasePriceUsd = toUsd(a.purchasePrice, a.exchangeRateToUsd);
                    const currentValueUsd = toUsd(a.currentValue, a.exchangeRateToUsd);
                    const gainLoss = currentValueUsd - purchasePriceUsd;
                    return (
                      <tr key={a.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-asset-${a.id}`}>
                        <td className="py-3 px-4 font-medium dark:text-white">{a.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{a.type}</span>
                        </td>
                        <td className="py-3 px-4 text-[#666] dark:text-gray-400">{a.location || "—"}</td>
                        <td className="py-3 px-4 text-center dark:text-gray-300">{a.currencyCode || "USD"}</td>
                        <td className="py-3 px-4 text-right dark:text-gray-300">{formatAmount(purchasePriceUsd)}</td>
                        <td className="py-3 px-4 text-right font-bold dark:text-white">{formatAmount(currentValueUsd)}</td>
                        <td className={`py-3 px-4 text-right font-bold ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`} data-testid={`text-gain-loss-${a.id}`}>
                          {gainLoss >= 0 ? "+" : ""}{formatAmount(gainLoss)}
                        </td>
                        <td className="py-3 px-4 text-right dark:text-gray-300">{a.monthlyIncome ? formatAmount(Number(a.monthlyIncome)) : "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === "Owned" ? "bg-green-50 text-green-700" :
                            a.status === "Rented" ? "bg-amber-50 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{a.status}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(a)} data-testid={`button-edit-${a.id}`}>
                              <Pencil className="w-4 h-4 text-[#666] dark:text-gray-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(a.id)} data-testid={`button-delete-${a.id}`}>
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

import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import {
  Plus, Trash2, Pencil, Building2, DollarSign, Hash, TrendingUp, TrendingDown,
  MapPin, Sparkles, Car, Gem, Package, MoreHorizontal, ChevronRight, Home,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const DANGER = "#EF4444";
const PURPLE = "#8B5CF6";

const ASSET_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  "Real Estate": { icon: Home,          color: BRAND,  bg: "#EEF4FF", label: "Real Estate" },
  "Vehicle":     { icon: Car,           color: AMBER,  bg: "#FFFBEB", label: "Vehicles" },
  "Equipment":   { icon: Package,       color: "#6366F1", bg: "#EEF2FF", label: "Equipment" },
  "Jewelry":     { icon: Gem,           color: "#EC4899", bg: "#FDF2F8", label: "Jewelry" },
  "Other":       { icon: MoreHorizontal,color: "#64748B", bg: "#F1F5F9", label: "Other" },
};

const ASSET_TYPES    = Object.keys(ASSET_TYPE_CONFIG);
const ASSET_STATUSES = ["Owned", "Rented", "Sold"];

const GRADIENT_PLACEHOLDERS: Record<string, string> = {
  "Real Estate": "linear-gradient(135deg, #EEF4FF, #D1FAE5)",
  "Vehicle":     "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
  "Equipment":   "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
  "Jewelry":     "linear-gradient(135deg, #FDF2F8, #FCE7F3)",
  "Other":       "linear-gradient(135deg, #F1F5F9, #E2E8F0)",
};

const emptyForm = {
  name: "", type: "", location: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  purchasePrice: "", currentValue: "", monthlyIncome: "",
  status: "Owned", notes: "", currencyCode: "USD", exchangeRateToUsd: "1",
};

function KpiCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string; sub?: string; icon: any; color: string; bg: string;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all">
      <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}88, transparent)` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset, onEdit, onDelete, formatAmount }: {
  asset: any; onEdit: () => void; onDelete: () => void; formatAmount: (n: number) => string;
}) {
  const typeConf = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG["Other"];
  const Icon = typeConf.icon;
  const purchaseUsd = toUsd(Number(asset.purchasePrice), Number(asset.exchangeRateToUsd));
  const currentUsd  = toUsd(Number(asset.currentValue),  Number(asset.exchangeRateToUsd));
  const gainLoss    = currentUsd - purchaseUsd;
  const gainLossPct = purchaseUsd > 0 ? (gainLoss / purchaseUsd) * 100 : 0;
  const isPositive  = gainLoss >= 0;

  const owned = asset.purchaseDate ? (() => {
    const years = differenceInYears(new Date(), new Date(asset.purchaseDate));
    const months = differenceInMonths(new Date(), new Date(asset.purchaseDate)) % 12;
    return years > 0 ? `${years}y ${months}m owned` : `${months}m owned`;
  })() : "";

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all" data-testid={`card-asset-${asset.id}`}>
      {/* hero image / gradient placeholder */}
      <div className="relative h-36 flex items-end p-3" style={{ background: GRADIENT_PLACEHOLDERS[asset.type] || GRADIENT_PLACEHOLDERS["Other"] }}>
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 flex items-center gap-1">
            <Icon className="w-3 h-3" style={{ color: typeConf.color }} /> {asset.type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${asset.status === "Owned" ? "bg-emerald-500 text-white" : asset.status === "Rented" ? "bg-amber-500 text-white" : "bg-gray-400 text-white"}`}>
            {asset.status}
          </span>
        </div>
        {/* appreciation badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{gainLossPct.toFixed(1)}%
        </span>
        {/* center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${typeConf.color}22` }}>
            <Icon className="w-7 h-7" style={{ color: typeConf.color }} />
          </div>
        </div>
      </div>

      {/* body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base" data-testid={`text-asset-name-${asset.id}`}>{asset.name}</h3>
          {asset.location && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {asset.location}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-gray-400">Purchase Price</span>
            <p className="font-semibold text-gray-500 tabular-nums">{formatAmount(purchaseUsd)}</p>
          </div>
          <div>
            <span className="text-gray-400">Current Value</span>
            <p className="font-bold tabular-nums" style={{ color: BRAND }}>{formatAmount(currentUsd)}</p>
          </div>
        </div>

        <div className={`flex items-center justify-between text-xs rounded-xl px-3 py-2 ${isPositive ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
          <span style={{ color: isPositive ? MINT : DANGER }} className="font-bold tabular-nums">
            {isPositive ? "+" : ""}{formatAmount(gainLoss)} ({isPositive ? "+" : ""}{gainLossPct.toFixed(1)}%)
          </span>
          {owned && <span className="text-gray-400">{owned}</span>}
        </div>

        {asset.monthlyIncome && Number(asset.monthlyIncome) > 0 && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            💰 <strong className="text-emerald-600">{formatAmount(Number(asset.monthlyIncome))}/mo</strong> rental income
          </p>
        )}

        {asset.purchaseDate && (
          <p className="text-xs text-gray-400">Purchased {format(new Date(asset.purchaseDate), "MMM yyyy")}</p>
        )}

        {/* footer actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-50 dark:border-gray-800">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8 rounded-xl" onClick={onEdit} data-testid={`button-edit-${asset.id}`}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <button onClick={onDelete} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors" data-testid={`button-delete-${asset.id}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { user }   = useAuth();
  const { data: assets, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { toast }  = useToast();
  const { formatAmount } = useCurrency();

  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const allAssets = (assets as any[] | undefined) || [];

  /* totals */
  const totalValue       = useMemo(() => allAssets.reduce((s, a) => s + toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd)), 0), [allAssets]);
  const totalMonthlyIncome = useMemo(() => allAssets.reduce((s, a) => s + Number(a.monthlyIncome || 0), 0), [allAssets]);
  const avgAppreciation  = useMemo(() => {
    if (!allAssets.length) return 0;
    const totalGain = allAssets.reduce((s, a) => {
      const cur = toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd));
      const pur = toUsd(Number(a.purchasePrice), Number(a.exchangeRateToUsd));
      return s + (cur - pur);
    }, 0);
    const totalPur = allAssets.reduce((s, a) => s + toUsd(Number(a.purchasePrice), Number(a.exchangeRateToUsd)), 0);
    return totalPur > 0 ? (totalGain / totalPur) * 100 : 0;
  }, [allAssets]);

  /* type breakdown */
  const typeBreakdown = useMemo(() =>
    ASSET_TYPES.map(t => {
      const matching = allAssets.filter(a => a.type === t);
      const total = matching.reduce((s, a) => s + toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd)), 0);
      return { type: t, ...ASSET_TYPE_CONFIG[t], total, count: matching.length };
    }),
    [allAssets]
  );

  /* appreciation chart data */
  const chartData = useMemo(() => {
    const months = ["Nov","Dec","Jan","Feb","Mar","Apr"];
    return months.map((m, i) => {
      const point: Record<string, any> = { month: m };
      allAssets.forEach(a => {
        const cur = toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd));
        const pur = toUsd(Number(a.purchasePrice), Number(a.exchangeRateToUsd));
        const val = i === 5 ? cur : pur + (cur - pur) * (i / 4);
        point[a.name] = Math.round(val);
      });
      return point;
    });
  }, [allAssets]);

  const assetColors = [BRAND, MINT, AMBER, DANGER, PURPLE, "#EC4899"];

  /* filtered */
  const filteredAssets = typeFilter === "All" ? allAssets : allAssets.filter(a => a.type === typeFilter);

  /* handlers */
  const handleEdit = (a: any) => {
    setFormData({
      name: a.name, type: a.type, location: a.location || "",
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      purchasePrice: String(a.purchasePrice), currentValue: String(a.currentValue),
      monthlyIncome: a.monthlyIncome ? String(a.monthlyIncome) : "",
      status: a.status || "Owned", notes: a.notes || "",
      currencyCode: a.currencyCode || "USD", exchangeRateToUsd: String(a.exchangeRateToUsd || 1),
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this asset?")) return;
    try { await deleteAsset.mutateAsync(id); toast({ title: "Asset deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.purchasePrice || !formData.currentValue) return;
    try {
      const payload = {
        userId: user!.id, name: formData.name, type: formData.type,
        location: formData.location || null, purchaseDate: new Date(formData.purchaseDate),
        purchasePrice: formData.purchasePrice, currentValue: formData.currentValue,
        monthlyIncome: formData.monthlyIncome || null, status: formData.status,
        notes: formData.notes || null, currencyCode: formData.currencyCode,
        exchangeRateToUsd: formData.exchangeRateToUsd,
      };
      if (editingId) { await updateAsset.mutateAsync({ id: editingId, ...payload }); toast({ title: "Asset updated" }); }
      else           { await createAsset.mutateAsync(payload as any); toast({ title: "Asset added" }); }
      setFormData(emptyForm); setShowForm(false); setEditingId(null);
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Assets & Properties</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track properties, vehicles, valuables, and collectibles.</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }} className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }} data-testid="button-add-asset">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Assets Value" value={formatAmount(totalValue)} sub={`${allAssets.length} asset${allAssets.length !== 1 ? "s" : ""}`} icon={Building2} color={BRAND} bg="#EEF4FF" />
          <KpiCard label="Monthly Income" value={formatAmount(totalMonthlyIncome)} sub="Rental / lease income" icon={DollarSign} color={MINT} bg="#ECFDF5" />
          <KpiCard label="Number of Assets" value={String(allAssets.length)} sub={`${typeBreakdown.filter(t => t.count > 0).map(t => `${t.count} ${t.label.toLowerCase()}`).join(" · ") || "No assets yet"}`} icon={Hash} color={PURPLE} bg="#F5F3FF" />
          <KpiCard label="Avg Appreciation" value={`${avgAppreciation >= 0 ? "+" : ""}${avgAppreciation.toFixed(1)}%`} sub={avgAppreciation >= 0 ? "Assets appreciating" : "Assets depreciating"} icon={avgAppreciation >= 0 ? TrendingUp : TrendingDown} color={avgAppreciation >= 0 ? MINT : DANGER} bg={avgAppreciation >= 0 ? "#ECFDF5" : "#FEF2F2"} />
        </div>

        {/* type category strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button onClick={() => setTypeFilter("All")}
            className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${typeFilter === "All" ? "ring-2 ring-blue-400 border-blue-200 bg-blue-50" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100"><Building2 className="w-4 h-4 text-gray-600" /></div>
            <p className="text-[10px] font-semibold text-gray-500">All Types</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatAmount(totalValue)}</p>
            <p className="text-[10px] text-gray-400">{allAssets.length} assets</p>
          </button>
          {typeBreakdown.map(t => (
            <button key={t.type} onClick={() => setTypeFilter(typeFilter === t.type ? "All" : t.type)}
              className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${typeFilter === t.type ? "ring-2 border-transparent" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}
              style={typeFilter === t.type ? { ringColor: t.color, backgroundColor: `${t.color}11`, borderColor: `${t.color}44` } : {}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                <t.icon className="w-4 h-4" style={{ color: t.color }} />
              </div>
              <p className="text-[10px] font-semibold text-gray-500">{t.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatAmount(t.total)}</p>
              <p className="text-[10px] text-gray-400">{t.count} asset{t.count !== 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>

        {/* assets grid */}
        {filteredAssets.length === 0 ? (
          <Card className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <CardContent className="p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
                <Building2 className="w-7 h-7" style={{ color: BRAND }} />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-xl">No assets yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first property, vehicle, or valuable to start tracking appreciation.</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }}>
                <Plus className="w-4 h-4" /> Add First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                {typeFilter === "All" ? "All Assets" : typeFilter}
                <span className="ml-2 text-xs font-normal text-gray-400">({filteredAssets.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((a: any) => (
                <AssetCard key={a.id} asset={a} onEdit={() => handleEdit(a)} onDelete={() => handleDelete(a.id)} formatAmount={formatAmount} />
              ))}
              {/* ghost add card */}
              <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
                className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 py-16 text-gray-400 hover:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100"><Plus className="w-5 h-5" /></div>
                <span className="text-sm font-medium">Add Another Asset</span>
              </button>
            </div>
          </div>
        )}

        {/* appreciation chart */}
        {allAssets.length > 0 && (
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Asset Value Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip formatter={(v: any, name: string) => [formatAmount(v), name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  {allAssets.map((a: any, i: number) => (
                    <Line key={a.id} type="monotone" dataKey={a.name} stroke={assetColors[i % assetColors.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* valuations summary table */}
        {allAssets.length > 0 && (
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Valuation Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Asset","Type","Location","Purchase","Current Value","Gain/Loss","Monthly Income","Status"].map(h => (
                        <th key={h} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${["Purchase","Current Value","Gain/Loss","Monthly Income"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allAssets.map((a: any) => {
                      const purUsd = toUsd(Number(a.purchasePrice), Number(a.exchangeRateToUsd));
                      const curUsd = toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd));
                      const gl = curUsd - purUsd;
                      const typeConf = ASSET_TYPE_CONFIG[a.type] || ASSET_TYPE_CONFIG["Other"];
                      return (
                        <tr key={a.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors" data-testid={`row-asset-${a.id}`}>
                          <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{a.name}</td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${typeConf.color}22`, color: typeConf.color }}>{a.type}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500">{a.location || "—"}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-500">{formatAmount(purUsd)}</td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums text-gray-900 dark:text-white">{formatAmount(curUsd)}</td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums" style={{ color: gl >= 0 ? MINT : DANGER }} data-testid={`text-gain-loss-${a.id}`}>
                            {gl >= 0 ? "+" : ""}{formatAmount(gl)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-500">
                            {a.monthlyIncome ? formatAmount(Number(a.monthlyIncome)) : "—"}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${a.status === "Owned" ? "bg-emerald-50 text-emerald-700" : a.status === "Rented" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* smart insights */}
        <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5" style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF4FF)" }}>
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4" style={{ color: PURPLE }} /><h3 className="font-semibold text-gray-900 text-base">Smart Insights</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">🏠 Portfolio overview</p>
                <p className="text-gray-500">
                  {allAssets.length === 0
                    ? "No assets tracked yet. Add your properties, vehicles, and valuables."
                    : `${allAssets.length} asset${allAssets.length > 1 ? "s" : ""} worth ${formatAmount(totalValue)} total. ${avgAppreciation >= 0 ? `Averaging +${avgAppreciation.toFixed(1)}% appreciation.` : `Average depreciation of ${Math.abs(avgAppreciation).toFixed(1)}%.`}`}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">💡 Income opportunity</p>
                <p className="text-gray-500">
                  {totalMonthlyIncome > 0
                    ? `Generating ${formatAmount(totalMonthlyIncome)}/month in asset income — that's ${formatAmount(totalMonthlyIncome * 12)}/year.`
                    : "None of your assets generate income. Rental or leasing could yield passive income."}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">📋 Valuation tip</p>
                <p className="text-gray-500">
                  {allAssets.length > 0
                    ? "Update your asset valuations regularly for accurate net worth tracking. Real estate values change year over year."
                    : "Add assets to start tracking your total wealth accurately."}
                </p>
                {allAssets.length > 0 && (
                  <button className="mt-2 font-semibold text-blue-600 flex items-center gap-0.5">
                    Update valuations <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setEditingId(null); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Asset Name</label>
                <Input placeholder="e.g. Downtown Apartment, Toyota Camry" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} data-testid="input-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Location (optional)</label>
                <Input placeholder="e.g. Dubai, UAE" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} data-testid="input-location" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Purchase Price</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} data-testid="input-purchase-price" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Current Value</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.currentValue} onChange={e => setFormData({ ...formData, currentValue: e.target.value })} data-testid="input-current-value" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Purchase Date</label>
                <Input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} data-testid="input-purchase-date" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Monthly Income (optional)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })} data-testid="input-monthly-income" />
              </div>
            </div>
            <CurrencyFields currencyCode={formData.currencyCode} exchangeRate={formData.exchangeRateToUsd} amount={formData.currentValue}
              onCurrencyChange={code => setFormData(p => ({ ...p, currencyCode: code }))}
              onExchangeRateChange={rate => setFormData(p => ({ ...p, exchangeRateToUsd: rate }))} showUsdPreview={true} />
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
              <Input placeholder="Optional notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} data-testid="input-notes" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }} data-testid="button-cancel">Cancel</Button>
              <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={createAsset.isPending || updateAsset.isPending} data-testid="button-submit-asset">
                {(createAsset.isPending || updateAsset.isPending) ? "Saving…" : editingId ? "Update Asset" : "Add Asset"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

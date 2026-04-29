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
import { useI18n } from "@/lib/i18n";
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

function useAssetTypeConfig() {
  const { t } = useI18n();
  const ASSET_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    "Real Estate": { icon: Home,          color: BRAND,  bg: "#EEF4FF", label: t("assets.realEstate") },
    "Vehicle":     { icon: Car,           color: AMBER,  bg: "#FFFBEB", label: t("assets.vehicle") },
    "Equipment":   { icon: Package,       color: "#6366F1", bg: "#EEF2FF", label: t("common.type") },
    "Jewelry":     { icon: Gem,           color: "#EC4899", bg: "#FDF2F8", label: t("assets.jewelry") },
    "Other":       { icon: MoreHorizontal,color: "#64748B", bg: "#F1F5F9", label: t("assets.other") },
  };
  return ASSET_TYPE_CONFIG;
}

const ASSET_TYPES_LITERAL    = ["Real Estate", "Vehicle", "Equipment", "Jewelry", "Other"];
const ASSET_STATUSES_LITERAL = ["Owned", "Rented", "Sold"];

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

function AssetCard({ asset, onEdit, onDelete, formatAmount, ASSET_TYPE_CONFIG }: {
  asset: any; onEdit: () => void; onDelete: () => void; formatAmount: (n: number) => string; ASSET_TYPE_CONFIG: any;
}) {
  const { t, lang } = useI18n();
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
    const yStr = lang === "ar" ? "سنة" : "y";
    const mStr = lang === "ar" ? "شهر" : "m";
    const oStr = lang === "ar" ? "تملك" : "owned";
    return years > 0 ? `${years}${yStr} ${months}${mStr} ${oStr}` : `${months}${mStr} ${oStr}`;
  })() : "";

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all" data-testid={`card-asset-${asset.id}`}>
      {/* hero image / gradient placeholder */}
      <div className="relative h-36 flex items-end p-3" style={{ background: GRADIENT_PLACEHOLDERS[asset.type] || GRADIENT_PLACEHOLDERS["Other"] }}>
        <div className={`absolute top-3 ${lang === "ar" ? "right-3" : "left-3"}`}>
          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Icon className="w-3 h-3" style={{ color: typeConf.color }} /> {typeConf.label}
          </span>
        </div>
        <div className={`absolute top-3 ${lang === "ar" ? "left-3" : "right-3"}`}>
          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${asset.status === "Owned" ? "bg-emerald-500 text-white" : asset.status === "Rented" ? "bg-amber-500 text-white" : "bg-gray-400 text-white"}`}>
            {asset.status === "Owned" ? t("common.active") : asset.status === "Rented" ? "Rented" : "Sold"}
          </span>
        </div>
        {/* appreciation badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span dir="ltr">{isPositive ? "+" : ""}{gainLossPct.toFixed(1)}%</span>
        </span>
        {/* center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${typeConf.color}22` }}>
            <Icon className="w-7 h-7" style={{ color: typeConf.color }} />
          </div>
        </div>
      </div>

      {/* body */}
      <div className="p-4 space-y-3 text-start">
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
            <span className="text-gray-400">{t("assets.purchasePrice")}</span>
            <p className="font-semibold text-gray-500 tabular-nums" dir="ltr">{formatAmount(purchaseUsd)}</p>
          </div>
          <div>
            <span className="text-gray-400">{t("assets.currentValue")}</span>
            <p className="font-bold tabular-nums" style={{ color: BRAND }} dir="ltr">{formatAmount(currentUsd)}</p>
          </div>
        </div>

        <div className={`flex items-center justify-between text-xs rounded-xl px-3 py-2 ${isPositive ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
          <span style={{ color: isPositive ? MINT : DANGER }} className="font-bold tabular-nums" dir="ltr">
            {isPositive ? "+" : ""}{formatAmount(gainLoss)} ({isPositive ? "+" : ""}{gainLossPct.toFixed(1)}%)
          </span>
          {owned && <span className="text-gray-400">{owned}</span>}
        </div>

        {asset.monthlyIncome && Number(asset.monthlyIncome) > 0 && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            💰 <strong className="text-emerald-600"><span dir="ltr">{formatAmount(Number(asset.monthlyIncome))}</span>/mo</strong> rental income
          </p>
        )}

        {asset.purchaseDate && (
          <p className="text-xs text-gray-400">{t("assets.purchaseDate")} {format(new Date(asset.purchaseDate), "MMM yyyy")}</p>
        )}

        {/* footer actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-50 dark:border-gray-800">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8 rounded-xl" onClick={onEdit} data-testid={`button-edit-${asset.id}`}>
            <Pencil className="w-3 h-3 me-1" /> {t("common.edit")}
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
  const { t, lang }   = useI18n();
  const { user }   = useAuth();
  const { data: assets, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { toast }  = useToast();
  const { formatAmount } = useCurrency();
  const ASSET_TYPE_CONFIG = useAssetTypeConfig();
  const ASSET_TYPES = useMemo(() => Object.keys(ASSET_TYPE_CONFIG), [ASSET_TYPE_CONFIG]);

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
    if (!confirm(t("common.confirmDelete"))) return;
    try { await deleteAsset.mutateAsync(id); toast({ title: t("common.deleteSuccess") }); }
    catch { toast({ title: t("common.errorGeneric"), variant: "destructive" }); }
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
      if (editingId) { await updateAsset.mutateAsync({ id: editingId, ...payload }); toast({ title: t("common.saveSuccess") }); }
      else           { await createAsset.mutateAsync(payload as any); toast({ title: t("common.saveSuccess") }); }
      setFormData(emptyForm); setShowForm(false); setEditingId(null);
    } catch { toast({ title: t("common.errorGeneric"), variant: "destructive" }); }
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">{t("assets.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("assets.subtitle")}</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }} className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }} data-testid="button-add-asset">
            <Plus className="w-4 h-4" /> {t("assets.addAsset")}
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t("assets.totalValue")} value={formatAmount(totalValue)} sub={`${allAccounts.length} asset${allAccounts.length !== 1 ? "s" : ""}`} icon={Building2} color={BRAND} bg="#EEF4FF" />
          <KpiCard label="Monthly Income" value={formatAmount(totalMonthlyIncome)} sub="Rental / lease income" icon={DollarSign} color={MINT} bg="#ECFDF5" />
          <KpiCard label="Number of Assets" value={String(allAssets.length)} sub={`${typeBreakdown.filter(t_info => t_info.count > 0).map(t_info => `${t_info.count} ${t_info.label.toLowerCase()}`).join(" · ") || t("assets.noAssets")}`} icon={Hash} color={PURPLE} bg="#F5F3FF" />
          <KpiCard label={t("assets.appreciation")} value={`${avgAppreciation >= 0 ? "+" : ""}${avgAppreciation.toFixed(1)}%`} sub={avgAppreciation >= 0 ? "Assets appreciating" : "Assets depreciating"} icon={avgAppreciation >= 0 ? TrendingUp : TrendingDown} color={avgAppreciation >= 0 ? MINT : DANGER} bg={avgAppreciation >= 0 ? "#ECFDF5" : "#FEF2F2"} />
        </div>

        {/* type category strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button onClick={() => setTypeFilter("All")}
            className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${typeFilter === "All" ? "ring-2 ring-blue-400 border-blue-200 bg-blue-50" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100"><Building2 className="w-4 h-4 text-gray-600" /></div>
            <p className="text-[10px] font-semibold text-gray-500">{t("common.all")}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums" dir="ltr">{formatAmount(totalValue)}</p>
            <p className="text-[10px] text-gray-400">{allAssets.length} assets</p>
          </button>
          {typeBreakdown.map(t_cat => (
            <button key={t_cat.type} onClick={() => setTypeFilter(typeFilter === t_cat.type ? "All" : t_cat.type)}
              className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${typeFilter === t_cat.type ? "ring-2 border-transparent" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}
              style={typeFilter === t_cat.type ? { ringColor: t_cat.color, backgroundColor: `${t_cat.color}11`, borderColor: `${t_cat.color}44` } : {}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t_cat.bg }}>
                <t_cat.icon className="w-4 h-4" style={{ color: t_cat.color }} />
              </div>
              <p className="text-[10px] font-semibold text-gray-500">{t_cat.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums" dir="ltr">{formatAmount(t_cat.total)}</p>
              <p className="text-[10px] text-gray-400">{t_cat.count} asset{t_cat.count !== 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>

        {/* assets grid */}
        {filteredAssets.length === 0 ? (
          <Card className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <CardContent className="p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/30">
                <Building2 className="w-7 h-7" style={{ color: BRAND }} />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-xl">{t("assets.noAssets")}</p>
                <p className="text-sm text-gray-400 mt-1">Add your first property, vehicle, or valuable to start tracking appreciation.</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }}>
                <Plus className="w-4 h-4" /> {t("assets.addAsset")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white text-base text-start">
                {typeFilter === "All" ? t("common.all") : ASSET_TYPE_CONFIG[typeFilter]?.label || typeFilter}
                <span className="ms-2 text-xs font-normal text-gray-400">({filteredAssets.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((a: any) => (
                <AssetCard key={a.id} asset={a} onEdit={() => handleEdit(a)} onDelete={() => handleDelete(a.id)} formatAmount={formatAmount} ASSET_TYPE_CONFIG={ASSET_TYPE_CONFIG} />
              ))}
              {/* ghost add card */}
              <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
                className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 py-16 text-gray-400 hover:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100"><Plus className="w-5 h-5" /></div>
                <span className="text-sm font-medium">{t("assets.addAsset")}</span>
              </button>
            </div>
          </div>
        )}

        {/* valuations summary table */}
        {allAssets.length > 0 && (
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5 text-start">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">{t("aiReports.summary")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {[t("common.name"),t("common.type"),t("assets.location"),t("assets.purchasePrice"),t("assets.currentValue"),"Gain/Loss","Income",t("common.status")].map(h => (
                        <th key={h} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${[t("assets.purchasePrice"),t("assets.currentValue"),"Gain/Loss","Income"].includes(h) ? "text-end" : "text-start"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allAssets.map((a_entry: any) => {
                      const purUsd = toUsd(Number(a_entry.purchasePrice), Number(a_entry.exchangeRateToUsd));
                      const curUsd = toUsd(Number(a_entry.currentValue), Number(a_entry.exchangeRateToUsd));
                      const gl = curUsd - purUsd;
                      const typeConf = ASSET_TYPE_CONFIG[a_entry.type] || ASSET_TYPE_CONFIG["Other"];
                      return (
                        <tr key={a_entry.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors" data-testid={`row-asset-${a_entry.id}`}>
                          <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{a_entry.name}</td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${typeConf.color}22`, color: typeConf.color }}>{typeConf.label}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500">{a_entry.location || "—"}</td>
                          <td className="py-3 px-3 text-end tabular-nums text-gray-500" dir="ltr">{formatAmount(purUsd)}</td>
                          <td className="py-3 px-3 text-end font-bold tabular-nums text-gray-900 dark:text-white" dir="ltr">{formatAmount(curUsd)}</td>
                          <td className="py-3 px-3 text-end font-bold tabular-nums" style={{ color: gl >= 0 ? MINT : DANGER }} data-testid={`text-gain-loss-${a_entry.id}`} dir="ltr">
                            {gl >= 0 ? "+" : ""}{formatAmount(gl)}
                          </td>
                          <td className="py-3 px-3 text-end tabular-nums text-gray-500" dir="ltr">
                            {a_entry.monthlyIncome ? formatAmount(Number(a_entry.monthlyIncome)) : "—"}
                          </td>
                          <td className="py-3 px-3 text-start">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${a_entry.status === "Owned" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : a_entry.status === "Rented" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 text-gray-500"}`}>
                              {a_entry.status === "Owned" ? t("common.active") : a_entry.status === "Rented" ? "Rented" : "Sold"}
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

        {/* Smart Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900">
            <CardContent className="p-5 text-start">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">{t("aiReports.insights")}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {allAssets.length > 0 
                  ? `Your assets have appreciated by an average of ${avgAppreciation.toFixed(1)}%. Real estate makes up ${((typeBreakdown.find(t_info => t_info.type === "Real Estate")?.total || 0) / totalValue * 100).toFixed(0)}% of your asset portfolio.` 
                  : "Start adding assets to get AI-powered insights on your property and valuables."}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-900">
            <CardContent className="p-5 text-start">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Cash Flow</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {totalMonthlyIncome > 0 
                  ? `Your assets are generating ${formatAmount(totalMonthlyIncome)} in monthly passive income. This covers ${((totalMonthlyIncome / 5000) * 100).toFixed(0)}% of an estimated monthly budget.` 
                  : "None of your current assets are marked as generating rental income."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* add/edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="text-start">{editingId ? t("assets.editAsset") : t("assets.addAsset")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-start">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.assetName")}</label>
                <Input placeholder="e.g. Downtown Apartment, Tesla Model 3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.assetType")}</label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES_LITERAL.map(t_lit => <SelectItem key={t_lit} value={t_lit}>{ASSET_TYPE_CONFIG[t_lit]?.label || t_lit}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.status")}</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Owned">{t("common.active")}</SelectItem><SelectItem value="Rented">Rented</SelectItem><SelectItem value="Sold">Sold</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.purchasePrice")}</label>
                <Input type="number" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.currentValue")}</label>
                <Input type="number" value={formData.currentValue} onChange={e => setFormData({ ...formData, currentValue: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.purchaseDate")}</label>
                <Input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Monthly Rental Income</label>
                <Input type="number" placeholder="0.00" value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t("assets.location")} ({t("common.optional")})</label>
                <Input placeholder="e.g. Dubai Marina, London" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
            </div>
            <CurrencyFields currencyCode={formData.currencyCode} exchangeRate={formData.exchangeRateToUsd} amount={formData.currentValue}
              onCurrencyChange={code => setFormData({ ...formData, currencyCode: code })}
              onExchangeRateChange={rate => setFormData({ ...formData, exchangeRateToUsd: rate })} showUsdPreview />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              <Button type="submit" className="px-8" style={{ backgroundColor: BRAND }}>{t("common.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

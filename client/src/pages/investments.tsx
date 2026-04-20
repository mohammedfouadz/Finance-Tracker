import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Gem, BarChart3,
  Bitcoin, Building2, Landmark, MoreHorizontal, Sparkles, ChevronRight,
  Trophy, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const DANGER = "#EF4444";
const PURPLE = "#8B5CF6";

const INVESTMENT_TYPES = [
  { name: "Gold",        icon: Gem,          color: AMBER,  bg: "#FFFBEB" },
  { name: "Stocks",      icon: BarChart3,    color: BRAND,  bg: "#EEF4FF" },
  { name: "Crypto",      icon: Bitcoin,      color: PURPLE, bg: "#F5F3FF" },
  { name: "Real Estate", icon: Building2,    color: MINT,   bg: "#ECFDF5" },
  { name: "Bonds",       icon: Landmark,     color: DANGER, bg: "#FEF2F2" },
  { name: "Other",       icon: MoreHorizontal,color:"#64748B",bg:"#F1F5F9"},
];

const emptyForm = {
  name: "", type: "", quantity: "", purchasePrice: "", unitPriceAtPurchase: "",
  currentValue: "", currencyCode: "USD", exchangeRateToUsd: "1",
  purchaseDate: new Date().toISOString().split("T")[0],
  platform: "", status: "active", sellDate: "", sellPrice: "", notes: "",
};

function KpiCard({ label, value, sub, icon: Icon, color, bg, trend }: {
  label: string; value: string; sub?: string; icon: any; color: string; bg: string; trend?: { label: string; up: boolean };
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
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InvestmentsPage() {
  const { user }     = useAuth();
  const { data: investments, isLoading } = useInvestments();
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const deleteInvestment = useDeleteInvestment();
  const { toast }    = useToast();
  const { formatAmount } = useCurrency();

  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"sold">("all");

  const allInv     = (investments as any[] | undefined) || [];
  const activeInv  = useMemo(() => allInv.filter(i => i.status === "active"), [allInv]);
  const soldInv    = useMemo(() => allInv.filter(i => i.status === "sold"), [allInv]);

  const totalValue   = useMemo(() => activeInv.reduce((s, i) => s + toUsd(Number(i.currentValue), Number(i.exchangeRateToUsd)), 0), [activeInv]);
  const totalCost    = useMemo(() => activeInv.reduce((s, i) => s + toUsd(Number(i.purchasePrice), Number(i.exchangeRateToUsd)), 0), [activeInv]);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPct   = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  /* best/worst performer */
  const performers = useMemo(() => {
    return activeInv.map(i => {
      const cur = toUsd(Number(i.currentValue), Number(i.exchangeRateToUsd));
      const pur = toUsd(Number(i.purchasePrice), Number(i.exchangeRateToUsd));
      const pct = pur > 0 ? ((cur - pur) / pur) * 100 : 0;
      return { ...i, gainPct: pct };
    }).sort((a, b) => b.gainPct - a.gainPct);
  }, [activeInv]);
  const best  = performers[0];
  const worst = performers[performers.length - 1];

  /* type breakdown */
  const typeBreakdown = useMemo(() =>
    INVESTMENT_TYPES.map(t => {
      const matching = activeInv.filter(i => i.type === t.name);
      const total = matching.reduce((s, i) => s + toUsd(Number(i.currentValue), Number(i.exchangeRateToUsd)), 0);
      return { ...t, total, count: matching.length };
    }),
    [activeInv]
  );

  /* allocation donut */
  const donutData = typeBreakdown.filter(t => t.total > 0).map(t => ({ name: t.name, value: parseFloat(t.total.toFixed(2)), color: t.color }));

  /* simulated performance chart */
  const perfChartData = useMemo(() => {
    const months = ["Nov","Dec","Jan","Feb","Mar","Apr"];
    return months.map((m, i) => ({
      month: m,
      value:  Math.round(i === 5 ? totalValue : totalValue * (0.6 + (i/5)*0.4)),
      cost:   Math.round(totalCost),
    }));
  }, [totalValue, totalCost]);

  /* diversification score */
  const divScore = useMemo(() => {
    if (donutData.length === 0) return 0;
    const allocations = donutData.map(d => d.value / Math.max(totalValue, 1));
    const hhi = allocations.reduce((s, a) => s + a * a, 0);
    return Math.round(Math.max(0, Math.min(100, (1 - hhi) * 100)));
  }, [donutData, totalValue]);

  /* filtered holdings */
  const filteredInv = useMemo(() => {
    let list = allInv;
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (typeFilter !== "All")   list = list.filter(i => i.type === typeFilter);
    return list;
  }, [allInv, statusFilter, typeFilter]);

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setFormData({
      name: inv.name || "", type: inv.type || "", quantity: inv.quantity || "",
      purchasePrice: inv.purchasePrice || "", unitPriceAtPurchase: inv.unitPriceAtPurchase || "",
      currentValue: inv.currentValue || "", currencyCode: inv.currencyCode || "USD",
      exchangeRateToUsd: String(inv.exchangeRateToUsd || "1"),
      purchaseDate: inv.purchaseDate ? new Date(inv.purchaseDate).toISOString().split("T")[0] : "",
      platform: inv.platform || "", status: inv.status || "active",
      sellDate: inv.sellDate ? new Date(inv.sellDate).toISOString().split("T")[0] : "",
      sellPrice: inv.sellPrice || "", notes: inv.notes || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.purchasePrice || !formData.currentValue || !formData.purchaseDate) return;
    try {
      const payload: any = {
        userId: user!.id, name: formData.name, type: formData.type,
        quantity: formData.quantity || null,
        purchasePrice: formData.purchasePrice, unitPriceAtPurchase: formData.unitPriceAtPurchase || null,
        currentValue: formData.currentValue, currencyCode: formData.currencyCode,
        exchangeRateToUsd: formData.exchangeRateToUsd, purchaseDate: new Date(formData.purchaseDate),
        platform: formData.platform || null, status: formData.status,
        sellDate: formData.status === "sold" && formData.sellDate ? new Date(formData.sellDate) : null,
        sellPrice: formData.status === "sold" && formData.sellPrice ? formData.sellPrice : null,
        notes: formData.notes || null,
      };
      if (editingId) { await updateInvestment.mutateAsync({ id: editingId, ...payload }); toast({ title: "Investment updated" }); }
      else           { await createInvestment.mutateAsync(payload); toast({ title: "Investment added" }); }
      cancelForm();
    } catch { toast({ title: "Failed to save investment", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    try { await deleteInvestment.mutateAsync(id); toast({ title: "Investment deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const isPending = createInvestment.isPending || updateInvestment.isPending;

  if (isLoading) return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Investments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track portfolio performance and diversification.</p>
          </div>
          <Button onClick={() => { cancelForm(); setShowForm(true); }} className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }} data-testid="button-add-investment">
            <Plus className="w-4 h-4" /> Add Investment
          </Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Portfolio Value" value={formatAmount(totalValue)} sub={`vs ${formatAmount(totalCost)} invested`}
            icon={TrendingUp} color={BRAND} bg="#EEF4FF"
            trend={totalCost > 0 ? { label: `${gainLossPct >= 0 ? "+" : ""}${gainLossPct.toFixed(1)}% all-time`, up: gainLossPct >= 0 } : undefined} />
          <KpiCard label="Total Gain/Loss" value={`${totalGainLoss >= 0 ? "+" : ""}${formatAmount(Math.abs(totalGainLoss))}`}
            sub={`${gainLossPct >= 0 ? "+" : ""}${gainLossPct.toFixed(1)}% return`}
            icon={totalGainLoss >= 0 ? TrendingUp : TrendingDown} color={totalGainLoss >= 0 ? MINT : DANGER} bg={totalGainLoss >= 0 ? "#ECFDF5" : "#FEF2F2"} />
          <KpiCard label="Active Positions" value={String(activeInv.length)} sub={`across ${typeBreakdown.filter(t => t.count > 0).length} asset types`}
            icon={BarChart3} color="#10B981" bg="#ECFDF5" />
          <KpiCard label="Best Performer" value={best ? `+${best.gainPct.toFixed(1)}%` : "—"}
            sub={best ? `${best.name} · Worst: ${worst?.gainPct.toFixed(1)}%` : "Add investments to see performance"}
            icon={Trophy} color={AMBER} bg="#FFFBEB" />
        </div>

        {/* performance chart + allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* performance area chart */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">Portfolio Performance</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalGainLoss >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {totalGainLoss >= 0 ? "+" : ""}{gainLossPct.toFixed(1)}%
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={perfChartData}>
                  <defs>
                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={totalGainLoss >= 0 ? BRAND : DANGER} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={totalGainLoss >= 0 ? BRAND : DANGER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip formatter={(v: any, n: string) => [formatAmount(v), n === "value" ? "Portfolio" : "Cost Basis"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="cost" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="4 3" fill="transparent" name="cost" dot={false} />
                  <Area type="monotone" dataKey="value" stroke={totalGainLoss >= 0 ? BRAND : DANGER} strokeWidth={2.5} fill="url(#vGrad)" name="value" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {allInv.length === 0 && <p className="text-xs text-gray-400 text-center mt-2">Add investments to see performance chart</p>}
            </CardContent>
          </Card>

          {/* allocation donut + diversification */}
          <div className="space-y-4">
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-3">Portfolio Allocation</h3>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <PieChart width={130} height={130}>
                      <Pie data={donutData.length > 0 ? donutData : [{ name: "Empty", value: 1, color: "#E2E8F0" }]}
                        dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={2}>
                        {(donutData.length > 0 ? donutData : [{ color: "#E2E8F0" }]).map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[9px] text-gray-400">total</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-white tabular-nums">{formatAmount(totalValue)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {typeBreakdown.filter(t => t.total > 0 || t.count > 0).map(t => (
                      <div key={t.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{t.name}</span>
                        <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-300">{totalValue > 0 ? ((t.total / totalValue) * 100).toFixed(1) : "0"}%</span>
                      </div>
                    ))}
                    {typeBreakdown.every(t => t.total === 0) && <p className="text-xs text-gray-400">No active investments</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* diversification score */}
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Diversification Score</h3>
                  <div className="text-right">
                    <span className="text-xl font-bold tabular-nums" style={{ color: divScore >= 70 ? MINT : divScore >= 40 ? AMBER : DANGER }}>{divScore}</span>
                    <span className="text-xs text-gray-400 ml-1">/ 100</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "#F1F5F9" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${divScore}%`, backgroundColor: divScore >= 70 ? MINT : divScore >= 40 ? AMBER : DANGER }} />
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {donutData.length === 0 && <p>Add multiple investment types to improve diversification.</p>}
                  {donutData.length === 1 && <p className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> 100% in {donutData[0].name} — high concentration risk.</p>}
                  {divScore < 40 && donutData.length > 0 && <p className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> Consider adding bonds or stocks for stability.</p>}
                  {divScore >= 40 && <p className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Good spread across asset types.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* type breakdown strip */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {typeBreakdown.map(t => (
            <Card key={t.name} className={`border rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${typeFilter === t.name ? "ring-2" : "border-gray-100 dark:border-gray-800"}`}
              style={typeFilter === t.name ? { ringColor: t.color } : {}}
              onClick={() => setTypeFilter(typeFilter === t.name ? "All" : t.name)}
              data-testid={`card-type-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <p className="text-[10px] font-medium text-gray-500">{t.name}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums" data-testid={`text-type-total-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>{formatAmount(t.total)}</p>
                <p className="text-[10px] text-gray-400">{t.count} active</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* holdings table */}
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                All Holdings
                <span className="ml-2 text-xs font-normal text-gray-400">({filteredInv.length})</span>
              </h3>
              <div className="flex gap-1.5">
                {(["all","active","sold"] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition-all"
                    style={statusFilter === f ? { backgroundColor: BRAND, color: "#fff" } : { backgroundColor: "#F1F5F9", color: "#64748B" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredInv.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No investments found.</p>
                <Button onClick={() => { cancelForm(); setShowForm(true); }} className="mt-3 gap-1.5 rounded-xl" style={{ backgroundColor: BRAND }}>
                  <Plus className="w-4 h-4" /> Add Investment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-investments">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Name","Type","Qty","Cost","Value (USD)","Gain/Loss","G/L %","Alloc","Status",""].map(h => (
                        <th key={h} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${["Cost","Value (USD)","Gain/Loss","G/L %","Alloc"].includes(h) ? "text-right" : h === "" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInv.sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()).map((inv: any) => {
                      const curUsd = toUsd(Number(inv.currentValue), Number(inv.exchangeRateToUsd));
                      const purUsd = toUsd(Number(inv.purchasePrice), Number(inv.exchangeRateToUsd));
                      const gl  = curUsd - purUsd;
                      const glPct = purUsd > 0 ? (gl / purUsd) * 100 : 0;
                      const alloc = totalValue > 0 ? (curUsd / totalValue) * 100 : 0;
                      const typeInfo = INVESTMENT_TYPES.find(t => t.name === inv.type);
                      return (
                        <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group transition-colors" data-testid={`row-investment-${inv.id}`}>
                          <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white text-sm" data-testid={`text-name-${inv.id}`}>{inv.name}</td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: typeInfo ? `${typeInfo.color}22` : "#F1F5F9", color: typeInfo?.color || "#64748B" }} data-testid={`badge-type-${inv.id}`}>
                              {inv.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-500 tabular-nums">{inv.quantity || "—"}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-500">{formatAmount(purUsd)}</td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums text-gray-900 dark:text-white">{formatAmount(curUsd)}</td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums" style={{ color: gl >= 0 ? MINT : DANGER }}>{gl >= 0 ? "+" : ""}{formatAmount(gl)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${glPct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{glPct >= 0 ? "+" : ""}{glPct.toFixed(1)}%</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-12 h-1.5 rounded-full overflow-hidden bg-gray-100">
                                <div className="h-full rounded-full" style={{ width: `${alloc}%`, backgroundColor: typeInfo?.color || BRAND }} />
                              </div>
                              <span className="text-[10px] text-gray-400 tabular-nums w-8 text-right">{alloc.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${inv.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{inv.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(inv)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" data-testid={`button-edit-${inv.id}`}><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(inv.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" data-testid={`button-delete-${inv.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                      <td colSpan={4} className="py-2.5 px-3 text-xs font-semibold text-gray-500">Total ({activeInv.length} active)</td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">{formatAmount(totalValue)}</td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold tabular-nums" style={{ color: totalGainLoss >= 0 ? MINT : DANGER }}>{totalGainLoss >= 0 ? "+" : ""}{formatAmount(Math.abs(totalGainLoss))}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${gainLossPct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{gainLossPct >= 0 ? "+" : ""}{gainLossPct.toFixed(1)}%</span>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* smart insights */}
        <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5" style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF4FF)" }}>
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4" style={{ color: PURPLE }} /><h3 className="font-semibold text-gray-900 text-base">Smart Insights</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">🎯 Diversification</p>
                <p className="text-gray-500">{divScore < 40 ? `Portfolio concentration is high (score: ${divScore}/100). Consider adding different asset types to reduce risk.` : `Diversification score: ${divScore}/100. ${divScore >= 70 ? "Good spread across asset types." : "Adding bonds or real estate could improve stability."}`}</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">📊 Performance</p>
                <p className="text-gray-500">{best ? `Your best performer is ${best.name} at +${best.gainPct.toFixed(1)}%${worst && worst.id !== best.id ? `, while ${worst.name} is at ${worst.gainPct.toFixed(1)}%` : ""}.` : "Add investments to see performance insights."}</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">✨ Portfolio value</p>
                <p className="text-gray-500">{totalGainLoss >= 0 ? `Your portfolio gained ${formatAmount(totalGainLoss)} (+${gainLossPct.toFixed(1)}%) since purchase. Strong performance!` : `Portfolio is down ${formatAmount(Math.abs(totalGainLoss))} (${gainLossPct.toFixed(1)}%). Stay patient with long-term holdings.`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Investment Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) cancelForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Investment" : "Add Investment"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-investment">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name</label>
                <Input placeholder="e.g. Apple Stock" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} data-testid="input-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>{INVESTMENT_TYPES.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Quantity</label>
                <Input type="number" step="any" placeholder="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} data-testid="input-quantity" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Purchase Price (Total)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} data-testid="input-purchase-price" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Unit Price at Purchase</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.unitPriceAtPurchase} onChange={e => setFormData({ ...formData, unitPriceAtPurchase: e.target.value })} data-testid="input-unit-price" />
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
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Platform</label>
                <Input placeholder="e.g. Robinhood, Binance" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} data-testid="input-platform" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="sold">Sold</SelectItem></SelectContent>
                </Select>
              </div>
              {formData.status === "sold" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sell Date</label>
                    <Input type="date" value={formData.sellDate} onChange={e => setFormData({ ...formData, sellDate: e.target.value })} data-testid="input-sell-date" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sell Price</label>
                    <Input type="number" step="0.01" placeholder="0.00" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: e.target.value })} data-testid="input-sell-price" />
                  </div>
                </>
              )}
            </div>
            <CurrencyFields currencyCode={formData.currencyCode} exchangeRate={formData.exchangeRateToUsd} amount={formData.currentValue}
              onCurrencyChange={code => setFormData(p => ({ ...p, currencyCode: code }))}
              onExchangeRateChange={rate => setFormData(p => ({ ...p, exchangeRateToUsd: rate }))} showUsdPreview={true} />
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
              <Textarea placeholder="Optional notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="resize-none" rows={2} data-testid="input-notes" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={cancelForm} data-testid="button-cancel-edit">Cancel</Button>
              <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={isPending} data-testid="button-submit-investment">
                {isPending ? "Saving…" : editingId ? "Update" : "Add Investment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

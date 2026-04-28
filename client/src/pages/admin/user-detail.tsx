import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Redirect, Link, useParams } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft, Save, Shield, UserX, UserCheck, Trash2, Globe,
  Landmark, TrendingUp, Building2, CreditCard, Target, Receipt,
  DollarSign, Activity, User, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BRAND = "#1B4FE4";
const MINT = "#00C896";
const TABS = ["Profile", "Financial", "Activity", "Admin Actions"] as const;
type Tab = typeof TABS[number];

interface AdminUser {
  id: string; email: string | null; firstName: string | null; lastName: string | null;
  phone: string | null; country: string | null; currency: string | null; language: string | null;
  theme: string | null; isAdmin: boolean | null; isActive: boolean | null;
  createdAt: string | null; updatedAt: string | null;
}
interface Transaction { id: number; amount: string; currencyCode: string; exchangeRateToUsd: string; date: string; description: string | null; categoryId: number | null; }
interface Category { id: number; name: string; type: string; color: string; }
interface BankAccount { id: number; bankName: string; accountType: string; balance: string; currency: string; exchangeRateToUsd: string; }
interface Investment { id: number; name: string; type: string; currentValue: string; exchangeRateToUsd: string; status: string; }
interface Asset { id: number; name: string; type: string; currentValue: string; exchangeRateToUsd: string; status: string; }
interface Debt { id: number; creditorName: string; remainingAmount: string; exchangeRateToUsd: string; status: string; }
interface Goal { id: number; name: string; targetAmount: string; currentAmount: string; status: string; }
interface Summary { netWorth: number; totalIncome: number; totalExpenses: number; bankCount: number; investmentCount: number; assetCount: number; debtCount: number; goalCount: number; txCount: number; }

interface UserDetailData {
  user: AdminUser; transactions: Transaction[]; categories: Category[];
  bankAccounts: BankAccount[]; investments: Investment[]; assets: Asset[];
  debts: Debt[]; goals: Goal[]; summary: Summary;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function initials(u: AdminUser) {
  return ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || u.email?.[0]?.toUpperCase() || "?";
}

export default function AdminUserDetailPage() {
  const { user: currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("Profile");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "" });

  if (!(currentUser as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data, isLoading } = useQuery<UserDetailData>({
    queryKey: ["/api/admin/users", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users", id] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); setEditMode(false); toast({ title: "User updated" }); },
    onError: () => toast({ title: "Failed to update user", variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const endpoint = active ? "reactivate" : "suspend";
      const res = await fetch(`/api/admin/users/${id}/${endpoint}`, { method: "POST", credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
      return res.json();
    },
    onSuccess: (_, active) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users", id] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: active ? "User reactivated" : "User suspended" }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to delete"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); window.location.href = "/admin/users"; },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  if (isLoading) return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div></Layout>;
  if (!data) return <Layout><div className="text-center py-16 text-gray-400">User not found.</div></Layout>;

  const { user: u, transactions, categories, bankAccounts, investments, assets, debts, goals, summary } = data;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const isProtected = u.email === "mohammedfalzaq@gmail.com";

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-back"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: BRAND }}>
            {initials(u)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate" data-testid="text-user-detail-title">{u.firstName} {u.lastName}</h2>
              {u.isAdmin && <Shield className="w-4 h-4 text-blue-500 shrink-0" />}
              {u.isActive !== false ? (
                <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">Active</Badge>
              ) : (
                <Badge className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-0 text-[10px]">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">{u.email} · Joined {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}</p>
          </div>
        </div>
      </div>

      {/* Net Worth hero */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Net Worth", value: fmt(summary.netWorth), icon: <DollarSign className="w-4 h-4" />, color: summary.netWorth >= 0 ? MINT : "#EF4444" },
          { label: "Total Income", value: fmt(summary.totalIncome), icon: <TrendingUp className="w-4 h-4" />, color: MINT },
          { label: "Total Expenses", value: fmt(summary.totalExpenses), icon: <Receipt className="w-4 h-4" />, color: "#EF4444" },
          { label: "Transactions", value: summary.txCount, icon: <Activity className="w-4 h-4" />, color: BRAND },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "20", color: stat.color }}>{stat.icon}</div>
              </div>
              <p className="text-lg font-bold dark:text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white dark:bg-[#1A2744] shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            data-testid={`tab-${t.toLowerCase().replace(" ", "-")}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────────────────── */}
      {tab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744] lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Profile Information</CardTitle>
              {!editMode && <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => { setForm({ firstName: u.firstName ?? "", lastName: u.lastName ?? "", email: u.email ?? "", phone: u.phone ?? "", country: u.country ?? "" }); setEditMode(true); }} data-testid="button-edit-user">Edit</Button>}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(["firstName", "lastName", "email", "phone", "country"] as const).map(k => (
                      <div key={k}>
                        <label className="text-xs font-medium text-gray-400 mb-1 block capitalize">{k.replace(/([A-Z])/g, " $1")}</label>
                        <Input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} data-testid={`input-${k}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} style={{ backgroundColor: BRAND }} className="text-white rounded-xl text-xs h-8" data-testid="button-save-user">
                      <Save className="w-3.5 h-3.5 mr-1.5" />{saveMutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button variant="outline" className="rounded-xl text-xs h-8" onClick={() => setEditMode(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "First Name", value: u.firstName },
                    { label: "Last Name", value: u.lastName },
                    { label: "Email", value: u.email },
                    { label: "Phone", value: u.phone },
                    { label: "Country", value: u.country },
                    { label: "Currency", value: u.currency },
                    { label: "Language", value: u.language === "en" ? "English" : u.language === "ar" ? "Arabic" : u.language },
                    { label: "Theme", value: u.theme },
                    { label: "Registered", value: u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—" },
                    { label: "Last Updated", value: u.updatedAt ? format(new Date(u.updatedAt), "MMM d, yyyy") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-medium dark:text-white capitalize">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
            <CardHeader><CardTitle className="text-base">Account Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Status", value: u.isActive !== false ? "Active" : "Inactive" },
                { label: "Role", value: u.isAdmin ? "Admin" : "User" },
                { label: "Accounts", value: summary.bankCount },
                { label: "Investments", value: summary.investmentCount },
                { label: "Assets", value: summary.assetCount },
                { label: "Active Debts", value: summary.debtCount },
                { label: "Active Goals", value: summary.goalCount },
                { label: "Transactions", value: summary.txCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-xs font-semibold dark:text-white">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Financial Tab ────────────────────────────────────────────────────── */}
      {tab === "Financial" && (
        <div className="space-y-6">
          {/* Bank accounts */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4" style={{ color: BRAND }} />Bank Accounts ({bankAccounts.length})</CardTitle></CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No bank accounts</p> : (
                <div className="space-y-2">
                  {bankAccounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium dark:text-white">{a.bankName}</p>
                        <p className="text-xs text-gray-400 capitalize">{a.accountType}</p>
                      </div>
                      <p className="text-sm font-bold dark:text-white">{fmt(Number(a.balance) * Number(a.exchangeRateToUsd))}</p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <span className="text-sm font-semibold text-gray-500">Total</span>
                    <span className="text-sm font-bold" style={{ color: BRAND }}>{fmt(bankAccounts.reduce((s, a) => s + Number(a.balance) * Number(a.exchangeRateToUsd), 0))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investments */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: MINT }} />Investments ({investments.filter(i => i.status === "active").length})</CardTitle></CardHeader>
              <CardContent>
                {investments.filter(i => i.status === "active").length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No active investments</p> : (
                  <div className="space-y-2">
                    {investments.filter(i => i.status === "active").map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-sm font-medium dark:text-white">{inv.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{inv.type}</p>
                        </div>
                        <p className="text-sm font-bold dark:text-white">{fmt(Number(inv.currentValue) * Number(inv.exchangeRateToUsd))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assets */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-500" />Assets ({assets.filter(a => a.status === "owned").length})</CardTitle></CardHeader>
              <CardContent>
                {assets.filter(a => a.status === "owned").length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No assets</p> : (
                  <div className="space-y-2">
                    {assets.filter(a => a.status === "owned").map(asset => (
                      <div key={asset.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-sm font-medium dark:text-white">{asset.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{asset.type}</p>
                        </div>
                        <p className="text-sm font-bold dark:text-white">{fmt(Number(asset.currentValue) * Number(asset.exchangeRateToUsd))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debts */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4 text-red-500" />Debts ({debts.filter(d => d.status === "active").length})</CardTitle></CardHeader>
              <CardContent>
                {debts.filter(d => d.status === "active").length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No active debts</p> : (
                  <div className="space-y-2">
                    {debts.filter(d => d.status === "active").map(debt => (
                      <div key={debt.id} className="flex items-center justify-between py-1.5">
                        <p className="text-sm font-medium dark:text-white">{debt.creditorName}</p>
                        <p className="text-sm font-bold text-red-500">{fmt(Number(debt.remainingAmount) * Number(debt.exchangeRateToUsd))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-purple-500" />Goals ({goals.filter(g => g.status === "active").length})</CardTitle></CardHeader>
              <CardContent>
                {goals.filter(g => g.status === "active").length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No active goals</p> : (
                  <div className="space-y-3">
                    {goals.filter(g => g.status === "active").map(goal => {
                      const pct = Number(goal.targetAmount) > 0 ? Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100) : 0;
                      return (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium dark:text-white">{goal.name}</p>
                            <p className="text-xs text-gray-400">{pct.toFixed(0)}%</p>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BRAND }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Activity Tab ─────────────────────────────────────────────────────── */}
      {tab === "Activity" && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
          <CardHeader><CardTitle className="text-base">Transactions ({transactions.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No transactions for this user.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["Date", "Description", "Category", "Amount"].map((h, i) => (
                        <th key={h} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 50).map(t => {
                      const cat = t.categoryId ? catMap[t.categoryId] : null;
                      const inUsd = Number(t.amount) * Number(t.exchangeRateToUsd);
                      return (
                        <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors" data-testid={`row-tx-${t.id}`}>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{format(new Date(t.date), "MMM d, yyyy")}</td>
                          <td className="py-3 px-4 font-medium dark:text-white">{t.description || "—"}</td>
                          <td className="py-3 px-4">
                            {cat ? <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: cat.color + "20", color: cat.color }}>{cat.name}</span> : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-bold dark:text-white">
                            {fmt(inUsd)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {transactions.length > 50 && <p className="text-center text-xs text-gray-400 py-3">Showing 50 of {transactions.length} transactions</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Admin Actions Tab ────────────────────────────────────────────────── */}
      {tab === "Admin Actions" && (
        <div className="space-y-4 max-w-lg">
          {/* Suspend / Reactivate */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserX className="w-4 h-4 text-amber-500" />Account Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {u.isActive !== false
                  ? "This account is currently active. Suspending it will prevent the user from logging in."
                  : "This account is currently inactive. Reactivating will restore their access."}
              </p>
              {isProtected ? (
                <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Primary admin account is protected.</p>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className={`w-full rounded-xl text-sm h-9 ${u.isActive !== false ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`} disabled={suspendMutation.isPending} data-testid="button-suspend">
                      {u.isActive !== false ? <><UserX className="w-4 h-4 mr-2" />Suspend Account</> : <><UserCheck className="w-4 h-4 mr-2" />Reactivate Account</>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{u.isActive !== false ? "Suspend" : "Reactivate"} Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        {u.isActive !== false
                          ? `Are you sure you want to suspend ${u.firstName} ${u.lastName}? They won't be able to log in.`
                          : `Reactivate ${u.firstName} ${u.lastName}'s account? They'll regain full access.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={u.isActive !== false ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}
                        onClick={() => suspendMutation.mutate(u.isActive === false)}
                      >
                        {u.isActive !== false ? "Suspend" : "Reactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Delete */}
          {!isProtected && (
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744] border border-red-100 dark:border-red-950/30">
              <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" />Delete Account</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete this user and all their data. This cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full rounded-xl text-sm h-9" disabled={deleteMutation.isPending} data-testid="button-delete-user">
                      <Trash2 className="w-4 h-4 mr-2" />Delete Account Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently delete <strong>{u.firstName} {u.lastName}</strong>? All transactions, budgets, goals, investments, and other data will be removed. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate()}>Delete Permanently</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* User metadata */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" />Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "User ID", value: u.id },
                { label: "Created", value: u.createdAt ? format(new Date(u.createdAt), "PPpp") : "—" },
                { label: "Updated", value: u.updatedAt ? format(new Date(u.updatedAt), "PPpp") : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-300 max-w-[220px] truncate text-right">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}

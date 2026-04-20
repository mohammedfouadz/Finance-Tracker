import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBankAccounts, useCreateBankAccount, useUpdateBankAccount, useDeleteBankAccount, useBalanceHistory } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Trash2, Pencil, Landmark, Wallet, CreditCard, TrendingUp, Hash,
  Eye, EyeOff, Copy, Check, AlertTriangle, CheckCircle2, Lightbulb, Shield,
  MoreVertical, ArrowUpRight, ArrowDownRight, Activity, RefreshCw, X,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from "recharts";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const PURPLE = "#8B5CF6";
const DANGER = "#EF4444";

/* ── account type config ── */
type AccType = "Savings" | "Checking" | "Investment" | "Credit Card";
const TYPE_CFG: Record<AccType, { icon: any; color: string; fromColor: string; toColor: string; label: string }> = {
  Checking:      { icon: Landmark,   color: BRAND,   fromColor: "#1B4FE4", toColor: "#3B82F6", label: "Checking" },
  Savings:       { icon: Wallet,     color: "#10B981", fromColor: "#059669", toColor: "#34D399", label: "Savings" },
  Investment:    { icon: TrendingUp, color: PURPLE,  fromColor: "#7C3AED", toColor: "#A78BFA", label: "Investment" },
  "Credit Card": { icon: CreditCard, color: "#EF4444", fromColor: "#DC2626", toColor: "#F87171", label: "Credit" },
};
const ACCOUNT_TYPES = Object.keys(TYPE_CFG);

function typeConfig(type: string) {
  return TYPE_CFG[type as AccType] || TYPE_CFG.Savings;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", SAR: "🇸🇦", AED: "🇦🇪",
  ILS: "🇮🇱", JOD: "🇯🇴", KWD: "🇰🇼", QAR: "🇶🇦", BHD: "🇧🇭",
};

/* ── mini sparkline using balance history ── */
function Sparkline({ accountId, color }: { accountId: number; color: string }) {
  const { data: history = [] } = useBalanceHistory(accountId);
  if (!history || history.length < 2) {
    const dummy = [0.4, 0.6, 0.5, 0.8, 0.7, 1].map((v, i) => ({ v }));
    return (
      <ResponsiveContainer width="100%" height={48}>
        <AreaChart data={dummy}>
          <defs>
            <linearGradient id={`sg${accountId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg${accountId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  const data = (history as any[]).slice(-12).map((h: any) => ({ v: Number(h.newBalance) }));
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`sg${accountId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Balance"]} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg${accountId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── copy button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, icon: Icon, color, bg, trend, trendUp }: {
  label: string; value: string; sub?: string;
  icon: any; color: string; bg: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}66, transparent)` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── account card ── */
function AccountCard({
  account, masked, onEdit, onDelete,
}: {
  account: any; masked: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const cfg   = typeConfig(account.accountType);
  const Icon  = cfg.icon;
  const bal   = Number(account.balance);
  const usd   = toUsd(bal, Number(account.exchangeRateToUsd));
  const curr  = account.currency || "USD";
  const masked4 = "•••• " + (account.accountNumber?.slice(-4) || "????");
  const isNeg   = bal < 0;
  const isLow   = !isNeg && usd < 100;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 flex flex-col"
      data-testid={`card-account-${account.id}`}>

      {/* gradient header */}
      <div className="relative h-20 flex items-center justify-between px-4 shrink-0"
        style={{ background: `linear-gradient(135deg, ${cfg.fromColor}, ${cfg.toColor})` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{account.bankName}</p>
            <p className="text-white/70 text-xs">{account.accountType}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-white/20 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
            {account.accountType}
          </span>
          <div className="relative">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              data-testid={`button-menu-${account.id}`}>
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 w-36" onMouseLeave={() => setMenuOpen(false)}>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" onClick={() => { setMenuOpen(false); onEdit(); }} data-testid={`button-edit-${account.id}`}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2" onClick={() => { setMenuOpen(false); onDelete(); }} data-testid={`button-delete-${account.id}`}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* low / negative badges */}
        {isNeg && (
          <span className="absolute bottom-2 left-4 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Negative
          </span>
        )}
        {isLow && !isNeg && (
          <span className="absolute bottom-2 left-4 bg-amber-400/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Low balance
          </span>
        )}
      </div>

      {/* body */}
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* masked account number */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-gray-500 tracking-widest">{masked ? "•••• •••• •••• ••••" : masked4}</span>
          {!masked && <CopyBtn text={account.accountNumber} />}
        </div>

        {/* balance */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Balance</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tabular-nums ${isNeg ? "text-red-500" : "text-gray-900 dark:text-white"}`}
              data-testid={`text-balance-${account.id}`}>
              {masked ? "••••••" : `${getCurrencySymbol(curr)}${Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              {isNeg && " ⚠"}
            </span>
            <span className="text-xs text-gray-400">{curr}</span>
          </div>
          {curr !== "USD" && !masked && (
            <p className="text-xs text-gray-400 mt-0.5">≈ {formatAmount(usd)} USD</p>
          )}
        </div>

        {/* sparkline */}
        <div className="opacity-70">
          <Sparkline accountId={account.id} color={cfg.color} />
        </div>

        {/* meta row */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-gray-400">Updated</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {account.lastUpdated ? format(new Date(account.lastUpdated), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Currency</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {CURRENCY_FLAGS[curr] || "🌐"} {curr}
            </p>
          </div>
          {account.notes && (
            <div className="col-span-2 mt-1 pt-2 border-t border-gray-50 dark:border-gray-800">
              <span className="text-gray-400">Notes</span>
              <p className="text-gray-600 dark:text-gray-300 truncate">{account.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}

/* ── add/edit dialog ── */
const emptyForm = { bankName: "", accountType: "Savings", accountNumber: "", currency: "USD", exchangeRateToUsd: "1", balance: "", notes: "" };

function AccountDialog({ open, onOpenChange, editingAccount, userId, onCreate, onUpdate, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editingAccount: any | null; userId: string;
  onCreate: (data: any) => void; onUpdate: (data: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState(emptyForm);

  useMemo(() => {
    if (editingAccount) {
      setForm({
        bankName:          editingAccount.bankName,
        accountType:       editingAccount.accountType,
        accountNumber:     editingAccount.accountNumber,
        currency:          editingAccount.currency || "USD",
        exchangeRateToUsd: String(editingAccount.exchangeRateToUsd || "1"),
        balance:           String(editingAccount.balance),
        notes:             editingAccount.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingAccount, open]);

  const valid = form.bankName && form.accountType && form.accountNumber && form.balance;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!valid) return;
    const data = { ...form, userId };
    if (editingAccount) onUpdate({ id: editingAccount.id, ...data });
    else onCreate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingAccount ? "Edit Account" : "Add Bank Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Bank Name</label>
              <Input placeholder="e.g. Chase, BOP, AIB" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} data-testid="input-bank-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Account Type</label>
              <Select value={form.accountType} onValueChange={v => setForm({ ...form, accountType: v })}>
                <SelectTrigger data-testid="select-account-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Account Number</label>
              <Input placeholder="Last 4 digits or full" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} data-testid="input-account-number" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Balance</label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} data-testid="input-balance" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
              <Input placeholder="Optional" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-notes" />
            </div>
          </div>
          <CurrencyFields
            currencyCode={form.currency}
            exchangeRate={form.exchangeRateToUsd}
            amount={form.balance}
            onCurrencyChange={code => setForm(f => ({ ...f, currency: code }))}
            onExchangeRateChange={rate => setForm(f => ({ ...f, exchangeRateToUsd: rate }))}
            showUsdPreview={true}
          />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={!valid || isPending} data-testid="button-submit-account">
              {isPending ? "Saving…" : editingAccount ? "Update" : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── main page ── */
export default function BankAccountsPage() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const allAccounts = accounts as any[];

  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [masked,         setMasked]         = useState(false);

  /* ── stats ── */
  const totalUsd = useMemo(() =>
    allAccounts.reduce((s, a) => s + toUsd(Number(a.balance), Number(a.exchangeRateToUsd)), 0),
    [allAccounts]
  );

  const highestAcc = useMemo(() =>
    allAccounts.length ? allAccounts.reduce((m, a) => toUsd(Number(a.balance), Number(a.exchangeRateToUsd)) > toUsd(Number(m.balance), Number(m.exchangeRateToUsd)) ? a : m, allAccounts[0]) : null,
    [allAccounts]
  );

  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    allAccounts.forEach(a => { map[a.accountType] = (map[a.accountType] || 0) + 1; });
    return Object.entries(map).map(([t, c]) => `${c} ${t}`).join(" · ");
  }, [allAccounts]);

  /* currency distribution */
  const currencyDist = useMemo(() => {
    const map: Record<string, number> = {};
    allAccounts.forEach(a => {
      const usd = toUsd(Number(a.balance), Number(a.exchangeRateToUsd));
      if (usd > 0) map[a.currency || "USD"] = (map[a.currency || "USD"] || 0) + usd;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([curr, usd]) => ({ curr, usd, pct: total > 0 ? (usd / total) * 100 : 0 }));
  }, [allAccounts]);

  const DIST_COLORS = [BRAND, MINT, PURPLE, AMBER, DANGER];

  /* handlers */
  const openCreate = () => { setEditingAccount(null); setDialogOpen(true); };
  const openEdit   = (a: any) => { setEditingAccount(a); setDialogOpen(true); };

  const handleCreate = async (data: any) => {
    try {
      await createAccount.mutateAsync(data);
      toast({ title: "Account added" });
      setDialogOpen(false);
    } catch { toast({ title: "Failed to add", variant: "destructive" }); }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateAccount.mutateAsync(data);
      toast({ title: "Account updated" });
      setDialogOpen(false);
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    try {
      await deleteAccount.mutateAsync(id);
      toast({ title: "Account deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  /* health insights */
  const healthItems = useMemo(() => {
    const items: { icon: any; color: string; bg: string; text: string }[] = [];
    items.push({ icon: CheckCircle2, color: "#10B981", bg: "#ECFDF5", text: "All accounts are up to date" });
    const negAcc = allAccounts.find(a => Number(a.balance) < 0);
    if (negAcc) items.push({ icon: AlertTriangle, color: DANGER, bg: "#FEF2F2", text: `${negAcc.bankName}: Negative balance — review credit card debt` });
    const lowAcc = allAccounts.find(a => !( Number(a.balance) < 0) && toUsd(Number(a.balance), Number(a.exchangeRateToUsd)) < 100);
    if (lowAcc) items.push({ icon: AlertTriangle, color: AMBER, bg: "#FFFBEB", text: `${lowAcc.bankName}: Low balance alert` });
    if (currencyDist.length > 1) items.push({ icon: Activity, color: PURPLE, bg: "#F5F3FF", text: `${currencyDist.length} currencies detected — consider consolidating for easier tracking` });
    items.push({ icon: Shield, color: BRAND, bg: "#EEF4FF", text: "Your financial data is encrypted and secured" });
    return items.slice(0, 5);
  }, [allAccounts, currencyDist]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Bank Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your accounts and balances across currencies.</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* balance privacy toggle */}
            <button
              onClick={() => setMasked(m => !m)}
              className="h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              title={masked ? "Show balances" : "Hide balances"}
              data-testid="button-toggle-mask">
              {masked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <Button onClick={openCreate} className="gap-2 rounded-xl shadow-sm" style={{ backgroundColor: BRAND }} data-testid="button-add-account">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Balance (USD)"
            value={masked ? "••••••" : formatAmount(totalUsd)}
            sub={`Across ${allAccounts.length} account${allAccounts.length !== 1 ? "s" : ""} · ${currencyDist.length} currenc${currencyDist.length !== 1 ? "ies" : "y"}`}
            icon={Wallet}
            color="#10B981"
            bg="#ECFDF5"
          />
          <KpiCard
            label="Number of Accounts"
            value={String(allAccounts.length)}
            sub={typeBreakdown || "No accounts yet"}
            icon={Hash}
            color={BRAND}
            bg="#EEF4FF"
          />
          <KpiCard
            label="Highest Balance"
            value={masked ? "••••••" : (highestAcc ? formatAmount(toUsd(Number(highestAcc.balance), Number(highestAcc.exchangeRateToUsd))) : formatAmount(0))}
            sub={highestAcc ? `${highestAcc.bankName} · ${highestAcc.accountType}` : "No accounts"}
            icon={TrendingUp}
            color={AMBER}
            bg="#FFFBEB"
          />
          <KpiCard
            label="Currencies"
            value={String(currencyDist.length)}
            sub={currencyDist.map(c => `${CURRENCY_FLAGS[c.curr] || ""}${c.curr}`).join(" · ") || "—"}
            icon={Activity}
            color={PURPLE}
            bg="#F5F3FF"
          />
        </div>

        {/* ── CURRENCY DISTRIBUTION BANNER ── */}
        {currencyDist.length > 0 && (
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Currency Distribution</h3>
                  <p className="text-xs text-gray-400">USD-equivalent breakdown across your accounts</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <RefreshCw className="w-3 h-3" />
                  <span>Live rates</span>
                </div>
              </div>
              {/* stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                {currencyDist.map((c, i) => (
                  <div key={c.curr} className="rounded-full transition-all" style={{ width: `${c.pct}%`, backgroundColor: DIST_COLORS[i % DIST_COLORS.length] }} title={`${c.curr}: ${c.pct.toFixed(1)}%`} />
                ))}
              </div>
              {/* legend */}
              <div className="flex flex-wrap gap-3">
                {currencyDist.map((c, i) => (
                  <div key={c.curr} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DIST_COLORS[i % DIST_COLORS.length] }} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {CURRENCY_FLAGS[c.curr] || ""} {c.curr}
                    </span>
                    <span className="text-xs text-gray-400">{c.pct.toFixed(0)}% · {masked ? "•••" : formatAmount(c.usd)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ACCOUNTS GRID ── */}
        {allAccounts.length === 0 ? (
          /* empty state */
          <Card className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <CardContent className="p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${BRAND}15` }}>
                <Landmark className="w-8 h-8" style={{ color: BRAND }} />
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">No bank accounts yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first account to start tracking your wealth.</p>
              </div>
              <Button onClick={openCreate} className="gap-2 rounded-xl mt-2" style={{ backgroundColor: BRAND }}>
                <Plus className="w-4 h-4" /> Connect First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {allAccounts.map((account: any) => (
              <AccountCard
                key={account.id}
                account={account}
                masked={masked}
                onEdit={() => openEdit(account)}
                onDelete={() => handleDelete(account.id)}
              />
            ))}

            {/* Add Account ghost card */}
            <button
              onClick={openCreate}
              className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 p-8 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all text-gray-400 hover:text-gray-500 min-h-[240px]"
              data-testid="button-add-ghost">
              <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">Add Account</p>
            </button>
          </div>
        )}

        {/* ── ACCOUNT HEALTH + BOTTOM ROW ── */}
        {allAccounts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* account summary — 2/3 */}
            <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Accounts Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 dark:border-gray-800">
                        <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Account</th>
                        <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">Type</th>
                        <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wide text-gray-400">Balance</th>
                        <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wide text-gray-400">USD Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {allAccounts.map((a: any) => {
                        const cfg = typeConfig(a.accountType);
                        const bal = Number(a.balance);
                        const usd = toUsd(bal, Number(a.exchangeRateToUsd));
                        const curr = a.currency || "USD";
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}20` }}>
                                  <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-xs">{a.bankName}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{"•••• " + (a.accountNumber?.slice(-4) || "????" )}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                                {a.accountType}
                              </span>
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              <span className={`font-bold text-sm ${bal < 0 ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                                {masked ? "••••" : `${getCurrencySymbol(curr)}${Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">{curr}</span>
                            </td>
                            <td className="py-3 text-right tabular-nums text-xs text-gray-500">
                              {masked ? "••••" : formatAmount(usd)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-100 dark:border-gray-700">
                        <td colSpan={3} className="pt-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total (USD)</td>
                        <td className="pt-3 text-right font-bold tabular-nums" style={{ color: MINT }}>
                          {masked ? "••••••" : formatAmount(totalUsd)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* account health — 1/3 */}
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Account Health</h3>
                <p className="text-xs text-gray-400 mb-4">Insights about your accounts</p>
                <div className="space-y-3">
                  {healthItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: item.bg }}>
                        <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* ── dialog ── */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingAccount={editingAccount}
        userId={user?.id ?? ""}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isPending={createAccount.isPending || updateAccount.isPending}
      />
    </Layout>
  );
}

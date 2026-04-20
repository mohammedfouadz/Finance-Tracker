import { useState, useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, useDebtPayments, useCreateDebtPayment } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getCurrencySymbol } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, differenceInMonths } from "date-fns";
import {
  Plus, Trash2, Pencil, CreditCard, CheckCircle, AlertTriangle, Percent,
  DollarSign, Calendar, Flag, Flame, MoreVertical, Sparkles, ChevronRight,
  Car, Home, GraduationCap, Briefcase, Heart, BarChart2, X,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const PURPLE = "#8B5CF6";
const DANGER = "#EF4444";

/* ── debt category config ── */
function debtCategory(reason: string) {
  const r = (reason || "").toLowerCase();
  if (r.includes("car") || r.includes("auto") || r.includes("vehicle")) return { icon: Car,           color: BRAND,   bg: "#EEF4FF", label: "Auto" };
  if (r.includes("home") || r.includes("mortgage") || r.includes("house")) return { icon: Home,          color: AMBER,   bg: "#FFFBEB", label: "Mortgage" };
  if (r.includes("student") || r.includes("education") || r.includes("school")) return { icon: GraduationCap, color: MINT,    bg: "#F0FDF9", label: "Education" };
  if (r.includes("credit") || r.includes("card"))  return { icon: CreditCard,   color: PURPLE,  bg: "#F5F3FF", label: "Credit Card" };
  if (r.includes("medical") || r.includes("health")) return { icon: Heart,         color: "#EC4899", bg: "#FDF2F8", label: "Medical" };
  if (r.includes("business"))                        return { icon: Briefcase,     color: "#6366F1", bg: "#EEF2FF", label: "Business" };
  return { icon: DollarSign, color: "#64748B", bg: "#F1F5F9", label: "Personal" };
}

/* ── payoff projection ── */
function projectedMonths(remaining: number, installment: number) {
  if (!installment || installment <= 0 || remaining <= 0) return null;
  return Math.ceil(remaining / installment);
}

function debtFreeDate(remaining: number, installment: number) {
  const m = projectedMonths(remaining, installment);
  if (!m) return null;
  return addMonths(new Date(), m);
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, icon: Icon, color, bg, trend, trendUp }: {
  label: string; value: string; sub?: string; icon: any; color: string; bg: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}88, transparent)` }}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Journey bar ── */
function JourneyBar({ debts }: { debts: any[] }) {
  const { formatAmount } = useCurrency();
  const totalOriginal = debts.reduce((s, d) => s + toUsd(Number(d.originalAmount), Number(d.exchangeRateToUsd)), 0);
  const totalRemaining = debts.reduce((s, d) => s + toUsd(Number(d.remainingAmount), Number(d.exchangeRateToUsd)), 0);
  const paid = totalOriginal - totalRemaining;
  const pct = totalOriginal > 0 ? (paid / totalOriginal) * 100 : 0;

  const milestones = [0, 25, 50, 75, 100];

  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Your Debt-Free Journey</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              You've paid off {pct.toFixed(1)}% — {pct >= 50 ? "more than halfway there! 🚀" : "keep going, every payment counts!"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Remaining</p>
            <p className="font-bold text-lg tabular-nums" style={{ color: DANGER }}>{formatAmount(totalRemaining)}</p>
          </div>
        </div>

        {/* journey bar */}
        <div className="relative mt-6 mb-2">
          {/* milestone labels */}
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Start<br/>{formatAmount(totalOriginal)}</span>
            {[25, 50, 75].map(m => (
              <span key={m} className="text-center">{m}%<br/>{formatAmount(totalOriginal * (1 - m / 100))}</span>
            ))}
            <span className="text-right">🏁 Debt-free<br/>{formatAmount(0)}</span>
          </div>

          {/* track */}
          <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(pct, 1)}%`, background: `linear-gradient(90deg, ${BRAND}, ${MINT})` }}
            />
            {/* current position dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 shadow-md flex items-center justify-center text-[8px] font-bold"
              style={{ left: `calc(${Math.max(pct, 3)}% - 10px)`, borderColor: BRAND, color: BRAND }}>
              ●
            </div>
          </div>

          {/* milestone dots */}
          <div className="flex justify-between mt-1.5">
            {milestones.map(m => {
              const reached = pct >= m;
              return (
                <div key={m} className="flex flex-col items-center gap-0.5">
                  <div className={`w-2 h-2 rounded-full border ${reached ? "border-transparent" : "border-gray-300 dark:border-gray-600"}`}
                    style={reached ? { backgroundColor: m === 100 ? MINT : BRAND } : {}} />
                  {m > 0 && m < 100 && (
                    <span className={`text-[9px] font-medium ${reached ? "text-emerald-600" : "text-gray-400"}`}>
                      {reached ? "✅" : "⏳"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* bottom strip */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs">
          <span className="text-gray-400">
            <strong className="text-gray-700 dark:text-gray-300">{formatAmount(paid)}</strong> crushed so far
          </span>
          <span style={{ color: MINT }} className="font-semibold">
            {formatAmount(totalRemaining)} to go 💪
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── individual debt payment history sub-component ── */
function DebtPaymentHistory({ debt }: { debt: any }) {
  const { data: payments = [] } = useDebtPayments(debt.id);
  const { formatAmount } = useCurrency();
  const list = (payments as any[]).slice(0, 5);
  if (!list.length) return <p className="text-xs text-gray-400 py-2 text-center">No payments recorded yet.</p>;
  return (
    <div className="space-y-1.5 mt-2">
      {list.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800">
          <span className="text-gray-400">{p.paymentDate ? format(new Date(p.paymentDate), "MMM d, yyyy") : "—"}</span>
          <span className="font-semibold" style={{ color: MINT }}>
            -{getCurrencySymbol(p.currencyCode || "USD")}{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── debt card ── */
function DebtCard({
  debt, onEdit, onDelete, onRecordPayment,
}: {
  debt: any; onEdit: () => void; onDelete: () => void; onRecordPayment: () => void;
}) {
  const { formatAmount } = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const cat  = debtCategory(debt.reason || "");
  const Icon = cat.icon;
  const orig = Number(debt.originalAmount);
  const rem  = Number(debt.remainingAmount);
  const paid = orig - rem;
  const pct  = orig > 0 ? (paid / orig) * 100 : 0;
  const install = Number(debt.installmentAmount) || 0;
  const rate = Number(debt.interestRate) || 0;
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== "paid";
  const isHighInterest = rate > 10;
  const isPaid = debt.status === "paid";
  const months = projectedMonths(rem, install);
  const freeDate = debtFreeDate(rem, install);

  /* mini payoff chart */
  const payoffChartData = useMemo(() => {
    if (!install || install <= 0) return [];
    const pts: { month: string; bal: number }[] = [];
    let bal = rem;
    for (let i = 0; i <= Math.min(months || 24, 24); i++) {
      pts.push({ month: `M${i}`, bal: Math.max(0, bal) });
      bal -= install;
    }
    return pts;
  }, [rem, install, months]);

  const cardStyle: React.CSSProperties = {
    borderColor: isOverdue ? "#FCA5A5" : isHighInterest ? "#FDE68A" : "#E2E8F0",
    boxShadow: isOverdue ? "0 0 0 2px #FECACA" : isHighInterest ? "0 0 0 2px #FEF3C7" : undefined,
  };

  return (
    <div
      className="rounded-2xl border bg-white dark:bg-gray-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col"
      style={cardStyle}
      data-testid={`card-debt-${debt.id}`}>
      <CardContent className="p-5 flex flex-col gap-4">

        {/* top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
              <Icon className="w-5 h-5" style={{ color: cat.color }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm" data-testid={`text-creditor-${debt.id}`}>{debt.creditorName}</p>
              <p className="text-xs text-gray-400 italic" data-testid={`text-reason-${debt.id}`}>{debt.reason} · {cat.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* status pill */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-50 text-emerald-700" : isOverdue ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}
              data-testid={`badge-status-${debt.id}`}>
              {isPaid ? "Paid ✅" : isOverdue ? "Overdue ⚠" : "Active"}
            </span>
            {/* three-dot menu */}
            <div className="relative">
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMenuOpen(o => !o)} data-testid={`button-menu-${debt.id}`}>
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 w-36" onMouseLeave={() => setMenuOpen(false)}>
                  <button className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" onClick={() => { setMenuOpen(false); onEdit(); }} data-testid={`button-edit-${debt.id}`}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2" onClick={() => { setMenuOpen(false); onDelete(); }} data-testid={`button-delete-${debt.id}`}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* balance row */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50/70 dark:bg-gray-800/30 rounded-xl p-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Original</p>
            <p className="text-xs font-semibold text-gray-500 tabular-nums mt-0.5" data-testid={`text-original-${debt.id}`}>
              {getCurrencySymbol(debt.currency)}{orig.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
            <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: isPaid ? MINT : DANGER }} data-testid={`text-remaining-${debt.id}`}>
              {getCurrencySymbol(debt.currency)}{rem.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Paid</p>
            <p className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: MINT }}>
              {getCurrencySymbol(debt.currency)}{paid.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-bold" style={{ color: pct >= 75 ? MINT : pct >= 25 ? AMBER : DANGER }}>
              {pct.toFixed(1)}% paid off
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pct, 0.5)}%`, background: pct >= 75 ? `linear-gradient(90deg, ${BRAND}, ${MINT})` : `linear-gradient(90deg, ${BRAND}, ${AMBER})` }}
              data-testid={`progress-${debt.id}`}
            />
          </div>
        </div>

        {/* details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <span className="text-gray-400">Interest Rate</span>
            <p className="font-semibold" style={{ color: rate > 10 ? AMBER : "inherit" }}>
              {rate > 0 ? `${rate.toFixed(2)}%` : "0% (Interest-free)"} {rate > 10 && "⚠"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Monthly Payment</span>
            <p className="font-semibold">{install > 0 ? `${getCurrencySymbol(debt.currency)}${install.toLocaleString()}` : "Not set"}</p>
          </div>
          {debt.dueDate && (
            <div>
              <span className="text-gray-400">Next Due</span>
              <p className={`font-semibold ${isOverdue ? "text-red-500" : ""}`} data-testid={`text-due-date-${debt.id}`}>
                {format(new Date(debt.dueDate), "MMM d, yyyy")} {isOverdue && "⚠"}
              </p>
            </div>
          )}
          {freeDate && (
            <div>
              <span className="text-gray-400">Debt-Free Est.</span>
              <p className="font-semibold" style={{ color: MINT }}>{format(freeDate, "MMM yyyy")}</p>
            </div>
          )}
          {months && (
            <div>
              <span className="text-gray-400">Months Left</span>
              <p className="font-semibold">{months} mo</p>
            </div>
          )}
          <div>
            <span className="text-gray-400">Status</span>
            <p className="font-semibold capitalize">{debt.paymentPlan || "—"}</p>
          </div>
        </div>

        {/* mini payoff chart */}
        {payoffChartData.length > 1 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Payoff Projection</p>
            <div className="opacity-80">
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={payoffChartData}>
                  <defs>
                    <linearGradient id={`dg${debt.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cat.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={cat.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="bal" stroke={cat.color} strokeWidth={1.5} fill={`url(#dg${debt.id})`} dot={false} />
                  <Tooltip formatter={(v: any) => [getCurrencySymbol(debt.currency) + Number(v).toLocaleString(), "Balance"]} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* footer actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-50 dark:border-gray-800">
          <Button size="sm" className="flex-1 gap-1.5 text-xs h-8 rounded-xl" style={{ backgroundColor: BRAND }} onClick={onRecordPayment} data-testid={`button-record-payment-${debt.id}`}>
            <CreditCard className="w-3.5 h-3.5" /> Record Payment
          </Button>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
            History <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* expandable payment history */}
        {showHistory && (
          <div className="border-t border-gray-50 dark:border-gray-800 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Recent Payments</p>
            <DebtPaymentHistory debt={debt} />
          </div>
        )}
      </CardContent>
    </div>
  );
}

/* ── extra payment calculator ── */
function ExtraPaymentCalculator({ debts }: { debts: any[] }) {
  const { formatAmount } = useCurrency();
  const [extra, setExtra] = useState(100);

  const totalInstall = debts.reduce((s, d) => s + (Number(d.installmentAmount) || 0), 0);
  const totalRem     = debts.reduce((s, d) => s + toUsd(Number(d.remainingAmount), Number(d.exchangeRateToUsd)), 0);
  const baseMonths   = totalInstall > 0 ? Math.ceil(totalRem / totalInstall) : 0;
  const newMonths    = (totalInstall + extra) > 0 ? Math.ceil(totalRem / (totalInstall + extra)) : 0;
  const monthsSaved  = Math.max(0, baseMonths - newMonths);
  const interestSaved = monthsSaved * extra * 0.3; // rough estimate

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Extra Payment Calculator</h4>
          <p className="text-xs text-gray-400">See how extra payments help</p>
        </div>
        <BarChart2 className="w-4 h-4 text-gray-400" />
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block">Extra monthly amount</label>
        <div className="flex items-center gap-2">
          <input
            type="range" min={0} max={1000} step={25} value={extra}
            onChange={e => setExtra(Number(e.target.value))}
            className="flex-1 accent-blue-600"
            data-testid="slider-extra-payment"
          />
          <span className="text-sm font-bold tabular-nums w-16 text-right" style={{ color: BRAND }}>+${extra}</span>
        </div>
      </div>
      {baseMonths > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 text-xs space-y-1">
          {monthsSaved > 0 ? (
            <>
              <p className="font-semibold" style={{ color: MINT }}>🎉 Debt-free {monthsSaved} months sooner!</p>
              <p className="text-gray-500">Est. interest saved: <strong style={{ color: MINT }}>{formatAmount(interestSaved)}</strong></p>
            </>
          ) : (
            <p className="text-gray-400">Add more to see faster payoff estimates</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── add/edit debt dialog ── */
const emptyDebtForm = {
  creditorName: "", originalAmount: "", remainingAmount: "", currency: "USD",
  exchangeRateToUsd: "1", reason: "", dateTaken: new Date().toISOString().split("T")[0],
  dueDate: "", interestRate: "", status: "active", paymentPlan: "Monthly",
  installmentAmount: "", notes: "",
};

function DebtDialog({ open, onOpenChange, editingDebt, userId, onCreate, onUpdate, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editingDebt: any | null; userId: string;
  onCreate: (d: any) => void; onUpdate: (d: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState(emptyDebtForm);

  useMemo(() => {
    if (editingDebt) {
      setForm({
        creditorName:      editingDebt.creditorName,
        originalAmount:    String(editingDebt.originalAmount),
        remainingAmount:   String(editingDebt.remainingAmount),
        currency:          editingDebt.currency || "USD",
        exchangeRateToUsd: String(editingDebt.exchangeRateToUsd || "1"),
        reason:            editingDebt.reason || "",
        dateTaken:         editingDebt.dateTaken ? new Date(editingDebt.dateTaken).toISOString().split("T")[0] : "",
        dueDate:           editingDebt.dueDate ? new Date(editingDebt.dueDate).toISOString().split("T")[0] : "",
        interestRate:      String(editingDebt.interestRate || ""),
        status:            editingDebt.status || "active",
        paymentPlan:       editingDebt.paymentPlan || "Monthly",
        installmentAmount: String(editingDebt.installmentAmount || ""),
        notes:             editingDebt.notes || "",
      });
    } else {
      setForm(emptyDebtForm);
    }
  }, [editingDebt, open]);

  const valid = form.creditorName && form.originalAmount && form.remainingAmount && form.reason;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!valid) return;
    const data = {
      userId,
      creditorName:      form.creditorName,
      originalAmount:    form.originalAmount,
      remainingAmount:   form.remainingAmount,
      currency:          form.currency,
      exchangeRateToUsd: form.exchangeRateToUsd,
      reason:            form.reason,
      dateTaken:         new Date(form.dateTaken),
      dueDate:           form.dueDate ? new Date(form.dueDate) : undefined,
      interestRate:      form.interestRate || undefined,
      status:            form.status,
      paymentPlan:       form.paymentPlan || undefined,
      installmentAmount: form.installmentAmount || undefined,
      notes:             form.notes || undefined,
    };
    if (editingDebt) onUpdate({ id: editingDebt.id, ...data });
    else onCreate(data);
  };

  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDebt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Creditor Name</label>
              <Input placeholder="e.g. Toyota Financial, Bank ABC" value={form.creditorName} onChange={f("creditorName")} data-testid="input-creditor-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Original Amount</label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.originalAmount} onChange={f("originalAmount")} data-testid="input-original-amount" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Remaining Amount</label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.remainingAmount} onChange={f("remainingAmount")} data-testid="input-remaining-amount" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Reason / Purpose</label>
              <Input placeholder="e.g. Car loan, Credit card, Student loan" value={form.reason} onChange={f("reason")} data-testid="input-reason" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date Taken</label>
              <Input type="date" value={form.dateTaken} onChange={f("dateTaken")} data-testid="input-date-taken" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Due Date (optional)</label>
              <Input type="date" value={form.dueDate} onChange={f("dueDate")} data-testid="input-due-date" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Interest Rate % (APR)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.interestRate} onChange={f("interestRate")} data-testid="input-interest-rate" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Monthly Installment</label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.installmentAmount} onChange={f("installmentAmount")} data-testid="input-installment-amount" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid">Paid Off</SelectItem>
                  <SelectItem value="restructured">Restructured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Payment Plan</label>
              <Select value={form.paymentPlan} onValueChange={v => setForm(p => ({ ...p, paymentPlan: v }))}>
                <SelectTrigger data-testid="select-payment-plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CurrencyFields
            currencyCode={form.currency}
            exchangeRate={form.exchangeRateToUsd}
            onCurrencyChange={code => setForm(p => ({ ...p, currency: code }))}
            onExchangeRateChange={rate => setForm(p => ({ ...p, exchangeRateToUsd: rate }))}
            showUsdPreview={false}
          />
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
            <Textarea placeholder="Optional notes…" value={form.notes} onChange={f("notes")} rows={2} data-testid="input-notes" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={!valid || isPending} data-testid="button-submit-debt">
              {isPending ? "Saving…" : editingDebt ? "Update" : "Add Debt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── record payment dialog ── */
function PaymentDialog({ open, onOpenChange, debt, onSubmit, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  debt: any | null; onSubmit: (debtId: number, data: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
  useMemo(() => { setForm({ amount: debt?.installmentAmount ? String(debt.installmentAmount) : "", paymentDate: new Date().toISOString().split("T")[0], notes: "" }); }, [debt, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment — {debt?.creditorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Amount</label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} data-testid="input-payment-amount" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Payment Date</label>
            <Input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} data-testid="input-payment-date" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes (optional)</label>
            <Input placeholder="e.g. Bank transfer" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} data-testid="input-payment-notes" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" style={{ backgroundColor: BRAND }}
              disabled={!form.amount || isPending}
              onClick={() => debt && onSubmit(debt.id, form)}
              data-testid="button-submit-payment">
              {isPending ? "Saving…" : "Record Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── main page ── */
export default function DebtsPage() {
  const { user }   = useAuth();
  const { data: debts = [], isLoading } = useDebts();
  const createDebt        = useCreateDebt();
  const updateDebt        = useUpdateDebt();
  const deleteDebt        = useDeleteDebt();
  const createDebtPayment = useCreateDebtPayment();
  const { toast }  = useToast();
  const { formatAmount } = useCurrency();

  const allDebts = debts as any[];

  const [debtDialog,    setDebtDialog]    = useState(false);
  const [editingDebt,   setEditingDebt]   = useState<any | null>(null);
  const [payDialog,     setPayDialog]     = useState(false);
  const [payTarget,     setPayTarget]     = useState<any | null>(null);

  /* ── KPI stats ── */
  const activeDebts  = allDebts.filter(d => d.status === "active");
  const paidDebts    = allDebts.filter(d => d.status === "paid");
  const totalDebt    = activeDebts.reduce((s, d) => s + toUsd(Number(d.remainingAmount), Number(d.exchangeRateToUsd)), 0);
  const totalOrig    = activeDebts.reduce((s, d) => s + toUsd(Number(d.originalAmount), Number(d.exchangeRateToUsd)), 0);
  const totalPaid    = totalOrig - totalDebt;
  const avgRate      = activeDebts.length
    ? activeDebts.filter(d => Number(d.interestRate) > 0).reduce((s, d) => s + Number(d.interestRate), 0) / (activeDebts.filter(d => Number(d.interestRate) > 0).length || 1)
    : 0;

  /* debt-free estimate for all debts combined */
  const totalInstall = activeDebts.reduce((s, d) => s + (Number(d.installmentAmount) || 0), 0);
  const globalFreeDate = debtFreeDate(totalDebt, totalInstall);
  const globalMonths   = projectedMonths(totalDebt, totalInstall);

  /* handlers */
  const openCreate = () => { setEditingDebt(null); setDebtDialog(true); };
  const openEdit   = (d: any) => { setEditingDebt(d); setDebtDialog(true); };
  const openPay    = (d: any) => { setPayTarget(d); setPayDialog(true); };

  const handleCreate = async (data: any) => {
    try { await createDebt.mutateAsync(data); toast({ title: "Debt added" }); setDebtDialog(false); }
    catch { toast({ title: "Failed to add", variant: "destructive" }); }
  };

  const handleUpdate = async (data: any) => {
    try { await updateDebt.mutateAsync(data); toast({ title: "Debt updated" }); setDebtDialog(false); }
    catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this debt? This cannot be undone.")) return;
    try { await deleteDebt.mutateAsync(id); toast({ title: "Debt deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handlePayment = async (debtId: number, formData: any) => {
    const debt = allDebts.find(d => d.id === debtId);
    try {
      await createDebtPayment.mutateAsync({
        debtId,
        amount: formData.amount,
        currencyCode: debt?.currency || "USD",
        exchangeRateToUsd: debt?.exchangeRateToUsd || "1",
        paymentDate: new Date(formData.paymentDate),
        notes: formData.notes || undefined,
      });
      toast({ title: "Payment recorded" });
      setPayDialog(false);
    } catch { toast({ title: "Failed to record payment", variant: "destructive" }); }
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Debt Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track payments, crush debt faster, and save on interest.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={openCreate} className="gap-2 rounded-xl shadow-sm" style={{ backgroundColor: BRAND }} data-testid="button-add-debt">
              <Plus className="w-4 h-4" /> Add Debt
            </Button>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Debt"
            value={formatAmount(totalDebt)}
            sub={`Across ${activeDebts.length} active debt${activeDebts.length !== 1 ? "s" : ""}`}
            icon={DollarSign}
            color={DANGER}
            bg="#FEF2F2"
            trend={totalPaid > 0 ? `${formatAmount(totalPaid)} paid off` : undefined}
            trendUp={false}
          />
          <KpiCard
            label="Active Debts"
            value={String(activeDebts.length)}
            sub={paidDebts.length > 0 ? `${paidDebts.length} paid off 🎉` : "Keep going!"}
            icon={AlertTriangle}
            color={AMBER}
            bg="#FFFBEB"
          />
          <KpiCard
            label="Debt-Free Date"
            value={globalFreeDate ? format(globalFreeDate, "MMM yyyy") : "—"}
            sub={globalMonths ? `${globalMonths} months remaining` : "Set installment amounts"}
            icon={Flag}
            color="#10B981"
            bg="#ECFDF5"
            trend={globalMonths ? `At current pace` : undefined}
            trendUp={true}
          />
          <KpiCard
            label="Avg Interest Rate"
            value={avgRate > 0 ? `${avgRate.toFixed(1)}%` : "0%"}
            sub={avgRate > 10 ? "⚠ High-interest debt — prioritize payoff" : avgRate > 0 ? "Moderate — manageable" : "Interest-free 🎉"}
            icon={Percent}
            color={PURPLE}
            bg="#F5F3FF"
          />
        </div>

        {/* ── JOURNEY BAR (only when there are debts) ── */}
        {allDebts.length > 0 && <JourneyBar debts={allDebts} />}

        {/* ── EMPTY STATE ── */}
        {allDebts.length === 0 ? (
          <Card className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <CardContent className="p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F0FDF9" }}>
                <CheckCircle className="w-8 h-8" style={{ color: MINT }} />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-xl">You're debt-free! 🎉</p>
                <p className="text-sm text-gray-400 mt-1">Keep it that way. You can also track any debt to stay on top of it.</p>
              </div>
              <Button onClick={openCreate} className="gap-2 rounded-xl mt-2" style={{ backgroundColor: BRAND }}>
                <Plus className="w-4 h-4" /> Track a Debt
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ── TWO-COLUMN LAYOUT ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: debt cards — 2/3 */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                  Your Debts
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({activeDebts.length} active · {paidDebts.length} paid off)
                  </span>
                </h2>
              </div>

              {allDebts.map((debt: any) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onEdit={() => openEdit(debt)}
                  onDelete={() => handleDelete(debt.id)}
                  onRecordPayment={() => openPay(debt)}
                />
              ))}

              {/* ghost add card */}
              <button
                onClick={openCreate}
                className="w-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 py-8 text-gray-400 hover:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all"
                data-testid="button-add-ghost">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Another Debt</span>
              </button>
            </div>

            {/* RIGHT: smart sidebar — 1/3 */}
            <div className="space-y-4">

              {/* payoff strategy card */}
              <Card className="border border-blue-100 dark:border-blue-900/30 rounded-2xl overflow-hidden">
                <CardContent className="p-4" style={{ background: "linear-gradient(135deg, #EEF4FF, #F5F3FF)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Payoff Strategy</span>
                  </div>
                  {(() => {
                    const highInt = [...activeDebts].sort((a, b) => Number(b.interestRate) - Number(a.interestRate))[0];
                    const smallest = [...activeDebts].sort((a, b) => Number(a.remainingAmount) - Number(b.remainingAmount))[0];
                    return (
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                        {highInt && Number(highInt.interestRate) > 0 ? (
                          <>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">🔥 Avalanche: Attack highest APR first</p>
                            <p>Focus extra payments on <strong>{highInt.creditorName}</strong> ({Number(highInt.interestRate).toFixed(1)}% APR) to minimize interest paid.</p>
                          </>
                        ) : smallest ? (
                          <>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">⛄ Snowball: Knock out smallest first</p>
                            <p>Eliminate <strong>{smallest.creditorName}</strong> ({getCurrencySymbol(smallest.currency)}{Number(smallest.remainingAmount).toLocaleString()}) first for momentum.</p>
                          </>
                        ) : (
                          <p>All your debts are interest-free. Focus on smallest balance first for quick wins!</p>
                        )}
                        {/* mini priority list */}
                        <div className="space-y-1.5 mt-3">
                          {activeDebts.slice(0, 3).map((d, i) => {
                            const pct = Number(d.originalAmount) > 0 ? ((Number(d.originalAmount) - Number(d.remainingAmount)) / Number(d.originalAmount)) * 100 : 0;
                            return (
                              <div key={d.id} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold w-4 text-center" style={{ color: i === 0 ? DANGER : i === 1 ? AMBER : BRAND }}>
                                  {i + 1}
                                </span>
                                <div className="flex-1">
                                  <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{d.creditorName}</span>
                                    <span className="text-gray-400">{pct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: i === 0 ? DANGER : i === 1 ? AMBER : BRAND }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* upcoming payments */}
              <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Upcoming Payments</span>
                  </div>
                  <div className="space-y-2">
                    {activeDebts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No active debts</p>
                    ) : (
                      activeDebts.slice(0, 5).map((d, i) => {
                        const cat = debtCategory(d.reason || "");
                        const install = Number(d.installmentAmount);
                        return (
                          <div key={d.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                                <cat.icon className="w-3 h-3" style={{ color: cat.color }} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{d.creditorName}</p>
                                {d.dueDate && <p className="text-[10px] text-gray-400">{format(new Date(d.dueDate), "MMM d")}</p>}
                              </div>
                            </div>
                            <span className="text-xs font-bold tabular-nums" style={{ color: DANGER }}>
                              {install > 0 ? `${getCurrencySymbol(d.currency)}${install.toLocaleString()}` : "—"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {activeDebts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between text-xs">
                      <span className="text-gray-400">Total this period</span>
                      <span className="font-bold" style={{ color: DANGER }}>
                        {formatAmount(activeDebts.reduce((s, d) => s + (Number(d.installmentAmount) || 0), 0))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* extra payment calculator */}
              <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
                <CardContent className="p-4">
                  <ExtraPaymentCalculator debts={activeDebts} />
                </CardContent>
              </Card>

              {/* AI debt coach teaser */}
              <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
                <CardContent className="p-4" style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF4FF)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: PURPLE }} />
                    <span className="font-semibold text-sm text-gray-900">AI Debt Coach</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {avgRate > 0
                      ? `Your highest-interest debt is ${avgRate.toFixed(1)}% APR. Prioritizing it could save you hundreds in interest.`
                      : "Add an interest rate to your debts to unlock personalized payoff recommendations."}
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl gap-1.5 border-purple-200 dark:border-purple-700"
                    style={{ color: PURPLE }}
                    onClick={() => (window.location.href = "/ai-reports")}
                    data-testid="button-ai-coach">
                    Get Full Analysis <ChevronRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

      </div>

      {/* ── dialogs ── */}
      <DebtDialog
        open={debtDialog}
        onOpenChange={setDebtDialog}
        editingDebt={editingDebt}
        userId={user?.id ?? ""}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isPending={createDebt.isPending || updateDebt.isPending}
      />
      <PaymentDialog
        open={payDialog}
        onOpenChange={setPayDialog}
        debt={payTarget}
        onSubmit={handlePayment}
        isPending={createDebtPayment.isPending}
      />
    </Layout>
  );
}

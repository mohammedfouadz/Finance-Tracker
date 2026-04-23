import { useState, useMemo, forwardRef } from "react";
import { Layout } from "@/components/layout-sidebar";
import {
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useGoalContributions, useCreateGoalContribution,
} from "@/hooks/use-finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema } from "@shared/schema";
import { useCurrency, toUsd } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";
import { useAuth } from "@/hooks/use-auth";
import { format, differenceInMonths, differenceInDays, isPast } from "date-fns";
import {
  Plus, Target, Calendar, MoreHorizontal, ChevronDown, ChevronUp,
  Trash2, Car, Home, Briefcase, Plane, GraduationCap, Laptop,
  HeartPulse, Landmark, Star, TrendingUp, CheckCircle, Edit3,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip, XAxis,
} from "recharts";
import { z } from "zod";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const DANGER = "#EF4444";

/* ── category detection ── */
type CatKey = "vehicle"|"home"|"travel"|"emergency"|"education"|"tech"|"health"|"savings"|"business"|"other";

const CAT_MAP: Record<CatKey, { icon: any; label: string; color: string; bg: string; darkBg: string }> = {
  vehicle:   { icon: Car,           label: "Vehicle",   color: "#1B4FE4", bg: "#EEF4FF",  darkBg: "#1e3a6e" },
  home:      { icon: Home,          label: "Home",      color: "#10B981", bg: "#ECFDF5",  darkBg: "#134e3c" },
  travel:    { icon: Plane,         label: "Travel",    color: "#8B5CF6", bg: "#F5F3FF",  darkBg: "#2e1e5e" },
  emergency: { icon: HeartPulse,    label: "Emergency", color: "#EF4444", bg: "#FEF2F2",  darkBg: "#4a1a1a" },
  education: { icon: GraduationCap, label: "Education", color: "#F59E0B", bg: "#FFFBEB",  darkBg: "#3d2e00" },
  tech:      { icon: Laptop,        label: "Tech",      color: "#06B6D4", bg: "#ECFEFF",  darkBg: "#0a3340" },
  health:    { icon: HeartPulse,    label: "Health",    color: "#EC4899", bg: "#FDF2F8",  darkBg: "#420028" },
  savings:   { icon: Landmark,      label: "Savings",   color: "#10B981", bg: "#ECFDF5",  darkBg: "#134e3c" },
  business:  { icon: Briefcase,     label: "Business",  color: "#6366F1", bg: "#EEF2FF",  darkBg: "#1e1e5e" },
  other:     { icon: Star,          label: "Goal",      color: "#64748B", bg: "#F1F5F9",  darkBg: "#1e293b" },
};

function detectCat(name: string): CatKey {
  const n = name.toLowerCase();
  if (/car|vehicle|auto|truck|motor|bike/.test(n))              return "vehicle";
  if (/home|house|property|real estate|down payment|apart|flat/.test(n)) return "home";
  if (/travel|trip|vacation|hajj|umrah|holiday|flight/.test(n)) return "travel";
  if (/emergency|fund|safety|reserve|buffer/.test(n))           return "emergency";
  if (/educat|school|college|univer|tuition|kids|children/.test(n)) return "education";
  if (/laptop|mac|computer|tech|phone|device|gadget/.test(n))   return "tech";
  if (/health|medical|hospital|insurance/.test(n))              return "health";
  if (/saving|invest|retirement|pension/.test(n))               return "savings";
  if (/business|startup|company|shop/.test(n))                  return "business";
  return "other";
}

/* ── circular progress ring ── */
function Ring({ pct, size = 76, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(pct, 100) / 100) * circ;
  const col  = pct >= 75 ? MINT : pct >= 25 ? AMBER : DANGER;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none" className="dark:stroke-gray-700" />
        <circle cx={size/2} cy={size/2} r={r} stroke={col} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tabular-nums" style={{ color: col }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

/* ── contributions history panel ── */
function ContribPanel({ goalId }: { goalId: number }) {
  const { data: raw = [] } = useGoalContributions(goalId);
  const { formatAmount }   = useCurrency();
  const contribs = raw as any[];

  const chartData = useMemo(() => {
    let cum = 0;
    return [...contribs]
      .sort((a, b) => new Date(a.contributionDate).getTime() - new Date(b.contributionDate).getTime())
      .map(c => {
        cum += toUsd(Number(c.amount), Number(c.exchangeRateToUsd));
        return { date: format(new Date(c.contributionDate), "MMM d"), v: cum };
      });
  }, [contribs]);

  const sorted = [...contribs].sort(
    (a, b) => new Date(b.contributionDate).getTime() - new Date(a.contributionDate).getTime()
  );

  if (sorted.length === 0)
    return <p className="text-xs text-gray-400 py-1">No contributions yet.</p>;

  return (
    <div className="space-y-3">
      {chartData.length > 1 && (
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`cg${goalId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <ReTooltip formatter={(v: any) => formatAmount(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="v" stroke={BRAND} fill={`url(#cg${goalId})`} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
        {sorted.slice(0, 5).map((c: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
              <span className="text-gray-500 dark:text-gray-400">{format(new Date(c.contributionDate), "MMM d, yyyy")}</span>
              {c.notes && <span className="text-gray-400 truncate max-w-[100px]">· {c.notes}</span>}
            </div>
            <span className="font-semibold" style={{ color: MINT }}>+{formatAmount(toUsd(Number(c.amount), Number(c.exchangeRateToUsd)))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── inline contribution form ── */
function ContribForm({ goal, onDone }: { goal: any; onDone: () => void }) {
  const create = useCreateGoalContribution();
  const [amt, setAmt]   = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    if (!amt || Number(amt) <= 0) return;
    await create.mutateAsync({
      goalId: goal.id,
      amount: amt,
      currencyCode:       goal.currencyCode     || "USD",
      exchangeRateToUsd:  goal.exchangeRateToUsd || "1",
      contributionDate:   new Date(),
      notes: note || undefined,
    });
    setAmt(""); setNote(""); onDone();
  };

  return (
    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Contribution</p>
      <div className="flex gap-2">
        <Input type="number" placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)}
          className="h-8 text-xs flex-1" data-testid={`input-contribution-amount-${goal.id}`} />
        <Input placeholder="Notes (optional)" value={note} onChange={e => setNote(e.target.value)}
          className="h-8 text-xs flex-1" data-testid={`input-contribution-notes-${goal.id}`} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs" onClick={submit}
          disabled={create.isPending || !amt}
          style={{ backgroundColor: BRAND }}
          data-testid={`button-submit-contribution-${goal.id}`}>
          {create.isPending ? "Saving…" : "Submit"}
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs px-3" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

/* ── goal form schema ── */
const formSchema = insertGoalSchema.extend({
  targetAmount:      z.string().refine(v => Number(v) > 0,  "Must be positive"),
  currentAmount:     z.string().refine(v => Number(v) >= 0, "Must be non-negative"),
  deadline:          z.string().optional(),
  currencyCode:      z.string().default("USD"),
  exchangeRateToUsd: z.string().default("1"),
});
type FormValues = z.infer<typeof formSchema>;

/* ── add / edit goal dialog ── */
function GoalFormDialog({ trigger, initial, onSave }: {
  trigger: React.ReactNode;
  initial?: Partial<FormValues>;
  onSave: (v: FormValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: user?.id ?? "", name: "", targetAmount: "", currentAmount: "0", currencyCode: "USD", exchangeRateToUsd: "1", ...initial },
  });

  const onSubmit = async (v: FormValues) => { await onSave(v); setOpen(false); form.reset(); };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) form.reset({ userId: user?.id ?? "", ...initial }); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.name ? "Edit Goal" : "New Financial Goal"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Name</FormLabel>
                <FormControl><Input placeholder="e.g. Dream Home, Vacation…" {...field} data-testid="input-goal-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="targetAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl><Input type="number" placeholder="10000" {...field} data-testid="input-target-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currentAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Amount</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} data-testid="input-current-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <CurrencyFields
              currencyCode={form.watch("currencyCode")}
              exchangeRate={form.watch("exchangeRateToUsd")}
              amount={form.watch("targetAmount")}
              onCurrencyChange={code => form.setValue("currencyCode", code)}
              onExchangeRateChange={rate => form.setValue("exchangeRateToUsd", rate)}
            />
            <FormField control={form.control} name="deadline" render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                <FormControl><Input type="date" {...field} data-testid="input-goal-deadline" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" style={{ backgroundColor: BRAND }} data-testid="button-save-goal">
              {initial?.name ? "Save Changes" : "Create Goal"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ── single goal card ── */
function GoalCard({ goal, onEdit }: { goal: any; onEdit: () => void }) {
  const { formatAmount } = useCurrency();
  const deleteGoal       = useDeleteGoal();
  const updateGoal       = useUpdateGoal();
  const { user }         = useAuth();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [contributing, setContributing] = useState(false);
  const [expanded,     setExpanded]     = useState(false);

  const curUsd    = toUsd(Number(goal.currentAmount), Number(goal.exchangeRateToUsd));
  const targetUsd = toUsd(Number(goal.targetAmount),  Number(goal.exchangeRateToUsd));
  const pct       = targetUsd > 0 ? Math.min((curUsd / targetUsd) * 100, 100) : 0;
  const remaining = Math.max(targetUsd - curUsd, 0);

  const isCompleted = goal.status === "completed" || pct >= 100;
  const monthsLeft  = goal.deadline
    ? Math.max(differenceInMonths(new Date(goal.deadline), new Date()), 0)
    : null;
  const daysOverdue = goal.deadline && isPast(new Date(goal.deadline)) && !isCompleted
    ? differenceInDays(new Date(), new Date(goal.deadline))
    : 0;

  const cat    = detectCat(goal.name);
  const meta   = CAT_MAP[cat];
  const CatIcon = meta.icon;

  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
      data-testid={`card-goal-${goal.id}`}>
      <CardContent className="p-5 space-y-4">

        {/* ── top row: icon + category tag + menu ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
              <CatIcon className="w-5 h-5" style={{ color: meta.color }} />
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                style={{ backgroundColor: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
              {isCompleted  && <Badge className="text-xs py-0 h-4 w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">Completed ✓</Badge>}
              {daysOverdue > 0 && <Badge variant="destructive" className="text-xs py-0 h-4 w-fit border-0">Overdue {daysOverdue}d</Badge>}
            </div>
          </div>

          {/* three-dot menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              data-testid={`button-menu-goal-${goal.id}`}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl py-1 w-36"
                onMouseLeave={() => setMenuOpen(false)}>
                <GoalFormDialog
                  trigger={
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMenuOpen(false)}>
                      <Edit3 className="w-3.5 h-3.5" /> Edit Goal
                    </button>
                  }
                  initial={{
                    userId: user?.id ?? "",
                    name: goal.name,
                    targetAmount: String(goal.targetAmount),
                    currentAmount: String(goal.currentAmount),
                    currencyCode: goal.currencyCode,
                    exchangeRateToUsd: String(goal.exchangeRateToUsd),
                    deadline: goal.deadline ? goal.deadline.split("T")[0] : undefined,
                  }}
                  onSave={async v => { await updateGoal.mutateAsync({ id: goal.id, ...v }); setMenuOpen(false); }}
                />
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => { if (confirm("Delete this goal?")) deleteGoal.mutate(goal.id); setMenuOpen(false); }}
                  data-testid={`button-delete-goal-${goal.id}`}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── title + date + ring ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug" data-testid={`text-goal-name-${goal.id}`}>
              {goal.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />
              {goal.deadline
                ? <span>{format(new Date(goal.deadline), "MMM d, yyyy")}{monthsLeft !== null && monthsLeft > 0 && <span className="ml-1 text-gray-300">· {monthsLeft}mo</span>}</span>
                : <span className="italic">No deadline</span>
              }
            </div>
          </div>
          <Ring pct={pct} />
        </div>

        {/* ── amount row ── */}
        <div className="flex items-center gap-3 py-2.5 border-y border-gray-50 dark:border-gray-800">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Saved</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatAmount(curUsd)}</p>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Target</p>
            <p className="text-base font-bold tabular-nums" style={{ color: MINT }}>{formatAmount(targetUsd)}</p>
          </div>
        </div>

        {/* ── gradient progress bar ── */}
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${BRAND}, ${MINT})` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatAmount(remaining)} left</span>
            {isCompleted
              ? <span className="font-medium" style={{ color: MINT }}>Goal reached 🎉</span>
              : monthsLeft !== null && monthsLeft > 0
                ? <span>{monthsLeft} months remaining</span>
                : null
            }
          </div>
        </div>

        {/* ── footer buttons ── */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { setContributing(c => !c); setExpanded(false); }}
            className="flex-1 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={contributing
              ? { backgroundColor: BRAND, borderColor: BRAND, color: "#fff" }
              : { borderColor: BRAND, color: BRAND }}
            data-testid={`button-contribute-${goal.id}`}>
            <Plus className="w-3.5 h-3.5" /> Add Contribution
          </button>
          <button
            onClick={() => { setExpanded(e => !e); setContributing(false); }}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 dark:hover:border-blue-700 transition-all"
            data-testid={`button-expand-${goal.id}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* ── contribution form ── */}
        {contributing && <ContribForm goal={goal} onDone={() => setContributing(false)} />}

        {/* ── expanded history ── */}
        {expanded && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contribution History</p>
            <ContribPanel goalId={goal.id} />
          </div>
        )}

      </CardContent>
    </Card>
  );
}

/* ── summary KPI strip ── */
function SummaryStrip({ goals }: { goals: any[] }) {
  const { formatAmount } = useCurrency();
  const active       = goals.filter(g => g.status !== "completed");
  const totalTarget  = active.reduce((s, g) => s + toUsd(Number(g.targetAmount),  Number(g.exchangeRateToUsd)), 0);
  const totalSaved   = active.reduce((s, g) => s + toUsd(Number(g.currentAmount), Number(g.exchangeRateToUsd)), 0);
  const avgPct       = active.length > 0
    ? active.reduce((s, g) => s + Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100), 0) / active.length
    : 0;
  const completedCnt = goals.filter(g => g.status === "completed" || Number(g.currentAmount) >= Number(g.targetAmount)).length;

  const cards = [
    { label: "Total Goals",   val: goals.length,    fmt: (v: any) => String(v),          color: BRAND,  bg: "#EEF4FF", Icon: Target },
    { label: "Total Target",  val: totalTarget,     fmt: formatAmount,                   color: MINT,   bg: "#ECFDF5", Icon: TrendingUp },
    { label: "Total Saved",   val: totalSaved,      fmt: formatAmount,                   color: MINT,   bg: "#ECFDF5", Icon: CheckCircle },
    { label: "Avg Progress",  val: avgPct,          fmt: (v: any) => `${v.toFixed(1)}%`, color: AMBER,  bg: "#FFFBEB", Icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, val, fmt, color, bg, Icon }, i) => (
        <Card key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          <CardContent className="p-5" style={{ background: `linear-gradient(135deg, ${bg}22, transparent)` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>{fmt(val)}</p>
            {i === 2 && totalTarget > 0 && (
              <p className="text-xs text-gray-400 mt-1">{((totalSaved / totalTarget) * 100).toFixed(0)}% of total target</p>
            )}
            {i === 0 && completedCnt > 0 && (
              <p className="text-xs text-gray-400 mt-1">{completedCnt} completed</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── empty / add card ── */
const AddCard = forwardRef<HTMLButtonElement, { onAdd?: () => void }>(
  function AddCard({ onAdd, ...props }, ref) {
    return (
      <button ref={ref} onClick={onAdd} {...props}
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-300 hover:text-blue-500 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all w-full min-h-[300px] group"
        data-testid="button-empty-add-goal">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 flex items-center justify-center transition-colors">
          <Plus className="w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Start a new goal</p>
          <p className="text-xs mt-0.5 text-gray-300 dark:text-gray-600">Click to set a new financial target</p>
        </div>
      </button>
    );
  }
);

/* ── main page ── */
export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const { user }   = useAuth();

  const [filter, setFilter] = useState<"all"|"active"|"completed"|"overdue">("all");
  const [sort,   setSort]   = useState<"deadline"|"progress"|"amount">("deadline");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const allGoals = goals as any[];

  const overdueCount = allGoals.filter(
    g => g.deadline && isPast(new Date(g.deadline)) && Number(g.currentAmount) < Number(g.targetAmount)
  ).length;

  const filtered = useMemo(() => {
    let list = [...allGoals];
    if (filter === "active")    list = list.filter(g => g.status !== "completed" && Number(g.currentAmount) < Number(g.targetAmount));
    if (filter === "completed") list = list.filter(g => g.status === "completed" || Number(g.currentAmount) >= Number(g.targetAmount));
    if (filter === "overdue")   list = list.filter(g => g.deadline && isPast(new Date(g.deadline)) && Number(g.currentAmount) < Number(g.targetAmount));
    if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sort === "deadline") {
        if (!a.deadline) return 1; if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sort === "progress") {
        return (Number(b.currentAmount) / Number(b.targetAmount)) - (Number(a.currentAmount) / Number(a.targetAmount));
      }
      return toUsd(Number(b.targetAmount), Number(b.exchangeRateToUsd)) -
             toUsd(Number(a.targetAmount), Number(a.exchangeRateToUsd));
    });
    return list;
  }, [allGoals, filter, sort, search]);

  const handleCreate = async (v: any) => { await createGoal.mutateAsync({ ...v, userId: user!.id }); };

  const FILTERS: [typeof filter, string][] = [
    ["all","All"], ["active","Active"], ["completed","Completed"], ["overdue","Overdue"],
  ];

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

        {/* ── header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Financial Goals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your progress towards your dreams.</p>
          </div>
          <GoalFormDialog
            trigger={
              <Button className="gap-2 rounded-xl shadow-md shadow-blue-100 dark:shadow-blue-900/20 self-start sm:self-auto"
                style={{ backgroundColor: BRAND }} data-testid="button-add-goal">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            }
            onSave={handleCreate}
          />
        </div>

        {/* ── summary strip ── */}
        {allGoals.length > 0 && <SummaryStrip goals={allGoals} />}

        {/* ── filter / sort bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* segmented tabs */}
          <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {FILTERS.map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                style={filter === key ? { backgroundColor: BRAND, color: "#fff" } : { color: "#64748B" }}
                data-testid={`filter-${key}`}>
                {label}
                {key === "overdue" && overdueCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] inline-flex items-center justify-center font-bold">
                    {overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* search + sort */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input placeholder="Search goals…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                data-testid="input-search-goals" />
            </div>
            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger className="h-9 text-xs w-40 rounded-xl border-gray-200 dark:border-gray-700" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Sort: Deadline</SelectItem>
                <SelectItem value="progress">Sort: Progress</SelectItem>
                <SelectItem value="amount">Sort: Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── goals grid ── */}
        {allGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Target className="w-9 h-9 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">No goals yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first financial goal to start tracking your progress.</p>
            </div>
            <GoalFormDialog
              trigger={
                <Button className="gap-2 mt-2" style={{ backgroundColor: BRAND }} data-testid="button-first-goal">
                  <Plus className="w-4 h-4" /> Create First Goal
                </Button>
              }
              onSave={handleCreate}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((goal: any) => (
              <GoalCard key={goal.id} goal={goal} onEdit={() => {}} />
            ))}
            <GoalFormDialog
              trigger={<AddCard onAdd={() => {}} />}
              onSave={handleCreate}
            />
          </div>
        )}

      </div>
    </Layout>
  );
}

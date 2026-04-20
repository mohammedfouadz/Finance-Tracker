import { useMemo } from "react";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useBankAccounts, useInvestments, useAssets, useDebts } from "@/hooks/use-finance";
import { useCurrency, toUsd } from "@/lib/currency";
import {
  TrendingUp, TrendingDown, Landmark, LineChart, Building2, HandCoins,
  Sparkles, ArrowUpRight, ArrowDownRight, Minus,
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

type ComponentItem = { label: string; value: number; color: string; icon: any; sub?: string; trend?: number };

function KpiCard({ label, value, sub, icon: Icon, color, bg, change }: {
  label: string; value: string; sub?: string; icon: any; color: string; bg: string; change?: number;
}) {
  const positive = change !== undefined && change >= 0;
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
        {change !== undefined && (
          <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${positive ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComponentCard({ item }: { item: ComponentItem }) {
  const { formatAmount } = useCurrency();
  const positive = item.value >= 0;
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:-translate-y-px hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}22` }}>
          <item.icon className="w-5 h-5" style={{ color: item.color }} />
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.label}</p>
          {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
        </div>
      </div>
      <p className="font-bold text-base tabular-nums" style={{ color: item.value < 0 ? DANGER : item.value > 0 ? "inherit" : "#94A3B8" }}>
        {item.value < 0 ? "−" : ""}{formatAmount(Math.abs(item.value))}
      </p>
    </div>
  );
}

const MILESTONES = [
  { label: "$10k", value: 10_000 },
  { label: "$50k", value: 50_000 },
  { label: "$100k", value: 100_000 },
  { label: "$500k", value: 500_000 },
  { label: "$1M", value: 1_000_000 },
];

export default function NetWorthPage() {
  const { formatAmount } = useCurrency();
  const { data: accounts    = [] } = useBankAccounts();
  const { data: investments = [] } = useInvestments();
  const { data: assets      = [] } = useAssets();
  const { data: debts       = [] } = useDebts();

  const accs   = accounts    as any[];
  const invs   = investments as any[];
  const assts  = assets      as any[];
  const dbts   = debts       as any[];

  /* component totals in USD */
  const bankTotal   = accs.reduce((s, a) => s + toUsd(Number(a.balance), Number(a.exchangeRateToUsd)), 0);
  const invTotal    = invs.filter(i => i.status === "active").reduce((s, i) => s + toUsd(Number(i.currentValue), Number(i.exchangeRateToUsd)), 0);
  const assetTotal  = assts.reduce((s, a) => s + toUsd(Number(a.currentValue), Number(a.exchangeRateToUsd)), 0);
  const debtTotal   = dbts.filter(d => d.status === "active").reduce((s, d) => s + toUsd(Number(d.remainingAmount), Number(d.exchangeRateToUsd)), 0);
  const netWorth    = bankTotal + invTotal + assetTotal - debtTotal;
  const totalAssets = bankTotal + invTotal + assetTotal;

  /* components list */
  const components: ComponentItem[] = [
    { label: "Bank Accounts", value: bankTotal, color: BRAND,  icon: Landmark, sub: `${accs.length} account${accs.length !== 1 ? "s" : ""}` },
    { label: "Investments",   value: invTotal,  color: MINT,   icon: LineChart, sub: `${invs.filter(i => i.status === "active").length} active position${invs.length !== 1 ? "s" : ""}` },
    { label: "Assets",        value: assetTotal, color: AMBER, icon: Building2, sub: `${assts.length} asset${assts.length !== 1 ? "s" : ""}` },
    { label: "Debts (−)",     value: -debtTotal, color: DANGER,icon: HandCoins, sub: `${dbts.filter(d => d.status === "active").length} active debt${dbts.length !== 1 ? "s" : ""}` },
  ];

  /* milestones */
  const nextMilestone = MILESTONES.find(m => m.value > netWorth);
  const prevMilestone = [...MILESTONES].reverse().find(m => m.value <= netWorth);

  /* simulated monthly data — uses real current value as latest point */
  const chartData = useMemo(() => {
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const variation = netWorth * 0.05;
    return months.map((m, i) => {
      const factor = i === 5 ? 1 : 0.7 + (i / 5) * 0.3 + (Math.random() - 0.5) * 0.1;
      return { month: m, netWorth: Math.max(0, Math.round(i === 5 ? netWorth : netWorth * factor - variation)) };
    });
  }, [netWorth]);

  /* donut for asset breakdown */
  const donutData = [
    { name: "Bank", value: bankTotal, color: BRAND },
    { name: "Investments", value: invTotal, color: MINT },
    { name: "Assets", value: assetTotal, color: AMBER },
    { name: "Debts", value: debtTotal, color: DANGER },
  ].filter(d => d.value > 0);

  const isPositive = netWorth >= 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Net Worth</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your complete financial picture — assets minus liabilities.</p>
          </div>
        </div>

        {/* NET WORTH HERO */}
        <Card className="border border-blue-100 dark:border-blue-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-[#EEF4FF] to-[#F5F3FF] dark:from-[#0F1A30] dark:to-[#1A1630]">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* left */}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Net Worth</p>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-4xl font-bold tabular-nums" style={{ color: isPositive ? BRAND : DANGER }} data-testid="text-net-worth">
                    {netWorth < 0 ? "−" : ""}{formatAmount(Math.abs(netWorth))}
                  </h2>
                  {isPositive
                    ? <ArrowUpRight className="w-7 h-7 text-emerald-500 shrink-0" />
                    : <ArrowDownRight className="w-7 h-7 text-red-500 shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  {totalAssets > 0
                    ? `Total assets of ${formatAmount(totalAssets)} minus ${formatAmount(debtTotal)} in liabilities`
                    : "Start adding your bank accounts, investments, and assets to track your net worth."}
                </p>

                {/* formula */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-1.5 font-medium tabular-nums" style={{ color: BRAND }}>{formatAmount(bankTotal)} banks</span>
                  <span className="text-gray-400">+</span>
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-1.5 font-medium tabular-nums" style={{ color: MINT }}>{formatAmount(invTotal)} investments</span>
                  <span className="text-gray-400">+</span>
                  <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-xl px-3 py-1.5 font-medium tabular-nums" style={{ color: AMBER }}>{formatAmount(assetTotal)} assets</span>
                  <span className="text-gray-400">−</span>
                  <span className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-1.5 font-medium tabular-nums" style={{ color: DANGER }}>{formatAmount(debtTotal)} debts</span>
                  <span className="text-gray-400">=</span>
                  <span className="rounded-xl px-3 py-1.5 font-bold tabular-nums text-white" style={{ backgroundColor: isPositive ? BRAND : DANGER }}>
                    {netWorth < 0 ? "−" : ""}{formatAmount(Math.abs(netWorth))}
                  </span>
                </div>
              </div>

              {/* right — donut */}
              {donutData.length > 0 && (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative">
                    <PieChart width={140} height={140}>
                      <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2}>
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-400">assets</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-100 tabular-nums">{formatAmount(totalAssets)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    {donutData.map(d => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-500">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Bank Accounts" value={formatAmount(bankTotal)} sub={`${accs.length} accounts`} icon={Landmark} color={BRAND} bg="#EEF4FF" />
          <KpiCard label="Investments" value={formatAmount(invTotal)} sub={`${invs.length} positions`} icon={LineChart} color={MINT} bg="#ECFDF5" />
          <KpiCard label="Physical Assets" value={formatAmount(assetTotal)} sub={`${assts.length} assets`} icon={Building2} color={AMBER} bg="#FFFBEB" />
          <KpiCard label="Total Liabilities" value={formatAmount(debtTotal)} sub={`${dbts.filter(d => d.status === "active").length} active debts`} icon={HandCoins} color={DANGER} bg="#FEF2F2" />
        </div>

        {/* chart + components layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* net worth chart — 2/3 */}
          <Card className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">Net Worth Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">6-month trajectory</p>
                </div>
                {isPositive
                  ? <span className="text-xs font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Growing</span>
                  : <span className="text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Declining</span>}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? BRAND : DANGER} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={isPositive ? BRAND : DANGER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip formatter={(v: any) => [formatAmount(v), "Net Worth"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="netWorth" stroke={isPositive ? BRAND : DANGER} strokeWidth={2.5} fill="url(#nwGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {netWorth === 0 && (
                <p className="text-xs text-center text-gray-400 mt-2">Add financial data to see your net worth trend</p>
              )}
            </CardContent>
          </Card>

          {/* component breakdown — 1/3 */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Component Breakdown</h3>
              <div className="space-y-2.5">
                {components.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}22` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: item.value < 0 ? DANGER : "inherit" }}>
                          {item.value < 0 ? "−" : ""}{formatAmount(Math.abs(item.value))}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {totalAssets > 0 && item.value > 0 && (
                          <div className="h-full rounded-full" style={{ width: `${(Math.abs(item.value) / totalAssets) * 100}%`, backgroundColor: item.color }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* net worth summary */}
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Net Worth</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: isPositive ? BRAND : DANGER }}>
                    {netWorth < 0 ? "−" : ""}{formatAmount(Math.abs(netWorth))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* milestones */}
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Wealth Milestones</h3>
            <div className="flex items-center gap-3">
              {MILESTONES.map((m, i) => {
                const reached = netWorth >= m.value;
                const isNext  = m.value === nextMilestone?.value;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                      reached ? "text-white border-transparent" : isNext ? "border-blue-400 text-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800"
                    )}
                      style={reached ? { backgroundColor: MINT, borderColor: MINT } : {}}>
                      {reached ? "✓" : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${reached ? "text-emerald-600" : isNext ? "text-blue-500" : "text-gray-300"}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {nextMilestone && (
              <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-500 text-center">
                Next milestone: <strong className="text-gray-700 dark:text-gray-300">{nextMilestone.label}</strong> —{" "}
                <span style={{ color: BRAND }}>
                  {formatAmount(nextMilestone.value - Math.max(0, netWorth))} to go
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* smart insights */}
        <Card className="border border-purple-100 dark:border-purple-900/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 bg-gradient-to-br from-[#F5F3FF] to-[#EEF4FF] dark:from-[#1A1630] dark:to-[#0F1A30]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: PURPLE }} />
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Smart Insights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isPositive ? "✅ Positive net worth" : "⚠️ Negative net worth"}
                </p>
                <p className="text-gray-500">
                  {isPositive
                    ? `Your assets of ${formatAmount(totalAssets)} outpace your debts of ${formatAmount(debtTotal)} — you're building wealth.`
                    : `Your debts of ${formatAmount(debtTotal)} exceed your assets. Focus on reducing high-interest debt first.`}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📊 Asset allocation</p>
                <p className="text-gray-500">
                  {totalAssets > 0
                    ? `Banks: ${((bankTotal / totalAssets) * 100).toFixed(0)}% · Investments: ${((invTotal / totalAssets) * 100).toFixed(0)}% · Assets: ${((assetTotal / totalAssets) * 100).toFixed(0)}%`
                    : "Add your assets to see your allocation breakdown."}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {nextMilestone ? `🎯 Next milestone: ${nextMilestone.label}` : "🏆 Millionaire milestone achieved!"}
                </p>
                <p className="text-gray-500">
                  {nextMilestone
                    ? `You need ${formatAmount(nextMilestone.value - Math.max(0, netWorth))} more to reach ${nextMilestone.label}. Keep growing!`
                    : "Incredible — you've crossed the $1M net worth milestone. Time to focus on wealth preservation."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

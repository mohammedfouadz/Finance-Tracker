import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Link } from "wouter";
import { Users, UserCheck, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { format } from "date-fns";

const BRAND = "#1B4FE4";
const MINT = "#00C896";
const LANGUAGE_LABELS: Record<string, string> = { en: "English", ar: "Arabic" };
const THEME_LABELS: Record<string, string> = { light: "Light", dark: "Dark" };

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  newThisMonth: number;
  topCurrencies: { currency: string; count: number }[];
  topLanguages: { language: string; count: number }[];
  topThemes: { theme: string; count: number }[];
}

interface GrowthPoint { date: string; newUsers: number; total: number; }

function StatCard({ label, value, icon, sub }: { label: string; value: number; icon: React.ReactNode; sub?: string }) {
  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <h3 className="text-2xl font-bold dark:text-white">{value.toLocaleString()}</h3>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className="p-3 rounded-xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A2744] border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AdminOverviewPage() {
  const { user } = useAuth();
  if (!(user as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });
  const { data: growth = [], isLoading: growthLoading } = useQuery<GrowthPoint[]>({ queryKey: ["/api/admin/stats/growth"] });

  const activeCount = stats?.activeUsers ?? 0;
  const inactiveCount = (stats?.totalUsers ?? 0) - activeCount;
  const pieData = [
    { name: "Active", value: activeCount, color: MINT },
    { name: "Inactive", value: inactiveCount, color: "#EF4444" },
  ];

  const growthThin = growth.filter((_, i) => i % 3 === 0 || i === growth.length - 1);

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" data-testid="text-admin-title">Admin Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">System overview and user analytics.</p>
        </div>
        <Link href="/admin/users">
          <button className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl text-white" style={{ backgroundColor: BRAND }}>
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div>
      ) : stats ? (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers} icon={<div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30"><Users className="w-5 h-5 text-blue-600" /></div>} sub="registered accounts" />
            <StatCard label="Active Users" value={stats.activeUsers} icon={<div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30"><UserCheck className="w-5 h-5 text-emerald-600" /></div>} sub={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total`} />
            <StatCard label="New This Week" value={stats.newThisWeek} icon={<div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30"><TrendingUp className="w-5 h-5 text-purple-600" /></div>} />
            <StatCard label="New This Month" value={stats.newThisMonth} icon={<div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30"><Calendar className="w-5 h-5 text-amber-600" /></div>} />
          </div>

          {/* Growth chart + Active/Inactive pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744] lg:col-span-2">
              <CardHeader><CardTitle className="text-sm font-semibold">User Growth — Last 30 Days</CardTitle></CardHeader>
              <CardContent>
                {growthLoading ? (
                  <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: BRAND }} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" tickFormatter={d => format(new Date(d), "MMM d")} tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="total" name="Total Users" stroke={BRAND} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newUsers" name="New Today" stroke={MINT} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-sm font-semibold">Active vs Inactive</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [v, n]} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold dark:text-white">{activeCount}</p>
                    <p className="text-[10px] text-gray-400">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold dark:text-white">{inactiveCount}</p>
                    <p className="text-[10px] text-gray-400">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New registrations bar chart */}
          {growth.length > 0 && (
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-sm font-semibold">Daily Registrations — Last 30 Days</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tickFormatter={d => format(new Date(d), "d")} tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="newUsers" name="New Users" fill={BRAND} radius={[2, 2, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Distribution cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-sm font-semibold">Top Currencies</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCurrencies.map(({ currency, count }) => (
                    <div key={currency} className="flex items-center gap-3" data-testid={`stat-currency-${currency}`}>
                      <span className="font-medium text-xs dark:text-white w-10">{currency}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%`, backgroundColor: BRAND }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                    </div>
                  ))}
                  {stats.topCurrencies.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-sm font-semibold">Languages</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topLanguages.map(({ language, count }) => (
                    <div key={language} className="flex items-center gap-3">
                      <span className="font-medium text-xs dark:text-white w-16">{LANGUAGE_LABELS[language] || language}</span>
                      <div className="flex-1 h-1.5 bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                    </div>
                  ))}
                  {stats.topLanguages.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
              <CardHeader><CardTitle className="text-sm font-semibold">Themes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topThemes.map(({ theme, count }) => (
                    <div key={theme} className="flex items-center gap-3">
                      <span className="font-medium text-xs dark:text-white w-10">{THEME_LABELS[theme] || theme}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gray-600 dark:bg-gray-300" style={{ width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                    </div>
                  ))}
                  {stats.topThemes.length === 0 && <p className="text-xs text-gray-400">No data</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

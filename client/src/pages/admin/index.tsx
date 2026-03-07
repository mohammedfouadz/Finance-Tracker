import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Users, UserCheck, TrendingUp, Calendar } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  newThisMonth: number;
  topCurrencies: { currency: string; count: number }[];
  topLanguages: { language: string; count: number }[];
  topThemes: { theme: string; count: number }[];
}

const LANGUAGE_LABELS: Record<string, string> = { en: "English", ar: "Arabic" };
const THEME_LABELS: Record<string, string> = { light: "Light", dark: "Dark" };

export default function AdminOverviewPage() {
  const { user } = useAuth();

  if (!(user as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data: stats, isLoading } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-admin-title">Admin Dashboard</h2>
        <p className="text-[#666666] dark:text-gray-400 mt-1">System overview and statistics.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1">Total Users</p>
                    <h3 className="text-2xl font-bold dark:text-white" data-testid="stat-total-users">{stats.totalUsers}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50"><Users className="w-6 h-6 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1">Active Users</p>
                    <h3 className="text-2xl font-bold dark:text-white" data-testid="stat-active-users">{stats.activeUsers}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50"><UserCheck className="w-6 h-6 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1">New This Week</p>
                    <h3 className="text-2xl font-bold dark:text-white" data-testid="stat-new-week">{stats.newThisWeek}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1">New This Month</p>
                    <h3 className="text-2xl font-bold dark:text-white" data-testid="stat-new-month">{stats.newThisMonth}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50"><Calendar className="w-6 h-6 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardHeader><CardTitle className="text-base">Top Currencies</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCurrencies.map(({ currency, count }) => (
                    <div key={currency} className="flex items-center justify-between" data-testid={`stat-currency-${currency}`}>
                      <span className="font-medium text-sm dark:text-white">{currency}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-primary/20 rounded-full overflow-hidden w-24">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#666] dark:text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  {stats.topCurrencies.length === 0 && <p className="text-sm text-[#999]">No data</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardHeader><CardTitle className="text-base">Languages</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topLanguages.map(({ language, count }) => (
                    <div key={language} className="flex items-center justify-between">
                      <span className="font-medium text-sm dark:text-white">{LANGUAGE_LABELS[language] || language}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden w-24">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#666] dark:text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  {stats.topLanguages.length === 0 && <p className="text-sm text-[#999]">No data</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardHeader><CardTitle className="text-base">Themes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topThemes.map(({ theme, count }) => (
                    <div key={theme} className="flex items-center justify-between">
                      <span className="font-medium text-sm dark:text-white">{THEME_LABELS[theme] || theme}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                          <div
                            className="h-full bg-gray-700 dark:bg-gray-300 rounded-full"
                            style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#666] dark:text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  {stats.topThemes.length === 0 && <p className="text-sm text-[#999]">No data</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

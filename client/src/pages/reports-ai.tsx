import { useState } from "react";
import { Layout } from "@/components/layout-sidebar";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Target, PiggyBank, Lightbulb, BarChart2,
  Star, DollarSign, ArrowUpRight, ArrowDownRight, Clock,
  Wallet, Receipt, ShieldCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface MonthlyAnalysis {
  summaryEn: string;
  summaryAr: string;
  totalIncome: number;
  totalExpenses: number;
  prevMonthIncome: number;
  prevMonthExpenses: number;
  savingsRate: number;
  biggestExpenseCategory: string;
  biggestExpenseAmount: number;
  incomeChange: number;
  expenseChange: number;
}

interface SpendingInsight {
  type: "success" | "warning" | "danger";
  messageEn: string;
  messageAr: string;
  icon: string;
}

interface AiAdvice {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: "savings" | "investment" | "spending" | "debt" | "goals";
  potentialSavings: number | null;
}

interface CategoryForecast {
  name: string;
  currentAmount: number;
  forecastAmount: number;
  trend: "up" | "down" | "stable";
}

interface Forecast {
  nextMonthTotalExpenses: number;
  confidence: "high" | "medium" | "low";
  messageEn: string;
  messageAr: string;
  categoryForecasts: CategoryForecast[];
}

interface ZakatReminder {
  applicable: boolean;
  totalWealth: number;
  zakatAmount: number;
  messageEn: string;
  messageAr: string;
}

interface AiReport {
  monthlyAnalysis: MonthlyAnalysis;
  spendingInsights: SpendingInsight[];
  aiAdvice: AiAdvice[];
  forecast: Forecast;
  zakatReminder: ZakatReminder;
  fromCache: boolean;
  generatedAt: string;
  cachedAt?: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const insightIcons: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert": AlertTriangle,
  "check": CheckCircle2,
  "target": Target,
  "piggy-bank": PiggyBank,
};

const adviceCategoryColors: Record<string, string> = {
  savings: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  investment: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  spending: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  debt: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  goals: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
};

const insightColors = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AiReportsPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [report, setReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: lang, forceRefresh }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReport(data as AiReport);
    } catch (e) {
      setError(isAr ? "فشل في إنشاء التقرير. حاول مجدداً." : "Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const m = report?.monthlyAnalysis;

  const forecastChartData = report?.forecast?.categoryForecasts?.map((c) => ({
    name: c.name,
    current: c.currentAmount,
    forecast: c.forecastAmount,
  })) ?? [];

  const confidenceColors = { high: "text-green-600", medium: "text-yellow-600", low: "text-red-600" };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold dark:text-white">
                {isAr ? "تقارير الذكاء الاصطناعي" : "AI Smart Reports"}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isAr
                ? "تحليل مالي شامل مدعوم بالذكاء الاصطناعي بناءً على بياناتك الفعلية"
                : "Comprehensive AI-powered financial analysis based on your actual data"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport(true)}
                disabled={loading}
                data-testid="button-refresh-report"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                {isAr ? "تحديث" : "Refresh"}
              </Button>
            )}
            <Button
              onClick={() => generateReport(false)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
              data-testid="button-generate-report"
            >
              <Sparkles className="w-4 h-4 me-2" />
              {loading ? (isAr ? "جارٍ التحليل..." : "Analyzing...") : (isAr ? "إنشاء التقرير" : "Generate Report")}
            </Button>
          </div>
        </div>

        {/* Cache indicator */}
        {report?.fromCache && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {isAr ? "تقرير محفوظ من" : "Cached report from"}{" "}
              {report.cachedAt ? new Date(report.cachedAt).toLocaleString(isAr ? "ar-SA" : "en-US") : ""}
              {" "}—{" "}
              {isAr ? "انقر تحديث لإعادة التوليد" : 'Click Refresh to regenerate'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <ReportSkeleton />}

        {/* Empty state */}
        {!loading && !report && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              {isAr ? "جاهز لتحليل أموالك" : "Ready to analyze your finances"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-sm">
              {isAr
                ? "انقر على زر 'إنشاء التقرير' للحصول على تحليل مالي شامل يشمل دخلك ومصروفاتك واستثماراتك وتوقعاتك للشهر القادم."
                : "Click 'Generate Report' to get a comprehensive financial analysis covering your income, expenses, investments, and next month's spending forecast."}
            </p>
            <Button
              onClick={() => generateReport(false)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              data-testid="button-generate-empty"
            >
              <Sparkles className="w-5 h-5 me-2" />
              {isAr ? "إنشاء التقرير الآن" : "Generate Report Now"}
            </Button>
          </div>
        )}

        {/* Report content */}
        {!loading && report && (
          <div className="space-y-6">

            {/* ── MONTHLY OVERVIEW STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: isAr ? "إجمالي الدخل" : "Total Income",
                  value: fmt(m?.totalIncome ?? 0),
                  change: m?.incomeChange ?? 0,
                  icon: Wallet,
                  color: "text-green-600",
                  bg: "bg-green-50 dark:bg-green-950/50",
                },
                {
                  label: isAr ? "إجمالي المصروفات" : "Total Expenses",
                  value: fmt(m?.totalExpenses ?? 0),
                  change: m?.expenseChange ?? 0,
                  icon: Receipt,
                  color: "text-red-500",
                  bg: "bg-red-50 dark:bg-red-950/50",
                  invertColor: true,
                },
                {
                  label: isAr ? "صافي الادخار" : "Net Savings",
                  value: fmt((m?.totalIncome ?? 0) - (m?.totalExpenses ?? 0)),
                  change: null,
                  icon: PiggyBank,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-950/50",
                },
                {
                  label: isAr ? "معدل الادخار" : "Savings Rate",
                  value: `${(m?.savingsRate ?? 0).toFixed(1)}%`,
                  change: null,
                  icon: Target,
                  color: (m?.savingsRate ?? 0) >= 20 ? "text-green-600" : (m?.savingsRate ?? 0) >= 10 ? "text-yellow-600" : "text-red-500",
                  bg: "bg-purple-50 dark:bg-purple-950/50",
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-gray-100 dark:border-gray-800" data-testid={`stat-${stat.label.replace(/\s/g, "-").toLowerCase()}`}>
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    {stat.change !== null && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${stat.invertColor ? (stat.change > 0 ? "text-red-500" : "text-green-600") : (stat.change > 0 ? "text-green-600" : "text-red-500")}`}>
                        {stat.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {pct(stat.change)} {isAr ? "عن الشهر السابق" : "vs last month"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── MONTHLY ANALYSIS SUMMARY ── */}
            <Card className="border-gray-100 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  {isAr ? "تحليل الشهر الحالي" : "Monthly Financial Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm" data-testid="text-monthly-summary">
                  {isAr ? m?.summaryAr : m?.summaryEn}
                </p>
                {m?.biggestExpenseCategory && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl px-3 py-1.5 text-xs font-medium">
                      <Receipt className="w-3.5 h-3.5" />
                      {isAr ? `أكبر فئة إنفاق: ${m.biggestExpenseCategory}` : `Biggest expense: ${m.biggestExpenseCategory}`}
                      {" — "}{fmt(m.biggestExpenseAmount)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── SPENDING INSIGHTS ── */}
            <div>
              <h2 className="text-lg font-bold mb-3 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                {isAr ? "رؤى الإنفاق الذكية" : "Smart Spending Insights"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.spendingInsights.map((insight, i) => {
                  const colors = insightColors[insight.type];
                  const IconComp = insightIcons[insight.icon] ?? CheckCircle2;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border} transition-all`}
                      data-testid={`insight-${i}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.type === "success" ? "bg-green-100 dark:bg-green-900" : insight.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900" : "bg-red-100 dark:bg-red-900"}`}>
                        <IconComp className={`w-4 h-4 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${colors.badge}`}>
                          {insight.type === "success" ? (isAr ? "جيد" : "Good") : insight.type === "warning" ? (isAr ? "تحذير" : "Warning") : (isAr ? "تنبيه" : "Alert")}
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {isAr ? insight.messageAr : insight.messageEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── AI ADVICE ── */}
            <div>
              <h2 className="text-lg font-bold mb-3 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                {isAr ? "نصائح مالية مخصصة" : "Personalized AI Financial Advice"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.aiAdvice.map((advice, i) => (
                  <Card key={i} className="border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors" data-testid={`advice-${i}`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-4 h-4 text-blue-500" />
                          </div>
                          <h3 className="font-semibold text-sm dark:text-white">
                            {isAr ? advice.titleAr : advice.titleEn}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${adviceCategoryColors[advice.category] || adviceCategoryColors.spending}`}>
                          {isAr ? (
                            advice.category === "savings" ? "ادخار" :
                            advice.category === "investment" ? "استثمار" :
                            advice.category === "spending" ? "إنفاق" :
                            advice.category === "debt" ? "ديون" : "أهداف"
                          ) : advice.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {isAr ? advice.descriptionAr : advice.descriptionEn}
                      </p>
                      {advice.potentialSavings && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                          <DollarSign className="w-3.5 h-3.5" />
                          {isAr ? `وفورات محتملة: ${fmt(advice.potentialSavings)}/شهر` : `Potential savings: ${fmt(advice.potentialSavings)}/month`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── SPENDING FORECAST ── */}
            <Card className="border-gray-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    {isAr ? "توقعات الشهر القادم" : "Next Month Spending Forecast"}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold dark:text-white">
                      {fmt(report.forecast?.nextMonthTotalExpenses ?? 0)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 ${confidenceColors[report.forecast?.confidence ?? "medium"]}`}>
                      {isAr ? (
                        report.forecast?.confidence === "high" ? "دقة عالية" :
                        report.forecast?.confidence === "medium" ? "دقة متوسطة" : "دقة منخفضة"
                      ) : `${report.forecast?.confidence} confidence`}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isAr ? report.forecast?.messageAr : report.forecast?.messageEn}
                </p>
              </CardHeader>
              <CardContent>
                {forecastChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={forecastChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: number) => [fmt(v), ""]} />
                      <Bar dataKey="current" name={isAr ? "الشهر الحالي" : "Current"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="forecast" name={isAr ? "التوقع" : "Forecast"} radius={[4, 4, 0, 0]}>
                        {forecastChartData.map((entry, index) => {
                          const fc = report.forecast.categoryForecasts[index];
                          return (
                            <Cell
                              key={index}
                              fill={fc?.trend === "up" ? "#ef4444" : fc?.trend === "down" ? "#22c55e" : "#8b5cf6"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {isAr ? "لا توجد بيانات كافية للتوقع" : "Not enough data for forecast"}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> {isAr ? "الشهر الحالي" : "Current month"}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> {isAr ? "توقع أعلى" : "Forecast up"}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> {isAr ? "توقع أقل" : "Forecast down"}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> {isAr ? "مستقر" : "Stable"}</span>
                </div>
              </CardContent>
            </Card>

            {/* ── ZAKAT REMINDER ── */}
            {report.zakatReminder?.applicable && (
              <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40" data-testid="card-zakat-reminder">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-300 text-base">
                          {isAr ? "تذكير الزكاة" : "Zakat Reminder"}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed mb-3">
                        {isAr ? report.zakatReminder.messageAr : report.zakatReminder.messageEn}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="bg-yellow-100 dark:bg-yellow-900/60 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2 text-sm">
                          <p className="text-xs text-yellow-600 dark:text-yellow-500">{isAr ? "إجمالي الثروة" : "Total Wealth"}</p>
                          <p className="font-bold text-yellow-800 dark:text-yellow-300">{fmt(report.zakatReminder.totalWealth)}</p>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-sm">
                          <p className="text-xs text-amber-600 dark:text-amber-500">{isAr ? "الزكاة المستحقة (2.5%)" : "Zakat Due (2.5%)"}</p>
                          <p className="font-bold text-amber-800 dark:text-amber-300">{fmt(report.zakatReminder.zakatAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer note */}
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
              {isAr
                ? `تم إنشاء هذا التقرير بواسطة الذكاء الاصطناعي بتاريخ ${new Date(report.generatedAt).toLocaleString("ar-SA")} — النتائج للأغراض الإعلامية فقط.`
                : `Report generated by AI on ${new Date(report.generatedAt).toLocaleString("en-US")} — results are for informational purposes only.`}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

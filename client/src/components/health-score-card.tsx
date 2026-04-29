import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useTransactions, useGoals } from "@/hooks/use-finance";
import { useQuery } from "@tanstack/react-query";
import { calculateFinancialHealth, type HealthScoreInput } from "@/lib/financial-health";
import { Heart, Lightbulb, Sparkles } from "lucide-react";
import { subDays, startOfMonth, endOfMonth } from "date-fns";

export function HealthScoreCard() {
  const { lang } = useI18n();
  const { data: transactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();

  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });
  const { data: investments = [] } = useQuery<any[]>({ queryKey: ["/api/investments"] });
  const { data: debts = [] } = useQuery<any[]>({ queryKey: ["/api/debts"] });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"] });

  const healthScore = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    const incomeCatIds = new Set(
      (categories as any[]).filter((c: any) => c.type === "income").map((c: any) => c.id)
    );
    const expenseCatIds = new Set(
      (categories as any[]).filter((c: any) => c.type === "expense").map((c: any) => c.id)
    );

    const thisMonthTx = (transactions as any[]).filter((t: any) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const monthlyIncome = thisMonthTx
      .filter((t: any) => incomeCatIds.has(t.categoryId))
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const monthlyExpenses = thisMonthTx
      .filter((t: any) => expenseCatIds.has(t.categoryId))
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const totalLiquidSavings = (bankAccounts as any[])
      .filter((b: any) => b.accountType !== "credit-card")
      .reduce((s: number, b: any) => s + Number(b.balance || 0), 0);

    const totalActiveDebts = (debts as any[])
      .filter((d: any) => d.status === "active")
      .reduce((s: number, d: any) => s + Number(d.remainingAmount || 0), 0);

    const totalInvestmentValue = (investments as any[]).reduce(
      (s: number, i: any) => s + Number(i.currentValue || i.purchasePrice || 0), 0
    );

    const investmentTypes = (investments as any[]).map((i: any) => i.assetType || i.type || "other");

    const transactionsLast30Days = (transactions as any[]).filter((t: any) =>
      new Date(t.date) >= thirtyDaysAgo
    ).length;

    const input: HealthScoreInput = {
      monthlyIncome,
      monthlyExpenses,
      totalLiquidSavings,
      totalActiveDebts,
      totalInvestmentValue,
      investmentTypes,
      transactionsLast30Days,
      hasGoals: (goals as any[]).filter((g: any) => g.status === "active").length > 0,
      hasBudget: (categories as any[]).some((c: any) => Number(c.allocationPercentage || c.allocationAmount || 0) > 0),
    };

    return calculateFinancialHealth(input);
  }, [transactions, goals, bankAccounts, investments, debts, categories]);

  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (healthScore.totalScore / 100) * circumference;

  const isAr = lang === "ar";

  const statusColor = (status: string) => {
    switch (status) {
      case "excellent": return "#1D9E75";
      case "good":      return "#1D9E75";
      case "warning":   return "#EF9F27";
      case "critical":  return "#E24B4A";
      default:          return "#888780";
    }
  };

  return (
    <Card
      className="overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-[#0F1729]"
      data-testid="card-health-score"
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {isAr ? "صحتك المالية" : "Your Financial Health"}
              </p>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                {isAr ? "Health Score" : "Health Score"}
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              </h3>
            </div>
          </div>
          <Badge
            className="text-xs shrink-0"
            style={{
              backgroundColor: `${healthScore.color}18`,
              color: healthScore.color,
              border: `1px solid ${healthScore.color}35`,
            }}
          >
            {isAr ? healthScore.ratingLabel.ar : healthScore.ratingLabel.en}
          </Badge>
        </div>

        {/* Score donut + Pillars */}
        <div className="flex items-center gap-6 mb-5">
          {/* Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="12"
                className="text-gray-300 dark:text-gray-700"
              />
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={healthScore.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-bold leading-none"
                style={{ color: healthScore.color }}
                data-testid="text-health-score-value"
              >
                {healthScore.totalScore}
              </span>
              <span className="text-xs text-gray-400 mt-1">/ 100</span>
            </div>
          </div>

          {/* Pillars */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {healthScore.pillars.map((pillar) => (
              <div key={pillar.key} data-testid={`pillar-${pillar.key}`}>
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                    {isAr ? pillar.label.ar : pillar.label.en}
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: statusColor(pillar.status) }}>
                    {pillar.value}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(pillar.score / pillar.maxScore) * 100}%`,
                      backgroundColor: statusColor(pillar.status),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommendation */}
        <div className="rounded-xl p-3.5 flex gap-2.5 items-start bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
              {isAr ? "توصية اليوم" : "Today's Tip"}
            </p>
            <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              {isAr ? healthScore.topRecommendation.ar : healthScore.topRecommendation.en}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

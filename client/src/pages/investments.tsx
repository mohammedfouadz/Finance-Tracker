import { Layout } from "@/components/layout-sidebar";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export default function InvestmentsPage() {
  const { data: transactions, isLoading: isTransLoading } = useTransactions();
  const { data: categories, isLoading: isCatLoading } = useCategories();

  if (isTransLoading || isCatLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const investmentTransactions = transactions?.filter(t => 
    categories?.find(c => c.id === t.categoryId)?.type === 'investment'
  ) || [];

  const totalInvested = investmentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Investments</h2>
        <p className="text-muted-foreground">Grow your wealth over time.</p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Invested</p>
              <h3 className="text-3xl font-bold">{formatCurrency(totalInvested)}</h3>
            </div>
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {investmentTransactions.map((t) => (
          <Card key={t.id} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {categories?.find(c => c.id === t.categoryId)?.name}
                </p>
              </div>
              <span className="font-bold">{formatCurrency(t.amount)}</span>
            </CardContent>
          </Card>
        ))}
        {investmentTransactions.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No investment records found.</p>
        )}
      </div>
    </Layout>
  );
}

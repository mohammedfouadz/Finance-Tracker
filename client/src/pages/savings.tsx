import { Layout } from "@/components/layout-sidebar";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";

export default function SavingsPage() {
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

  const savingsTransactions = transactions?.filter(t => 
    categories?.find(c => c.id === t.categoryId)?.type === 'savings'
  ) || [];

  const totalSaved = savingsTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Bank Savings</h2>
        <p className="text-muted-foreground">Secure your financial future.</p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="border-none shadow-sm bg-success/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Savings</p>
              <h3 className="text-3xl font-bold">{formatCurrency(totalSaved)}</h3>
            </div>
            <div className="p-4 rounded-full bg-success/10 text-success">
              <PiggyBank className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {savingsTransactions.map((t) => (
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
        {savingsTransactions.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No savings records found.</p>
        )}
      </div>
    </Layout>
  );
}

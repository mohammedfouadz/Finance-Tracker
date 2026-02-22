import { Layout } from "@/components/layout-sidebar";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowUp } from "lucide-react";

export default function IncomePage() {
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

  const incomeTransactions = transactions?.filter(t => 
    categories?.find(c => c.id === t.categoryId)?.type === 'income'
  ) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Income</h2>
        <p className="text-muted-foreground">Track and manage your earnings.</p>
      </div>

      <div className="space-y-4">
        {incomeTransactions.map((t) => (
          <Card key={t.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                  <ArrowUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {categories?.find(c => c.id === t.categoryId)?.name} • {format(new Date(t.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <span className="font-bold text-success">
                +{formatCurrency(t.amount)}
              </span>
            </CardContent>
          </Card>
        ))}
        {incomeTransactions.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No income transactions found.</p>
        )}
      </div>
    </Layout>
  );
}

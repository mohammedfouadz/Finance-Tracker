import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { useCurrency } from "@/lib/currency";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BudgetPage() {
  const { formatAmount } = useCurrency();
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: transactions, isLoading: isTransLoading } = useTransactions();

  if (isCatLoading || isTransLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const expenseCategories = categories?.filter((c: any) => c.type === 'expense') || [];
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Planning</h2>
          <p className="text-muted-foreground">Manage your monthly spending limits.</p>
        </div>
        <Button className="rounded-full shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {expenseCategories.map((category: any) => {
          const spent = transactions
            ?.filter((t: any) => t.categoryId === category.id)
            .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;
          const limit = Number(category.budgetLimit) || 0;
          const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const isOver = spent > limit && limit > 0;

          return (
            <Card key={category.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Spent: {formatAmount(spent)}</span>
                  <span className="font-medium">{limit > 0 ? formatAmount(limit) : 'No limit'}</span>
                </div>
                <Progress value={percent} className={`h-2 ${isOver ? 'bg-destructive/20' : ''}`} />
                {limit > 0 && (
                  <p className={`text-xs mt-2 ${isOver ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {isOver 
                      ? `${formatAmount(spent - limit)} over budget` 
                      : `${formatAmount(limit - spent)} remaining`}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}

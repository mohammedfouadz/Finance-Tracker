import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { useCurrency } from "@/lib/currency";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const { formatAmount } = useCurrency();
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

  // Aggregate by category
  const categoryData = categories?.map((cat: any) => {
    const total = transactions
      ?.filter((t: any) => t.categoryId === cat.id)
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;
    return { name: cat.name, value: total, type: cat.type };
  }).filter((d: any) => d.value > 0) || [];

  const expenseData = categoryData.filter((d: any) => d.type === 'expense');
  const incomeData = categoryData.filter((d: any) => d.type === 'income');

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        <p className="text-muted-foreground">Detailed breakdown of your finances.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatAmount(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Income', amount: incomeData.reduce((acc: number, d: any) => acc + d.value, 0) },
                { name: 'Expenses', amount: expenseData.reduce((acc: number, d: any) => acc + d.value, 0) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatAmount(value)} />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

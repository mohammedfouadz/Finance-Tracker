import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardCharts() {
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();

  const monthlyData = useMemo(() => {
    if (!transactions || !categories) return [];
    
    // Group by month (last 6 months)
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, 'MMM');

      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTrans
        .filter(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          return cat?.type === 'income';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTrans
        .filter(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          return cat?.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      data.push({ name: monthLabel, Income: income, Expense: expense });
    }
    return data;
  }, [transactions, categories]);

  const categoryData = useMemo(() => {
    if (!transactions || !categories) return [];
    
    const expenseCategories = categories.filter(c => c.type === 'expense');
    return expenseCategories.map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: cat.name, value: total };
    }).filter(d => d.value > 0);
  }, [transactions, categories]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="card-hover border-none shadow-lg">
        <CardHeader>
          <CardTitle>Income vs Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover border-none shadow-lg">
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

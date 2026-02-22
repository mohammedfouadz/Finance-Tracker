import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useTransactions, useCategories } from "@/hooks/use-finance";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export function DashboardCharts({ type = "bar" }: { type?: "bar" | "list" }) {
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();

  const monthlyData = useMemo(() => {
    if (!transactions || !categories) return [];
    
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
        .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTrans
        .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      data.push({ name: monthLabel, Income: income, Expense: expense });
    }
    return data;
  }, [transactions, categories]);

  const breakdownData = useMemo(() => {
    if (!transactions || !categories) return { items: [], net: 0 };
    
    const filteredCats = categories.filter(c => ['expense', 'savings', 'investment'].includes(c.type));
    const totalIncome = transactions
      .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const data = filteredCats.map(cat => {
      const amount = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { 
        name: cat.name, 
        amount, 
        percent: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        color: cat.type === 'investment' ? '#10b981' : cat.type === 'savings' ? '#2563eb' : '#e11d48'
      };
    }).filter(d => d.amount > 0);

    const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);
    const net = totalIncome - totalSpent;

    return { items: data, net };
  }, [transactions, categories]);

  if (type === "list") {
    return (
      <div className="space-y-8 pt-4">
        {breakdownData.items.map((item: any, i: number) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666] font-medium">{item.name}</span>
              <span className="font-bold text-[#1a1a1a]">{formatCurrency(item.amount)}</span>
            </div>
            <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500" 
                style={{ width: `${item.percent}%`, backgroundColor: item.color }} 
              />
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-dashed flex justify-between items-center">
          <span className="font-bold text-[#1a1a1a]">Remaining (Net)</span>
          <span className={cn("font-bold", breakdownData.net < 0 ? "text-[#e11d48]" : "text-[#10b981]")}>
            {formatCurrency(breakdownData.net)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} barGap={8}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#999999', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#999999', fontSize: 12 }}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip 
            cursor={{ fill: '#f8f9fa' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="Income" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="Expense" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

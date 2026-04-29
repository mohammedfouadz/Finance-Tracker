import { Layout } from "@/components/layout-sidebar";
import { useTransactions, useCategories, useDeleteTransaction } from "@/hooks/use-finance";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Search, Trash2, Filter } from "lucide-react";
import { useState } from "react";
import { TransactionDialog } from "@/components/transaction-dialog";
import { useI18n } from "@/lib/i18n";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { t } = useI18n();
  
  const { data: categories } = useCategories();
  const { data: transactions, isLoading } = useTransactions({
    search: search || undefined,
    categoryId: categoryFilter !== "all" ? Number(categoryFilter) : undefined
  });
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = async (id: number) => {
    if (confirm(t("transactions.confirmDelete"))) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("transactions.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("transactions.subtitle")}</p>
        </div>
        <TransactionDialog />
      </div>

      <Card className="mb-6 border-none shadow-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("transactions.searchPlaceholder")} 
              className="ps-9 bg-secondary/50 border-transparent focus:bg-background transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-transparent">
              <Filter className="w-4 h-4 me-2" />
              <SelectValue placeholder={t("common.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.allCategories")}</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center py-10 text-muted-foreground">{t("transactions.loading")}</p>
        ) : transactions?.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground mb-4">{t("transactions.noResults")}</p>
            <TransactionDialog />
          </div>
        ) : (
          transactions?.map((t_row) => {
            const category = categories?.find(c => c.id === t_row.categoryId);
            const isIncome = category?.type === 'income';

            return (
              <div key={t_row.id} className="group flex items-center justify-between p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${isIncome ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {isIncome ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{t_row.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium">{category?.name}</span>
                      <span>•</span>
                      <span>{format(new Date(t_row.date), 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className={`text-lg font-mono font-bold ${isIncome ? 'text-success' : 'text-foreground'}`} dir="ltr">
                    {isIncome ? '+' : '-'}${Number(t_row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => handleDelete(t_row.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

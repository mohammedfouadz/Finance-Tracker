import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { useCreateTransaction, useCategories } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CurrencyFields } from "@/components/currency-fields";
import { getDefaultRate } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Extend schema to handle string -> number coercion for amount/categoryId
const formSchema = insertTransactionSchema.extend({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  date: z.coerce.date(),
  currencyCode: z.string().default("USD"),
  exchangeRateToUsd: z.string().default("1"),
});

type FormValues = z.infer<typeof formSchema>;

export function TransactionDialog() {
  const { t, isRtl } = useI18n();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id,
      amount: "",
      description: "",
      date: new Date(),
      categoryId: undefined,
      currencyCode: "USD",
      exchangeRateToUsd: "1",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createTransaction.mutateAsync({
        ...values,
        userId: user!.id,
        amount: values.amount, // backend expects string for numeric
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-transaction" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
          {t("dashboard.addTransaction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{t("dashboard.addTransaction")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.description")}</FormLabel>
                  <FormControl>
                    <Input data-testid="input-transaction-description" placeholder={t("income.descriptionPlaceholder")} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.amount")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className={cn("absolute top-2.5 text-muted-foreground", isRtl ? "right-3" : "left-3")}>$</span>
                        <Input data-testid="input-transaction-amount" type="number" step="0.01" className={isRtl ? "pr-7" : "pl-7"} placeholder="0.00" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger data-testid="select-transaction-category">
                          <SelectValue placeholder={t("common.search")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <CurrencyFields
                    currencyCode={field.value}
                    exchangeRate={form.getValues("exchangeRateToUsd")}
                    amount={form.getValues("amount")}
                    onCurrencyChange={(code) => {
                      field.onChange(code);
                      const defaultRate = getDefaultRate(code);
                      form.setValue("exchangeRateToUsd", String(defaultRate));
                    }}
                    onExchangeRateChange={(rate) => {
                      form.setValue("exchangeRateToUsd", rate);
                    }}
                    showUsdPreview={true}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.date")}</FormLabel>
                  <FormControl>
                    <Input 
                      data-testid="input-transaction-date"
                      type="date" 
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button data-testid="button-submit-transaction" type="submit" className="w-full" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? t("common.saving") : t("dashboard.saveContribution")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

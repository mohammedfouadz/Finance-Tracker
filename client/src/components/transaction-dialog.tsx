import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { useCreateTransaction, useCategories, useBankAccounts } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Plus, X } from "lucide-react";
import { CURRENCIES, getDefaultRate } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BRAND = "#1B4FE4";

const formSchema = insertTransactionSchema.extend({
  amount:           z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  categoryId:       z.coerce.number().min(1, "Category is required"),
  date:             z.coerce.date(),
  currencyCode:     z.string().default("USD"),
  exchangeRateToUsd:z.string().default("1"),
  isRecurring:      z.boolean().default(false),
  notes:            z.string().optional(),
  sourceAccountId:  z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
  defaultType?: "income" | "expense";
  trigger?: React.ReactNode;
}

export function TransactionDialog({ defaultType, trigger }: TransactionDialogProps = {}) {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">(defaultType ?? "income");

  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { data: bankAccounts } = useBankAccounts();
  const createTransaction = useCreateTransaction();

  const filteredCategories = (categories as any[] | undefined)?.filter(
    (c) => c.type === txType
  ) ?? [];

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
      isRecurring: false,
      notes: "",
      sourceAccountId: "",
    },
  });

  const amountValue = form.watch("amount");
  const isRecurring = form.watch("isRecurring");
  const selectedCurrency = form.watch("currencyCode");
  const currencySymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol ?? "$";

  const onSubmit = async (values: FormValues) => {
    try {
      const description = [
        values.description,
        values.notes ? `\n---\n${values.notes}` : "",
      ].filter(Boolean).join("").trim();

      const tags: string[] = [];
      if (values.sourceAccountId) tags.push(`source:${values.sourceAccountId}`);

      await createTransaction.mutateAsync({
        ...values,
        userId: user!.id,
        description: description || null,
        tags: tags.length ? tags : null,
        type: txType,
      } as any);

      setOpen(false);
      form.reset({
        userId: user?.id,
        amount: "",
        description: "",
        date: new Date(),
        categoryId: undefined,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        isRecurring: false,
        notes: "",
        sourceAccountId: "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (!v) {
      form.reset({
        userId: user?.id,
        amount: "",
        description: "",
        date: new Date(),
        categoryId: undefined,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        isRecurring: false,
        notes: "",
        sourceAccountId: "",
      });
    }
  };

  const title = txType === "income"
    ? (isAr ? "إضافة دخل"   : "Add Income")
    : (isAr ? "إضافة مصروف" : "Add Expense");

  const subtitle = txType === "income"
    ? (isAr ? "سجّل تدفقاً مالياً جديداً في سجلك." : "Record a new capital inflow to your ledger.")
    : (isAr ? "سجّل تدفقاً خارجياً جديداً في سجلك." : "Record a new capital outflow from your ledger.");

  const saveLabel = txType === "income"
    ? (isAr ? "حفظ الدخل"   : "Save Income")
    : (isAr ? "حفظ المصروف" : "Save Expense");

  const formattedAmount = amountValue && !isNaN(Number(amountValue))
    ? Number(amountValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          data-testid="button-add-transaction"
          className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          style={{ backgroundColor: BRAND }}
        >
          <Plus className="w-4 h-4" />
          {t("dashboard.addTransaction")}
        </Button>
      )}

      <DialogContent
        className="sm:max-w-[540px] p-0 gap-0 overflow-hidden rounded-2xl"
        dir={isAr ? "rtl" : "ltr"}
        hideClose
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            {/* Type switcher (only if no defaultType locked) */}
            {!defaultType && (
              <div className="flex gap-1 mb-3">
                {(["income", "expense"] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => {
                      setTxType(tp);
                      form.setValue("categoryId", undefined as any);
                    }}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                      txType === tp
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                    )}
                    style={txType === tp ? { backgroundColor: BRAND } : {}}
                  >
                    {tp === "income" ? (isAr ? "دخل" : "Income") : (isAr ? "مصروف" : "Expense")}
                  </button>
                ))}
              </div>
            )}
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{title}</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => handleOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ms-4 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 pt-5 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Amount */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-2">
                  {isAr ? "مبلغ المعاملة" : "Transaction Amount"}
                </p>
                <div className="flex items-baseline gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <span className="text-3xl font-light text-gray-300 dark:text-gray-600">{currencySymbol}</span>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex-1 m-0">
                        <FormControl>
                          <input
                            data-testid="input-transaction-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className={cn(
                              "w-full bg-transparent border-none outline-none p-0",
                              "text-3xl font-semibold text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600",
                              "focus:ring-0"
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Currency + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {isAr ? "العملة" : "Currency"}
                  </p>
                  <FormField
                    control={form.control}
                    name="currencyCode"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value}
                          onValueChange={(code) => {
                            field.onChange(code);
                            form.setValue("exchangeRateToUsd", String(getDefaultRate(code)));
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-transaction-currency" className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code} — {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {isAr ? "الفئة" : "Category"}
                  </p>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-transaction-category" className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue placeholder={isAr ? "اختر الفئة" : "Select category"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredCategories.length === 0 ? (
                              <SelectItem value="__none__" disabled>
                                {isAr ? "لا توجد فئات" : "No categories"}
                              </SelectItem>
                            ) : (
                              filteredCategories.map((cat: any) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Date + Source Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {txType === "income"
                      ? (isAr ? "تاريخ الاستلام" : "Date Received")
                      : (isAr ? "تاريخ الدفع" : "Date Paid")}
                  </p>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            data-testid="input-transaction-date"
                            type="date"
                            className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                    {isAr ? "حساب المصدر" : "Source Account"}
                  </p>
                  <FormField
                    control={form.control}
                    name="sourceAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source-account" className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue placeholder={isAr ? "اختر الحساب" : "Select account"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{isAr ? "بدون حساب" : "No account"}</SelectItem>
                            {(bankAccounts as any[] | undefined)?.map((acc: any) => (
                              <SelectItem key={acc.id} value={String(acc.id)}>
                                {acc.bankName}
                                {acc.accountNumber ? ` (**** ${acc.accountNumber.slice(-4)})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                  {isAr ? "وصف المعاملة" : "Transaction Description"}
                </p>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          data-testid="input-transaction-description"
                          placeholder={
                            txType === "income"
                              ? (isAr ? "مثل: راتب شهر مارس - مشروع ألفا" : "e.g. Q3 Consulting Bonus - Alpha Project")
                              : (isAr ? "مثل: فاتورة كهرباء - مارس 2026" : "e.g. Electricity bill - March 2026")
                          }
                          className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mark as Recurring */}
              <div className="flex items-center justify-between py-3 px-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
                    <CalendarDays className="w-4 h-4" style={{ color: BRAND }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {isAr ? "تعيين كمتكرر" : "Mark as Recurring"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAr ? "تكرار هذه المعاملة شهرياً" : "Repeat this transaction monthly"}
                    </p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          data-testid="switch-recurring"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Internal Notes */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                  {isAr ? "ملاحظات داخلية" : "Internal Notes"}
                </p>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          data-testid="input-transaction-notes"
                          placeholder={isAr ? "تفاصيل سرية للتقارير الضريبية..." : "Confidential details for tax reporting..."}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none min-h-[90px]"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpen(false)}
                className="rounded-full px-6 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                data-testid="button-submit-transaction"
                type="submit"
                disabled={createTransaction.isPending}
                className="rounded-full px-7 font-semibold shadow-md"
                style={{ backgroundColor: BRAND }}
              >
                {createTransaction.isPending
                  ? (isAr ? "جارٍ الحفظ..." : "Saving...")
                  : saveLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

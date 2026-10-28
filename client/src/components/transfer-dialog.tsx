import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTransfer } from "@/hooks/use-finance";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { getCurrencySymbol } from "@/lib/currency";
import { ArrowLeftRight } from "lucide-react";

const BRAND = "#1B4FE4";

/**
 * Records money moved between two of the user's own accounts. The server
 * debits one account and credits the other in a single database transaction;
 * nothing is booked as income or expense.
 */
export function TransferDialog({ open, onOpenChange, accounts }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: any[];
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const createTransfer = useCreateTransfer();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ fromAccountId: "", toAccountId: "", amount: "", toAmount: "", date: today, notes: "" });

  useEffect(() => {
    if (!open) return;
    setForm({
      fromAccountId: accounts[0] ? String(accounts[0].id) : "",
      toAccountId: accounts[1] ? String(accounts[1].id) : "",
      amount: "", toAmount: "", date: today, notes: "",
    });
  }, [open]);

  const from = accounts.find(a => String(a.id) === form.fromAccountId);
  const to = accounts.find(a => String(a.id) === form.toAccountId);
  const crossCurrency = !!from && !!to && from.currency !== to.currency;

  // Suggested received amount for cross-currency transfers, from the stored USD rates.
  const suggestedToAmount = useMemo(() => {
    const amt = Number(form.amount);
    if (!crossCurrency || !amt) return "";
    const converted = (amt * (Number(from.exchangeRateToUsd) || 1)) / (Number(to.exchangeRateToUsd) || 1);
    return converted.toFixed(2);
  }, [form.amount, crossCurrency, from, to]);

  const sameAccount = form.fromAccountId !== "" && form.fromAccountId === form.toAccountId;
  const valid = from && to && !sameAccount && Number(form.amount) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const toAmount = crossCurrency ? Number(form.toAmount || suggestedToAmount) : undefined;
    try {
      await createTransfer.mutateAsync({
        fromAccountId: Number(form.fromAccountId),
        toAccountId: Number(form.toAccountId),
        amount: Number(form.amount),
        toAmount,
        date: form.date,
        notes: form.notes || undefined,
      });
      toast({ title: t("transfer.success") });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: err?.message || t("common.errorGeneric"), variant: "destructive" });
    }
  };

  const label = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block";
  const accountOptions = accounts.map(a => (
    <SelectItem key={a.id} value={String(a.id)}>
      {a.bankName} · {a.accountType} ({a.currency})
    </SelectItem>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" style={{ color: BRAND }} /> {t("transfer.title")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{t("transfer.hint")}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t("transfer.from")}</label>
              <Select value={form.fromAccountId} onValueChange={v => setForm(p => ({ ...p, fromAccountId: v, toAmount: "" }))}>
                <SelectTrigger data-testid="select-transfer-from"><SelectValue /></SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <label className={label}>{t("transfer.to")}</label>
              <Select value={form.toAccountId} onValueChange={v => setForm(p => ({ ...p, toAccountId: v, toAmount: "" }))}>
                <SelectTrigger data-testid="select-transfer-to"><SelectValue /></SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
          </div>
          {sameAccount && <p className="text-xs text-red-500">{t("transfer.sameAccount")}</p>}
          <div className={crossCurrency ? "grid grid-cols-2 gap-3" : ""}>
            <div>
              <label className={label}>{t("transfer.amount")} {from && `(${getCurrencySymbol(from.currency)})`}</label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} data-testid="input-transfer-amount" />
            </div>
            {crossCurrency && (
              <div>
                <label className={label}>{t("transfer.toAmount")} ({getCurrencySymbol(to.currency)})</label>
                <Input type="number" step="0.01" min="0" placeholder={suggestedToAmount || "0.00"} value={form.toAmount}
                  onChange={e => setForm(p => ({ ...p, toAmount: e.target.value }))} data-testid="input-transfer-to-amount" />
              </div>
            )}
          </div>
          {crossCurrency && <p className="text-[11px] text-gray-400 -mt-2">{t("transfer.toAmountHint")}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t("common.date")}</label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className={label}>{t("common.notes")}</label>
              <Input placeholder={t("common.optional")} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={!valid || createTransfer.isPending} data-testid="button-submit-transfer">
              {createTransfer.isPending ? t("common.saving") : t("transfer.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

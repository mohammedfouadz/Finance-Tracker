import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, useDebtPayments, useCreateDebtPayment } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, toUsd, getDefaultRate } from "@/lib/currency";
import { Plus, Trash2, CreditCard, CheckCircle, AlertTriangle, Percent, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/currency";
import { CurrencyFields } from "@/components/currency-fields";

export default function DebtsPage() {
  const { user } = useAuth();
  const { data: debts, isLoading } = useDebts();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const createDebtPayment = useCreateDebtPayment();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    creditorName: "",
    originalAmount: "",
    remainingAmount: "",
    currency: "USD",
    exchangeRateToUsd: "1",
    reason: "",
    dateTaken: new Date().toISOString().split("T")[0],
    dueDate: "",
    interestRate: "",
    status: "active",
    paymentPlan: "Monthly",
    installmentAmount: "",
    notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const totalDebt = useMemo(() => {
    if (!debts) return 0;
    return debts.reduce((sum: number, d: any) => sum + toUsd(d.remainingAmount, d.exchangeRateToUsd), 0);
  }, [debts]);

  const activeDebts = useMemo(() => {
    if (!debts) return 0;
    return debts.filter((d: any) => d.status === "active").length;
  }, [debts]);

  const paidOffDebts = useMemo(() => {
    if (!debts) return 0;
    return debts.filter((d: any) => d.status === "paid").length;
  }, [debts]);

  const avgInterestRate = useMemo(() => {
    if (!debts || debts.length === 0) return 0;
    const withRate = debts.filter((d: any) => d.interestRate && Number(d.interestRate) > 0);
    if (withRate.length === 0) return 0;
    return withRate.reduce((sum: number, d: any) => sum + Number(d.interestRate), 0) / withRate.length;
  }, [debts]);

  const getStatusColor = (debt: any) => {
    if (debt.status === "paid") return "green";
    if (debt.dueDate && new Date(debt.dueDate) < new Date()) return "red";
    return "yellow";
  };

  const getStatusBadge = (debt: any) => {
    const color = getStatusColor(debt);
    if (color === "green") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${debt.id}`}>Paid Off</Badge>;
    if (color === "red") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${debt.id}`}>Overdue</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 no-default-hover-elevate no-default-active-elevate" data-testid={`badge-status-${debt.id}`}>Active</Badge>;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.creditorName || !formData.originalAmount || !formData.remainingAmount || !formData.reason) return;
    try {
      await createDebt.mutateAsync({
        userId: user!.id,
        creditorName: formData.creditorName,
        originalAmount: formData.originalAmount,
        remainingAmount: formData.remainingAmount,
        currency: formData.currency,
        exchangeRateToUsd: formData.exchangeRateToUsd,
        reason: formData.reason,
        dateTaken: new Date(formData.dateTaken),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        interestRate: formData.interestRate || undefined,
        status: formData.status,
        paymentPlan: formData.paymentPlan || undefined,
        installmentAmount: formData.installmentAmount || undefined,
        notes: formData.notes || undefined,
      });
      setFormData({
        creditorName: "",
        originalAmount: "",
        remainingAmount: "",
        currency: "USD",
        exchangeRateToUsd: "1",
        reason: "",
        dateTaken: new Date().toISOString().split("T")[0],
        dueDate: "",
        interestRate: "",
        status: "active",
        paymentPlan: "Monthly",
        installmentAmount: "",
        notes: "",
      });
      setShowForm(false);
      toast({ title: "Debt recorded successfully" });
    } catch {
      toast({ title: "Failed to save debt", variant: "destructive" });
    }
  };

  const handlePaymentSubmit = async (debtId: number) => {
    if (!paymentForm.amount) return;
    const parentDebt = (debts as any[])?.find((d: any) => d.id === debtId);
    try {
      await createDebtPayment.mutateAsync({
        debtId,
        amount: paymentForm.amount,
        currencyCode: parentDebt?.currency || "USD",
        exchangeRateToUsd: parentDebt?.exchangeRateToUsd || "1",
        paymentDate: new Date(paymentForm.paymentDate),
        notes: paymentForm.notes || undefined,
      });
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setSelectedDebtId(null);
      toast({ title: "Payment recorded successfully" });
    } catch {
      toast({ title: "Failed to record payment", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDebt.mutateAsync(id);
      toast({ title: "Debt deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Debt Management</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track and manage your debts and payments.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-debt">
          <Plus className="w-4 h-4 mr-2" /> Add Debt
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Debt</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-debt">{formatAmount(totalDebt)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Active Debts</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-active-debts">{activeDebts}</h3>
              </div>
              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Paid Off</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-paid-debts">{paidOffDebts}</h3>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Avg Interest Rate</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-avg-interest">{avgInterestRate.toFixed(1)}%</h3>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>Add New Debt</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Creditor Name</label>
                <Input data-testid="input-creditor-name" placeholder="e.g. Bank ABC" value={formData.creditorName} onChange={e => setFormData({...formData, creditorName: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Original Amount</label>
                <Input data-testid="input-original-amount" type="number" step="0.01" placeholder="0.00" value={formData.originalAmount} onChange={e => setFormData({...formData, originalAmount: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Remaining Amount</label>
                <Input data-testid="input-remaining-amount" type="number" step="0.01" placeholder="0.00" value={formData.remainingAmount} onChange={e => setFormData({...formData, remainingAmount: e.target.value})} />
              </div>
              <CurrencyFields
                currencyCode={formData.currency}
                exchangeRate={formData.exchangeRateToUsd}
                onCurrencyChange={(code) => setFormData({...formData, currency: code})}
                onExchangeRateChange={(rate) => setFormData({...formData, exchangeRateToUsd: rate})}
                showUsdPreview={false}
              />
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Reason</label>
                <Input data-testid="input-reason" placeholder="e.g. Car loan" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Date Taken</label>
                <Input data-testid="input-date-taken" type="date" value={formData.dateTaken} onChange={e => setFormData({...formData, dateTaken: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Due Date (optional)</label>
                <Input data-testid="input-due-date" type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Interest Rate % (optional)</label>
                <Input data-testid="input-interest-rate" type="number" step="0.01" placeholder="0.00" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="restructured">Restructured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Payment Plan</label>
                <Select value={formData.paymentPlan} onValueChange={v => setFormData({...formData, paymentPlan: v})}>
                  <SelectTrigger data-testid="select-payment-plan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Installment Amount (optional)</label>
                <Input data-testid="input-installment-amount" type="number" step="0.01" placeholder="0.00" value={formData.installmentAmount} onChange={e => setFormData({...formData, installmentAmount: e.target.value})} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Notes (optional)</label>
                <Textarea data-testid="input-notes" placeholder="Additional notes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createDebt.isPending} data-testid="button-submit-debt">
                  {createDebt.isPending ? "Saving..." : "Save Debt"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!debts || debts.length === 0) ? (
          <div className="col-span-full">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                <p className="text-center text-[#999] dark:text-gray-500 py-8">No debts recorded yet.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          debts.map((debt: any) => {
            const progressPct = Number(debt.originalAmount) > 0
              ? ((Number(debt.originalAmount) - Number(debt.remainingAmount)) / Number(debt.originalAmount)) * 100
              : 0;
            const statusColor = getStatusColor(debt);

            return (
              <Card
                key={debt.id}
                className={`border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 ${
                  statusColor === "green" ? "border-l-0" : statusColor === "red" ? "border-l-0" : "border-l-0"
                }`}
                data-testid={`card-debt-${debt.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-white" data-testid={`text-creditor-${debt.id}`}>{debt.creditorName}</h3>
                      <p className="text-sm text-[#666] dark:text-gray-400" data-testid={`text-reason-${debt.id}`}>{debt.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(debt)}
                      <Button variant="ghost" size="icon" className="text-red-500"
                        onClick={() => handleDelete(debt.id)}
                        data-testid={`button-delete-${debt.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666] dark:text-gray-400">Original</span>
                      <span className="font-semibold text-[#1a1a1a] dark:text-white" data-testid={`text-original-${debt.id}`}>{formatAmount(Number(debt.originalAmount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666] dark:text-gray-400">Remaining</span>
                      <span className="font-semibold text-[#1a1a1a] dark:text-white" data-testid={`text-remaining-${debt.id}`}>{formatAmount(Number(debt.remainingAmount))}</span>
                    </div>
                    <Progress value={progressPct} className="h-2" data-testid={`progress-${debt.id}`} />
                    <p className="text-xs text-[#999] dark:text-gray-500">{progressPct.toFixed(1)}% paid off</p>

                    {debt.dueDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666] dark:text-gray-400">Due Date</span>
                        <span className="text-[#1a1a1a] dark:text-white" data-testid={`text-due-date-${debt.id}`}>{format(new Date(debt.dueDate), "MMM d, yyyy")}</span>
                      </div>
                    )}

                    {debt.interestRate && Number(debt.interestRate) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666] dark:text-gray-400">Interest Rate</span>
                        <span className="text-[#1a1a1a] dark:text-white" data-testid={`text-interest-${debt.id}`}>{Number(debt.interestRate).toFixed(1)}%</span>
                      </div>
                    )}

                    {debt.paymentPlan && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666] dark:text-gray-400">Payment Plan</span>
                        <span className="text-[#1a1a1a] dark:text-white">{debt.paymentPlan}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t dark:border-gray-800">
                    {selectedDebtId === debt.id ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">Record Payment</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#666] dark:text-gray-400 mb-1 block">Amount</label>
                            <Input data-testid={`input-payment-amount-${debt.id}`} type="number" step="0.01" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-[#666] dark:text-gray-400 mb-1 block">Payment Date</label>
                            <Input data-testid={`input-payment-date-${debt.id}`} type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-[#666] dark:text-gray-400 mb-1 block">Notes (optional)</label>
                          <Input data-testid={`input-payment-notes-${debt.id}`} placeholder="Payment notes..." value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={createDebtPayment.isPending} onClick={() => handlePaymentSubmit(debt.id)} data-testid={`button-submit-payment-${debt.id}`}>
                            {createDebtPayment.isPending ? "Saving..." : "Save Payment"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedDebtId(null)} data-testid={`button-cancel-payment-${debt.id}`}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedDebtId(debt.id);
                        setPaymentForm({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
                      }} data-testid={`button-record-payment-${debt.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBankAccounts, useCreateBankAccount, useUpdateBankAccount, useDeleteBankAccount } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { Plus, Trash2, Pencil, Landmark, Wallet, CreditCard, TrendingUp, Hash } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const ACCOUNT_TYPES = ["Savings", "Checking", "Investment", "Credit Card"];

const ACCOUNT_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  Savings: { icon: Wallet, color: "#16a34a", bgColor: "bg-green-50" },
  Checking: { icon: Landmark, color: "#2563eb", bgColor: "bg-blue-50" },
  Investment: { icon: TrendingUp, color: "#8b5cf6", bgColor: "bg-purple-50" },
  "Credit Card": { icon: CreditCard, color: "#dc2626", bgColor: "bg-red-50" },
};

const emptyForm = {
  bankName: "",
  accountType: "",
  accountNumber: "",
  currency: "SAR",
  balance: "",
  notes: "",
};

export default function BankAccountsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const totalBalance = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0);
  }, [accounts]);

  const accountCount = accounts?.length || 0;

  const highestBalanceAccount = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    return accounts.reduce((max: any, a: any) => (Number(a.balance) > Number(max.balance) ? a : max), accounts[0]);
  }, [accounts]);

  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return "****" + num.slice(-4);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (account: any) => {
    setEditingId(account.id);
    setFormData({
      bankName: account.bankName,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
      currency: account.currency || "SAR",
      balance: String(account.balance),
      notes: account.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountType || !formData.accountNumber || !formData.balance) return;
    try {
      if (editingId) {
        await updateAccount.mutateAsync({
          id: editingId,
          bankName: formData.bankName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          currency: formData.currency,
          balance: formData.balance,
          notes: formData.notes || null,
          userId: user!.id,
        });
        toast({ title: "Account updated" });
      } else {
        await createAccount.mutateAsync({
          bankName: formData.bankName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          currency: formData.currency,
          balance: formData.balance,
          notes: formData.notes || null,
          userId: user!.id,
        });
        toast({ title: "Account added" });
      }
      setFormData(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount.mutateAsync(id);
      toast({ title: "Account deleted" });
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
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Bank Accounts</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Manage your bank accounts and balances.</p>
        </div>
        <Button onClick={openCreateForm} data-testid="button-add-account">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Total Balance</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-total-balance">{formatAmount(totalBalance)}</h3>
                <p className="text-xs text-[#999] dark:text-gray-500 mt-1">Across all accounts</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50"><Wallet className="w-6 h-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Number of Accounts</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-account-count">{accountCount}</h3>
                <p className="text-xs text-[#999] dark:text-gray-500 mt-1">Active accounts</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50"><Hash className="w-6 h-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#666] dark:text-gray-400 mb-2">Highest Balance</p>
                <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-white" data-testid="text-highest-balance">
                  {highestBalanceAccount ? formatAmount(Number(highestBalanceAccount.balance)) : formatAmount(0)}
                </h3>
                <p className="text-xs text-[#999] dark:text-gray-500 mt-1">{highestBalanceAccount?.bankName || "No accounts"}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 mb-6">
          <CardHeader><CardTitle>{editingId ? "Edit Account" : "Add New Account"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Bank Name</label>
                <Input data-testid="input-bank-name" placeholder="e.g. Al Rajhi Bank" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Account Type</label>
                <Select value={formData.accountType} onValueChange={v => setFormData({...formData, accountType: v})}>
                  <SelectTrigger data-testid="select-account-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Account Number</label>
                <Input data-testid="input-account-number" placeholder="e.g. 1234567890" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Currency</label>
                <Input data-testid="input-currency" placeholder="SAR" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Balance</label>
                <Input data-testid="input-balance" type="number" step="0.01" placeholder="0.00" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Notes</label>
                <Input data-testid="input-notes" placeholder="Optional notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending} data-testid="button-submit-account">
                  {(createAccount.isPending || updateAccount.isPending) ? "Saving..." : editingId ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(!accounts || accounts.length === 0) ? (
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <p className="text-center text-[#999] dark:text-gray-500 py-8">No bank accounts added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account: any) => {
            const config = ACCOUNT_TYPE_CONFIG[account.accountType] || ACCOUNT_TYPE_CONFIG.Savings;
            const Icon = config.icon;
            return (
              <Card key={account.id} className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900" data-testid={`card-account-${account.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${config.bgColor}`}>
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1a1a1a] dark:text-white" data-testid={`text-bank-name-${account.id}`}>{account.bankName}</h3>
                        <Badge variant="secondary" className="mt-1" data-testid={`badge-type-${account.id}`}>{account.accountType}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#666] dark:text-gray-400">Account</span>
                      <span className="text-sm font-medium text-[#1a1a1a] dark:text-white" data-testid={`text-account-number-${account.id}`}>{maskAccountNumber(account.accountNumber)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#666] dark:text-gray-400">Balance</span>
                      <span className="text-lg font-bold text-[#1a1a1a] dark:text-white" data-testid={`text-balance-${account.id}`}>{formatAmount(Number(account.balance))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#666] dark:text-gray-400">Currency</span>
                      <span className="text-sm font-medium text-[#1a1a1a] dark:text-white" data-testid={`text-currency-${account.id}`}>{account.currency}</span>
                    </div>
                    {account.lastUpdated && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#666] dark:text-gray-400">Last Updated</span>
                        <span className="text-sm text-[#999] dark:text-gray-500" data-testid={`text-updated-${account.id}`}>{format(new Date(account.lastUpdated), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {account.notes && (
                      <div className="pt-2 border-t dark:border-gray-800">
                        <p className="text-sm text-[#999] dark:text-gray-500" data-testid={`text-notes-${account.id}`}>{account.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEditForm(account)} data-testid={`button-edit-${account.id}`}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(account.id)} data-testid={`button-delete-${account.id}`}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

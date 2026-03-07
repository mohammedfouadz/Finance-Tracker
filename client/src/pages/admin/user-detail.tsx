import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Redirect, Link, useParams } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  language: string | null;
  isAdmin: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
}

interface Transaction {
  id: number;
  amount: string;
  currencyCode: string;
  date: string;
  description: string | null;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

interface UserDetailData {
  user: AdminUser;
  transactions: Transaction[];
  categories: Category[];
}

export default function AdminUserDetailPage() {
  const { user: currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "" });

  if (!(currentUser as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data, isLoading } = useQuery<UserDetailData>({
    queryKey: ["/api/admin/users", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditMode(false);
      toast({ title: "User updated successfully" });
    },
    onError: () => toast({ title: "Failed to update user", variant: "destructive" }),
  });

  const handleEdit = () => {
    if (data?.user) {
      setForm({
        firstName: data.user.firstName ?? "",
        lastName: data.user.lastName ?? "",
        email: data.user.email ?? "",
        phone: data.user.phone ?? "",
        country: data.user.country ?? "",
      });
      setEditMode(true);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-16 text-[#999]">User not found.</div>
      </Layout>
    );
  }

  const { user: targetUser, transactions, categories } = data;
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <Layout>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-user-detail-title">
            {targetUser.firstName} {targetUser.lastName}
          </h2>
          <p className="text-[#666] dark:text-gray-400 mt-1">{targetUser.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-user">Edit</Button>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">First Name</label>
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} data-testid="input-first-name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Last Name</label>
                    <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} data-testid="input-last-name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Email</label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Phone</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Country</label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} data-testid="input-country" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} data-testid="button-save-user">
                    <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "First Name", value: targetUser.firstName },
                  { label: "Last Name", value: targetUser.lastName },
                  { label: "Email", value: targetUser.email },
                  { label: "Phone", value: targetUser.phone },
                  { label: "Country", value: targetUser.country },
                  { label: "Currency", value: targetUser.currency },
                  { label: "Language", value: targetUser.language },
                  { label: "Registered", value: targetUser.createdAt ? format(new Date(targetUser.createdAt), "MMM d, yyyy") : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-[#999] dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="font-medium dark:text-white">{value || "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
          <CardHeader><CardTitle>Account Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#666] dark:text-gray-400">Status</span>
              {targetUser.isActive !== false ? (
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-700">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#666] dark:text-gray-400">Role</span>
              {targetUser.isAdmin ? (
                <div className="flex items-center gap-1 text-primary font-medium text-sm">
                  <Shield className="w-4 h-4" /> Admin
                </div>
              ) : (
                <span className="text-sm text-[#666] dark:text-gray-400">User</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#666] dark:text-gray-400">Transactions</span>
              <span className="font-bold dark:text-white">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#666] dark:text-gray-400">Categories</span>
              <span className="font-bold dark:text-white">{categories.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader><CardTitle>Transactions ({transactions.length})</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-[#999] py-8">No transactions found for this user.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((t) => {
                    const cat = t.categoryId ? catMap[t.categoryId] : null;
                    return (
                      <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-tx-${t.id}`}>
                        <td className="py-3 px-4 text-[#666] dark:text-gray-400">{format(new Date(t.date), "MMM d, yyyy")}</td>
                        <td className="py-3 px-4 font-medium dark:text-white">{t.description || "—"}</td>
                        <td className="py-3 px-4">
                          {cat ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                              {cat.name}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold dark:text-white">
                          {Number(t.amount).toLocaleString()} {t.currencyCode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {transactions.length > 50 && (
                <p className="text-center text-sm text-[#999] mt-4">Showing 50 of {transactions.length} transactions</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

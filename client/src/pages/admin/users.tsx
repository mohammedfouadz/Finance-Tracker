import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Redirect, Link } from "wouter";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Trash2, Eye, UserCheck, UserX, Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  if (!(user as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({ queryKey: ["/api/admin/users"] });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const country = (u.country ?? "").toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || country.includes(q);
      const matchesCountry = !countryFilter || country === countryFilter.toLowerCase();
      return matchesSearch && matchesCountry;
    });
  }, [users, search, countryFilter]);

  const countries = useMemo(() => {
    const set = new Set(users.map((u) => u.country).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [users]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: (err: any) => toast({ title: err.message || "Failed to delete user", variant: "destructive" }),
  });

  return (
    <Layout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-admin-users-title">User Management</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">View, manage and control all registered users.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <Input
                className="pl-9"
                placeholder="Search by name, email or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-user-search"
              />
            </div>
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              data-testid="select-country-filter"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-[#999] py-12">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Country</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Registered</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#666] dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 transition-colors" data-testid={`row-user-${u.id}`}>
                      <td className="py-3 px-4 font-medium dark:text-white">
                        <div className="flex items-center gap-2">
                          {u.firstName} {u.lastName}
                          {u.isAdmin && <Shield className="w-3.5 h-3.5 text-primary" aria-label="Admin" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#666] dark:text-gray-400">{u.email}</td>
                      <td className="py-3 px-4 text-[#666] dark:text-gray-400">{u.country || "—"}</td>
                      <td className="py-3 px-4 text-[#666] dark:text-gray-400">
                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive !== false ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/users/${u.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" data-testid={`button-view-${u.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${u.isActive !== false ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                            onClick={() => statusMutation.mutate({ id: u.id, isActive: u.isActive === false })}
                            disabled={statusMutation.isPending}
                            data-testid={`button-toggle-status-${u.id}`}
                          >
                            {u.isActive !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          {!u.isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" data-testid={`button-delete-${u.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {u.firstName} {u.lastName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteMutation.mutate(u.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

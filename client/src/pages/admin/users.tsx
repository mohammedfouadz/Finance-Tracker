import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Redirect, Link } from "wouter";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Trash2, Eye, UserX, UserCheck, Search, Shield, Download,
  ChevronUp, ChevronDown, ChevronsUpDown, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BRAND = "#1B4FE4";
const PAGE_SIZE = 20;

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  language: string | null;
  theme: string | null;
  isAdmin: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  txCount: number;
}

type SortField = "name" | "email" | "createdAt" | "updatedAt" | "status" | "language" | "currency" | "theme" | "txCount";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
}

function initials(u: AdminUser) {
  const f = u.firstName?.[0] ?? "";
  const l = u.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || u.email?.[0]?.toUpperCase() || "?";
}

function exportCSV(users: AdminUser[]) {
  const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Country", "Currency", "Language", "Theme", "Status", "Role", "Transactions", "Registered", "Last Updated"];
  const rows = users.map(u => [
    u.id,
    u.firstName ?? "",
    u.lastName ?? "",
    u.email ?? "",
    u.phone ?? "",
    u.country ?? "",
    u.currency ?? "",
    u.language ?? "",
    u.theme ?? "",
    u.isActive !== false ? "Active" : "Inactive",
    u.isAdmin ? "Admin" : "User",
    u.txCount,
    u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : "",
    u.updatedAt ? format(new Date(u.updatedAt), "yyyy-MM-dd") : "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "wealthly-users.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [langFilter, setLangFilter] = useState("all");
  const [currFilter, setCurrFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  if (!(user as any)?.isAdmin) return <Redirect to="/dashboard" />;

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({ queryKey: ["/api/admin/users"] });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ isActive }) });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User status updated" }); },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to delete user"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User deleted" }); },
    onError: (err: any) => toast({ title: err.message || "Failed to delete user", variant: "destructive" }),
  });

  const currencies = useMemo(() => [...new Set(users.map(u => u.currency).filter(Boolean))].sort() as string[], [users]);
  const languages = useMemo(() => [...new Set(users.map(u => u.language).filter(Boolean))].sort() as string[], [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || (u.email ?? "").toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive !== false : u.isActive === false);
      const matchLang = langFilter === "all" || u.language === langFilter;
      const matchCurr = currFilter === "all" || u.currency === currFilter;
      return matchSearch && matchStatus && matchLang && matchCurr;
    });
  }, [users, search, statusFilter, langFilter, currFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortField === "name") { av = `${a.firstName ?? ""} ${a.lastName ?? ""}`; bv = `${b.firstName ?? ""} ${b.lastName ?? ""}`; }
      else if (sortField === "email") { av = a.email ?? ""; bv = b.email ?? ""; }
      else if (sortField === "createdAt") { av = a.createdAt ?? ""; bv = b.createdAt ?? ""; }
      else if (sortField === "updatedAt") { av = a.updatedAt ?? ""; bv = b.updatedAt ?? ""; }
      else if (sortField === "status") { av = a.isActive !== false ? 1 : 0; bv = b.isActive !== false ? 1 : 0; }
      else if (sortField === "language") { av = a.language ?? ""; bv = b.language ?? ""; }
      else if (sortField === "currency") { av = a.currency ?? ""; bv = b.currency ?? ""; }
      else if (sortField === "theme") { av = a.theme ?? ""; bv = b.theme ?? ""; }
      else if (sortField === "txCount") { av = a.txCount; bv = b.txCount; }
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const TH = ({ label, field }: { label: string; field: SortField }) => (
    <th className="text-left py-3 px-3 font-semibold text-[11px] uppercase tracking-wider text-gray-400 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <div className="flex items-center">{label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} /></div>
    </th>
  );

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" data-testid="text-admin-users-title">User Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {users.length} total users · {users.filter(u => u.isActive !== false).length} active
          </p>
        </div>
        <Button variant="outline" className="gap-2 text-xs h-8 rounded-xl" onClick={() => exportCSV(sorted)} data-testid="button-export-csv">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9 h-9 text-sm rounded-xl" placeholder="Search by name, email or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} data-testid="input-user-search" />
        </div>
        <select className="border rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} data-testid="select-status-filter">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="border rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white" value={langFilter} onChange={e => { setLangFilter(e.target.value); setPage(1); }} data-testid="select-lang-filter">
          <option value="all">All Languages</option>
          {languages.map(l => <option key={l} value={l}>{l === "en" ? "English" : l === "ar" ? "Arabic" : l}</option>)}
        </select>
        <select className="border rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white" value={currFilter} onChange={e => { setCurrFilter(e.target.value); setPage(1); }} data-testid="select-currency-filter">
          <option value="all">All Currencies</option>
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1A2744]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} /></div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Users className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400">No users found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <TH label="User" field="name" />
                    <TH label="Email" field="email" />
                    <TH label="Registered" field="createdAt" />
                    <TH label="Last Active" field="updatedAt" />
                    <TH label="Status" field="status" />
                    <TH label="Lang" field="language" />
                    <TH label="Currency" field="currency" />
                    <TH label="Theme" field="theme" />
                    <TH label="Transactions" field="txCount" />
                    <th className="text-center py-3 px-3 font-semibold text-[11px] uppercase tracking-wider text-gray-400 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors" data-testid={`row-user-${u.id}`}>
                      {/* Avatar + Name */}
                      <td className="py-3 px-3 font-medium dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: BRAND }}>
                            {initials(u)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 leading-tight">
                              <span className="truncate max-w-[120px]">{u.firstName} {u.lastName}</span>
                              {u.isAdmin && <Shield className="w-3 h-3 text-blue-500 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{u.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-[160px]">
                        <span className="truncate block">{u.email ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.updatedAt ? format(new Date(u.updatedAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 px-3">
                        {u.isActive !== false ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 border-0 text-[10px]">Active</Badge>
                        ) : (
                          <Badge className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-50 border-0 text-[10px]">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                        <span className="uppercase text-[10px] font-semibold">{u.language ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                        <span className="text-[11px] font-medium">{u.currency ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                        <span className="text-[11px] capitalize">{u.theme ?? "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold dark:text-white">
                        {u.txCount}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/users/${u.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30" data-testid={`button-view-${u.id}`}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${u.isActive !== false ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30" : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
                            onClick={() => statusMutation.mutate({ id: u.id, isActive: u.isActive === false })}
                            disabled={statusMutation.isPending}
                            data-testid={`button-toggle-status-${u.id}`}
                          >
                            {u.isActive !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </Button>
                          {!u.isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" data-testid={`button-delete-${u.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Permanently delete <strong>{u.firstName} {u.lastName}</strong>? All their data will be removed. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(u.id)}>Delete</AlertDialogAction>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} users
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs rounded-lg"
                      style={p === page ? { backgroundColor: BRAND, borderColor: BRAND } : {}} onClick={() => setPage(p)}>{p}</Button>
                  );
                })}
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

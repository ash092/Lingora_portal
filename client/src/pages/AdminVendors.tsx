import type { Freelancer } from "@shared/types";
import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Search, Download, UserPlus, ChevronRight } from "lucide-react";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

function tierLabel(tier: string | null) {
  if (!tier) return null;
  const map: Record<string, string> = {
    tier1: "Tier 1",
    tier2: "Tier 2",
    tier3: "Tier 3",
  };
  return map[tier] ?? tier;
}

export default function AdminVendors() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const vendors = trpc.admin.listVendors.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    tier: tierFilter !== "all" ? tierFilter : undefined,
    search: search || undefined,
  });

  // CSV export
  function exportCSV() {
    const rows = vendors.data ?? [];
    if (!rows.length) { toast.error("No vendors to export"); return; }
    const headers = ["ID", "Name", "Email", "Phone", "Country", "Status", "Tier", "Services", "Registered"];
    const lines = rows.map((v: Freelancer) => [
      v.id,
      `"${v.name}"`,
      v.email,
      v.phone ?? "",
      v.country ?? "",
      v.status,
      v.tier ?? "",
      `"${(v.services as string[])?.join(", ") ?? ""}"`,
      new Date(v.createdAt).toLocaleDateString(),
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lingora-vendors.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendor Database</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {vendors.data?.length ?? 0} vendors
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="tier1">Tier 1</SelectItem>
              <SelectItem value="tier2">Tier 2</SelectItem>
              <SelectItem value="tier3">Tier 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border border-border overflow-hidden">
          {vendors.isLoading ? (
            <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
          ) : !vendors.data?.length ? (
            <CardContent className="py-12 text-center">
              <UserPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No vendors found.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Services</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {vendors.data.map((v: Freelancer) => (
                    <tr
                      key={v.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/vendors/${v.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.country ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {v.tier ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {tierLabel(v.tier)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                        <span className="line-clamp-1">
                          {(v.services as string[])?.slice(0, 2).join(", ") ?? "—"}
                          {(v.services as string[])?.length > 2 ? ` +${(v.services as string[]).length - 2}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

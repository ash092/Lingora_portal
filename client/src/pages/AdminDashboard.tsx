import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { Freelancer, Invoice } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Users,
  ClipboardList,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Mail,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border border-border hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${accent ?? "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${accent ? "bg-red-50" : "bg-primary/5"}`}>
            <Icon className={`w-5 h-5 ${accent ?? "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const stats = trpc.admin.stats.useQuery();
  const recentInvoices = trpc.invoice.list.useQuery({ status: "submitted" });
  const pendingVendors = trpc.admin.listVendors.useQuery({ status: "pending" });

  const s = stats.data;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of the Lingora Vendor Portal</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/admin/pos/create")} className="gap-2">
            <Plus className="w-4 h-4" /> Create Purchase Order
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/vendors")} className="gap-2">
            <Search className="w-4 h-4" /> Search Vendors
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/invoices")} className="gap-2">
            <FileText className="w-4 h-4" /> Review Invoices
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/email")} className="gap-2">
            <Mail className="w-4 h-4" /> Send Email
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Vendors"
            value={s?.totalVendors ?? "—"}
            sub={`${s?.activeVendors ?? 0} active`}
            onClick={() => navigate("/admin/vendors")}
          />
          <StatCard
            icon={Clock}
            label="Pending Approvals"
            value={s?.pendingApprovals ?? "—"}
            accent={s?.pendingApprovals ? "text-yellow-600" : undefined}
            onClick={() => navigate("/admin/vendors?status=pending")}
          />
          <StatCard
            icon={ClipboardList}
            label="Open POs"
            value={s?.openPOs ?? "—"}
            sub="sent / accepted"
            onClick={() => navigate("/admin/pos")}
          />
          <StatCard
            icon={FileText}
            label="Unpaid Invoices"
            value={s?.unpaidInvoices ?? "—"}
            accent={s?.unpaidInvoices ? "text-orange-600" : undefined}
            onClick={() => navigate("/admin/invoices")}
          />
        </div>

        {/* Tier breakdown */}
        {s?.tierBreakdown && (
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Vendor Tier Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(["tier1", "tier2", "tier3"] as const).map((tier) => (
                  <div key={tier} className="text-center p-4 bg-muted/40 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {(s.tierBreakdown as Record<string, number>)[tier] ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      {tier === "tier1" ? "Tier 1 (Premium)" : tier === "tier2" ? "Tier 2 (Standard)" : "Tier 3 (Basic)"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending vendor approvals */}
          <Card className="border border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pending Vendor Approvals
              </CardTitle>
              <button
                onClick={() => navigate("/admin/vendors?status=pending")}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </CardHeader>
            <CardContent>
              {pendingVendors.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !pendingVendors.data?.length ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No pending approvals
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingVendors.data.slice(0, 5).map((v: Freelancer) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded"
                      onClick={() => navigate(`/admin/vendors/${v.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.email}</p>
                      </div>
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent submitted invoices */}
          <Card className="border border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                New Invoice Submissions
              </CardTitle>
              <button
                onClick={() => navigate("/admin/invoices")}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </CardHeader>
            <CardContent>
              {recentInvoices.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !recentInvoices.data?.length ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No pending invoices
                </div>
              ) : (
                <div className="space-y-2">
                  {recentInvoices.data.slice(0, 5).map((inv: Invoice) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded"
                      onClick={() => navigate("/admin/invoices")}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {inv.poNumber ?? `Invoice #${inv.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {inv.serviceDescription}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {inv.currency} {Number(inv.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

import type { PurchaseOrder, Invoice } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FileText, CreditCard, Clock, CheckCircle2, User } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-700",
    submitted: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    paid: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    under_review: "bg-purple-100 text-purple-700",
    draft: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export default function FreelancerDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  // Resolve freelancer profile from OAuth email to get numeric ID
  const myProfile = trpc.freelancer.getByEmail.useQuery(
    { email: user?.email ?? "" },
    { enabled: !!user?.email }
  );
  const freelancerId = myProfile.data?.id;

  const myPOs = trpc.po.getMyPOs.useQuery(
    { freelancerId: freelancerId ?? 0 },
    { enabled: !!freelancerId }
  );
  const myInvoices = trpc.invoice.getMyInvoices.useQuery(
    { freelancerId: freelancerId ?? 0 },
    { enabled: !!freelancerId }
  );

  const pendingPOs = myPOs.data?.filter((p: PurchaseOrder) => p.status === "sent") ?? [];
  const activeInvoices = myInvoices.data?.filter((i: Invoice) => ["submitted", "under_review", "approved"].includes(i.status)) ?? [];
  const paidInvoices = myInvoices.data?.filter((i: Invoice) => i.status === "paid") ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Lingora" className="h-8 w-auto" />
            <span className="font-semibold text-foreground">Vendor Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-1" /> Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your activity with Lingora.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending POs", value: pendingPOs.length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Invoices", value: activeInvoices.length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Paid Invoices", value: paidInvoices.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total POs", value: myPOs.data?.length ?? 0, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border border-border">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending POs */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Purchase Orders Awaiting Response
                {pendingPOs.length > 0 && <Badge className="bg-blue-100 text-blue-700 ml-1">{pendingPOs.length}</Badge>}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {myPOs.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pendingPOs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending purchase orders.</p>
            ) : (
              <div className="space-y-3">
                {pendingPOs.slice(0, 3).map((po: PurchaseOrder) => (
                  <div key={po.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground">{po.projectName} · {po.serviceType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{po.currency} {Number(po.totalValue).toFixed(2)}</span>
                      <Button size="sm" onClick={() => navigate("/purchase-orders")}>Respond</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Recent Invoices
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/invoices/submit")}>Submit Invoice</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>View All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {myInvoices.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !myInvoices.data?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No invoices submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {myInvoices.data.slice(0, 5).map((inv: Invoice) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{inv.poNumber ?? `INV-${inv.id}`}</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{inv.currency} {Number(inv.totalAmount).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(inv.status)}`}>{inv.status.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import type { Invoice } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, FileText, AlertCircle } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-yellow-100 text-yellow-700" },
    under_review: { label: "Under Review", cls: "bg-purple-100 text-purple-700" },
    approved: { label: "Approved", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  };
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
}

function isOverdue(dueDate: Date | string, status: string) {
  if (status === "paid") return false;
  return new Date(dueDate) < new Date();
}

export default function FreelancerInvoices() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  // Resolve freelancer profile from email to get numeric ID
  const myProfile = trpc.freelancer.getByEmail.useQuery(
    { email: user?.email ?? "" },
    { enabled: !!user?.email }
  );
  const freelancerId = myProfile.data?.id;

  const myInvoices = trpc.invoice.getMyInvoices.useQuery(
    { freelancerId: freelancerId ?? 0 },
    { enabled: !!freelancerId }
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <img src={LOGO_URL} alt="Lingora" className="h-7 w-auto" />
          <h1 className="font-semibold text-foreground flex-1">My Invoices</h1>
          <Button size="sm" onClick={() => navigate("/invoices/submit")}>
            <Plus className="w-4 h-4 mr-1" /> Submit Invoice
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {myInvoices.isLoading || myProfile.isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !myInvoices.data?.length ? (
          <Card className="border border-border">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No invoices submitted yet.</p>
              <Button onClick={() => navigate("/invoices/submit")}>Submit Your First Invoice</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myInvoices.data.map((inv: Invoice) => {
              const badge = statusBadge(inv.status);
              const overdue = isOverdue(inv.dueDate, inv.status);
              return (
                <Card key={inv.id} className={`border ${overdue ? "border-red-200" : "border-border"} hover:shadow-sm transition-shadow`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{inv.poNumber ?? `Invoice #${inv.id}`}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                          {overdue && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{inv.serviceDescription}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Submitted: {new Date(inv.createdAt).toLocaleDateString()}</span>
                          <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                          {inv.paidAt && <span className="text-emerald-600">Paid: {new Date(inv.paidAt).toLocaleDateString()}</span>}
                        </div>
                        {inv.adminNote && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Admin note: {inv.adminNote}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{inv.currency} {Number(inv.totalAmount).toFixed(2)}</p>
                        {inv.invoiceFileUrl && (
                          <a href={inv.invoiceFileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline">
                            View Invoice PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

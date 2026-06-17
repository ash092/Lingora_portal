import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Download, FileText, AlertCircle, Eye } from "lucide-react";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-700",
    under_review: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function isOverdue(dueDate: Date | string, status: string) {
  if (status === "paid") return false;
  return new Date(dueDate) < new Date();
}

function isDueSoon(dueDate: Date | string, status: string) {
  if (status === "paid") return false;
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

type Invoice = {
  id: number;
  freelancerId: number;
  poNumber: string | null;
  serviceDescription: string;
  currency: string;
  totalAmount: string | number;
  status: string;
  dueDate: Date | string;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  adminNote?: string | null;
  invoiceFileUrl?: string | null;
};

export default function AdminInvoices() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [actionInvoice, setActionInvoice] = useState<Invoice | null>(null);
  const [actionType, setActionType] = useState<"under_review" | "approved" | "rejected" | "paid" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);

  const invoices = trpc.invoice.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    overdue: overdueOnly || undefined,
  });

  const updateStatus = trpc.invoice.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated");
      setActionInvoice(null);
      setActionType(null);
      setAdminNote("");
      invoices.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  function openAction(inv: Invoice, type: "under_review" | "approved" | "rejected" | "paid") {
    setActionInvoice(inv);
    setActionType(type);
    setAdminNote("");
    setPaidAt(new Date().toISOString().split("T")[0]);
  }

  function exportCSV() {
    const rows = invoices.data ?? [];
    if (!rows.length) { toast.error("No invoices to export"); return; }
    const headers = ["ID", "PO Number", "Vendor ID", "Description", "Currency", "Amount", "Status", "Submitted", "Due", "Paid"];
    const lines = rows.map((inv: Invoice) => [
      inv.id,
      inv.poNumber ?? "",
      inv.freelancerId,
      `"${inv.serviceDescription}"`,
      inv.currency,
      Number(inv.totalAmount).toFixed(2),
      inv.status,
      new Date(inv.createdAt).toLocaleDateString(),
      new Date(inv.dueDate).toLocaleDateString(),
      inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "",
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lingora-invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {invoices.data?.length ?? 0} invoices
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${overdueOnly ? "border-red-400 bg-red-50 text-red-700" : "border-border text-muted-foreground hover:border-red-300"}`}
          >
            <AlertCircle className="w-4 h-4" />
            Overdue Only
          </button>
        </div>

        {/* Table */}
        <Card className="border border-border overflow-hidden">
          {invoices.isLoading ? (
            <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
          ) : !invoices.data?.length ? (
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices found.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">PO / Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.data.map((inv: Invoice) => {
                    const overdue = isOverdue(inv.dueDate, inv.status);
                    const dueSoon = isDueSoon(inv.dueDate, inv.status);
                    return (
                      <tr key={inv.id} className={`border-b border-border last:border-0 transition-colors ${overdue ? "bg-red-50/30" : "hover:bg-muted/20"}`}>
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {inv.poNumber ?? `#${inv.id}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-1">{inv.serviceDescription}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/vendors/${inv.freelancerId}`)}
                            className="text-primary hover:underline text-sm"
                          >
                            #{inv.freelancerId}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {inv.currency} {Number(inv.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(inv.status)}`}>
                              {inv.status.replace("_", " ")}
                            </span>
                            {overdue && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                            {dueSoon && !overdue && (
                              <span className="px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                                Due Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {inv.invoiceFileUrl && (
                              <a href={inv.invoiceFileUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="View Invoice PDF">
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            {inv.status === "submitted" && (
                              <button onClick={() => openAction(inv as Invoice, "under_review")}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                                Review
                              </button>
                            )}
                            {inv.status === "under_review" && (
                              <>
                                <button onClick={() => openAction(inv as Invoice, "approved")}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                                  Approve
                                </button>
                                <button onClick={() => openAction(inv as Invoice, "rejected")}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                  Reject
                                </button>
                              </>
                            )}
                            {inv.status === "approved" && (
                              <button onClick={() => openAction(inv as Invoice, "paid")}
                                className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors">
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Action dialog */}
      <Dialog open={!!actionInvoice && !!actionType} onOpenChange={() => { setActionInvoice(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "under_review" && "Move to Under Review"}
              {actionType === "approved" && "Approve Invoice"}
              {actionType === "rejected" && "Reject Invoice"}
              {actionType === "paid" && "Mark as Paid"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {actionInvoice && (
              <div className="text-sm text-muted-foreground">
                Invoice {actionInvoice.poNumber ?? `#${actionInvoice.id}`} —{" "}
                <span className="font-medium text-foreground">
                  {actionInvoice.currency} {Number(actionInvoice.totalAmount).toFixed(2)}
                </span>
              </div>
            )}
            {actionType === "paid" && (
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Note to Vendor {actionType === "rejected" ? "(required)" : "(optional)"}</Label>
              <Textarea
                placeholder={actionType === "rejected" ? "Reason for rejection..." : "Optional note..."}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionInvoice(null); setActionType(null); }}>Cancel</Button>
            <Button
              className={actionType === "rejected" ? "bg-red-600 hover:bg-red-700" : actionType === "paid" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              disabled={updateStatus.isPending || (actionType === "rejected" && !adminNote.trim())}
              onClick={() => {
                if (!actionInvoice || !actionType) return;
                updateStatus.mutate({
                  id: actionInvoice.id,
                  status: actionType,
                  adminNote: adminNote || undefined,
                  paidAt: actionType === "paid" ? paidAt : undefined,
                });
              }}
            >
              {updateStatus.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

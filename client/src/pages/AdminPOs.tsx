import type { PurchaseOrder } from "@shared/types";
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Plus, ClipboardList, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export default function AdminPOs() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelId, setCancelId] = useState<number | null>(null);

  const pos = trpc.po.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const cancelMutation = trpc.po.cancel.useMutation({
    onSuccess: () => {
      toast.success("PO cancelled");
      setCancelId(null);
      pos.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pos.data?.length ?? 0} purchase orders
            </p>
          </div>
          <Button onClick={() => navigate("/admin/pos/create")}>
            <Plus className="w-4 h-4 mr-2" /> Create PO
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Awaiting Response</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border border-border overflow-hidden">
          {pos.isLoading ? (
            <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
          ) : !pos.data?.length ? (
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No purchase orders found.</p>
              <Button onClick={() => navigate("/admin/pos/create")}>Create First PO</Button>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">PO Number</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pos.data.map((po: PurchaseOrder) => (
                    <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{po.poNumber}</td>
                      <td className="px-4 py-3 text-foreground max-w-[160px]">
                        <span className="line-clamp-1">{po.projectName}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {po.serviceType}
                        {po.languagePair && <span className="ml-1 text-xs">({po.languagePair})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/vendors/${po.freelancerId}`)}
                          className="text-primary hover:underline"
                        >
                          #{po.freelancerId}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {po.currency} {Number(po.totalValue).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {po.dueDate ? new Date(po.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {(po.status === "sent" || po.status === "draft") && (
                          <button
                            onClick={() => setCancelId(po.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Cancel PO"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the PO and notify the vendor. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep PO</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancelId && cancelMutation.mutate({ id: cancelId })}
            >
              Cancel PO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

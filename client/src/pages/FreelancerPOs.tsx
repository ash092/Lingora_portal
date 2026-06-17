import type { PurchaseOrder } from "@shared/types";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, FileText } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    sent: { label: "Awaiting Response", cls: "bg-blue-100 text-blue-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    declined: { label: "Declined", cls: "bg-red-100 text-red-700" },
    completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
  };
  return map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
}

export default function FreelancerPOs() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  // action values must match the backend enum: "accept" | "decline"
  const [respondPO, setRespondPO] = useState<{ id: number; poNumber: string; action: "accept" | "decline" } | null>(null);
  const [note, setNote] = useState("");

  // Backend requires freelancerId — derive from user.id (admin-issued freelancer IDs)
  // For freelancer portal, user.id from OAuth maps to the freelancer row via email lookup.
  // We use a separate query to get the freelancer profile first.
  const myProfile = trpc.freelancer.getByEmail.useQuery(
    { email: user?.email ?? "" },
    { enabled: !!user?.email }
  );
  const freelancerId = myProfile.data?.id;

  const myPOs = trpc.po.getMyPOs.useQuery(
    { freelancerId: freelancerId ?? 0 },
    { enabled: !!freelancerId }
  );

  const respondMutation = trpc.po.respond.useMutation({
    onSuccess: () => {
      toast.success(`PO ${respondPO?.action === "accept" ? "accepted" : "declined"} successfully`);
      setRespondPO(null);
      setNote("");
      myPOs.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <img src={LOGO_URL} alt="Lingora" className="h-7 w-auto" />
          <h1 className="font-semibold text-foreground">Purchase Orders</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {myPOs.isLoading || myProfile.isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !myPOs.data?.length ? (
          <Card className="border border-border">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchase orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myPOs.data.map((po: PurchaseOrder) => {
              const badge = statusBadge(po.status);
              return (
                <Card key={po.id} className="border border-border hover:shadow-sm transition-shadow">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-foreground">{po.poNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{po.projectName}</p>
                        <p className="text-sm text-muted-foreground">{po.serviceType}{po.languagePair ? ` · ${po.languagePair}` : ""}</p>
                        {po.description && <p className="text-sm text-muted-foreground mt-2">{po.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span><span className="text-muted-foreground">Qty:</span> {po.quantity} {po.unit}</span>
                          <span><span className="text-muted-foreground">Rate:</span> {po.currency} {Number(po.rate).toFixed(4)}</span>
                          <span className="font-semibold"><span className="text-muted-foreground font-normal">Total:</span> {po.currency} {Number(po.totalValue).toFixed(2)}</span>
                          {po.dueDate && <span><span className="text-muted-foreground">Due:</span> {new Date(po.dueDate).toLocaleDateString()}</span>}
                        </div>
                        {po.freelancerNote && (
                          <p className="text-xs text-muted-foreground mt-2 italic">Note: {po.freelancerNote}</p>
                        )}
                      </div>
                      {po.status === "sent" && (
                        <div className="flex gap-2 sm:flex-col">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { setRespondPO({ id: po.id, poNumber: po.poNumber, action: "accept" }); setNote(""); }}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => { setRespondPO({ id: po.id, poNumber: po.poNumber, action: "decline" }); setNote(""); }}>
                            <XCircle className="w-4 h-4 mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Respond Dialog */}
      <Dialog open={!!respondPO} onOpenChange={() => setRespondPO(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondPO?.action === "accept" ? "Accept" : "Decline"} PO {respondPO?.poNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {respondPO?.action === "accept"
                ? "You are accepting this purchase order. You can add an optional note."
                : "Please provide a reason for declining (optional but helpful for the team)."}
            </p>
            <Textarea
              placeholder="Optional note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondPO(null)}>Cancel</Button>
            <Button
              className={respondPO?.action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              onClick={() => {
                if (!respondPO || !freelancerId) return;
                respondMutation.mutate({
                  id: respondPO.id,
                  freelancerId,
                  action: respondPO.action,
                  declineReason: respondPO.action === "decline" ? (note || undefined) : undefined,
                });
              }}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? "Submitting..." : respondPO?.action === "accept" ? "Confirm Accept" : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

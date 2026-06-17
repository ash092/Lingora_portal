import type { PurchaseOrder, Invoice } from "@shared/types";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, FileText, ClipboardList, Plus, CheckCircle2, XCircle } from "lucide-react";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    submitted: "bg-yellow-100 text-yellow-700",
    under_review: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

export default function AdminVendorProfile() {
  const params = useParams<{ id: string }>();
  const vendorId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [noteText, setNoteText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newTier, setNewTier] = useState("");

  const vendor = trpc.admin.getVendor.useQuery({ id: vendorId }, { enabled: !!vendorId });
  const notes = trpc.admin.getNotes.useQuery({ freelancerId: vendorId }, { enabled: !!vendorId });
  const vendorPOs = trpc.po.list.useQuery({ freelancerId: vendorId }, { enabled: !!vendorId });
  const vendorInvoices = trpc.invoice.list.useQuery({ freelancerId: vendorId }, { enabled: !!vendorId });

  const updateStatus = trpc.admin.updateVendorStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); vendor.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateTier = trpc.admin.updateVendorTier.useMutation({
    onSuccess: () => { toast.success("Tier updated"); vendor.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const addNote = trpc.admin.addNote.useMutation({
    onSuccess: () => { toast.success("Note added"); setNoteText(""); notes.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (vendor.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading vendor profile...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!vendor.data) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Vendor not found.</p>
          <Button onClick={() => navigate("/admin/vendors")}>Back to Vendors</Button>
        </div>
      </AdminLayout>
    );
  }

  const v = vendor.data;
  // Payment info is stored in individual fields on the freelancer record

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vendors")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{v.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(v.status)}`}>
                {v.status}
              </span>
              {v.tier && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {v.tier === "tier1" ? "Tier 1" : v.tier === "tier2" ? "Tier 2" : "Tier 3"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{v.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact details */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{v.phone ?? "—"}</p></div>
                <div><p className="text-muted-foreground">Country</p><p className="font-medium">{v.country ?? "—"}</p></div>

                {v.linkedinUrl && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">LinkedIn</p>
                    <a href={v.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {v.linkedinUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {v.prozUrl && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">ProZ</p>
                    <a href={v.prozUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {v.prozUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services & Languages */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services & Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(v.services as string[])?.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{s}</span>
                    )) ?? <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground mb-1">Source Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(v.sourceLanguages as string[])?.map(l => (
                        <span key={l} className="px-2 py-0.5 bg-muted text-foreground rounded-full text-xs">{l}</span>
                      )) ?? <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Target Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(v.targetLanguages as string[])?.map(l => (
                        <span key={l} className="px-2 py-0.5 bg-muted text-foreground rounded-full text-xs">{l}</span>
                      )) ?? <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>
                {v.areasOfExpertise && (
                  <div>
                    <p className="text-muted-foreground mb-1">Areas of Expertise</p>
                    <p className="text-foreground">{v.areasOfExpertise}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment info */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium mb-2">{v.paymentMethod === "payoneer" ? "Payoneer" : "Bank Transfer"}</p>
                {v.paymentMethod === "payoneer" && v.payoneerEmail && (
                  <p className="text-muted-foreground">{v.payoneerEmail}</p>
                )}
                {v.paymentMethod === "bank_transfer" && (
                  <div className="grid grid-cols-2 gap-2">
                    {v.bankName && <div><p className="text-muted-foreground">Bank</p><p>{v.bankName}</p></div>}
                    {v.bankAccountName && <div><p className="text-muted-foreground">Account Holder</p><p>{v.bankAccountName}</p></div>}
                    {v.bankIban && <div className="col-span-2"><p className="text-muted-foreground">IBAN</p><p className="font-mono">{v.bankIban}</p></div>}
                    {v.bankSwiftCode && <div><p className="text-muted-foreground">SWIFT</p><p className="font-mono">{v.bankSwiftCode}</p></div>}
                    {v.bankCountry && <div><p className="text-muted-foreground">Country</p><p>{v.bankCountry}</p></div>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV */}
            {v.cvFileUrl && (
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">CV / Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={v.cvFileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" /> Download CV
                  </a>
                </CardContent>
              </Card>
            )}

            {/* PO History */}
            <Card className="border border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Purchase Order History</CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/pos/create?vendorId=${v.id}`)}>
                  <Plus className="w-3 h-3 mr-1" /> New PO
                </Button>
              </CardHeader>
              <CardContent>
                {!vendorPOs.data?.length ? (
                  <p className="text-sm text-muted-foreground">No POs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {vendorPOs.data.map((po: PurchaseOrder) => (
                      <div key={po.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium">{po.poNumber}</span>
                          <span className="text-muted-foreground ml-2">{po.projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{po.currency} {Number(po.totalValue).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(po.status)}`}>{po.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice History */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Invoice History</CardTitle>
              </CardHeader>
              <CardContent>
                {!vendorInvoices.data?.length ? (
                  <p className="text-sm text-muted-foreground">No invoices yet.</p>
                ) : (
                  <div className="space-y-2">
                    {vendorInvoices.data.map((inv: Invoice) => (
                      <div key={inv.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium">{inv.poNumber ?? `#${inv.id}`}</span>
                          <span className="text-muted-foreground ml-2 line-clamp-1">{inv.serviceDescription}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{inv.currency} {Number(inv.totalAmount).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(inv.status)}`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: actions */}
          <div className="space-y-5">
            {/* Status management */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus || v.status} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={!newStatus || newStatus === v.status || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: v.id, status: newStatus as "pending" | "active" | "inactive" })}
                >
                  {updateStatus.isPending ? "Updating..." : "Update Status"}
                </Button>
              </CardContent>
            </Card>

            {/* Tier assignment */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tier Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newTier || v.tier || "none"} onValueChange={setNewTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tier</SelectItem>
                    <SelectItem value="tier1">Tier 1 (Premium)</SelectItem>
                    <SelectItem value="tier2">Tier 2 (Standard)</SelectItem>
                    <SelectItem value="tier3">Tier 3 (Basic)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  disabled={!newTier || updateTier.isPending}
                  onClick={() => updateTier.mutate({ id: v.id, tier: newTier === "none" ? null : newTier as "tier1" | "tier2" | "tier3" })}
                >
                  {updateTier.isPending ? "Updating..." : "Assign Tier"}
                </Button>
                {v.tierNote && <p className="text-xs text-muted-foreground italic">{v.tierNote}</p>}
              </CardContent>
            </Card>

            {/* Internal notes */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notes.data?.length ? notes.data.map(n => (
                    <div key={n.id} className="text-xs p-2 bg-muted/40 rounded-lg">
                      <p className="font-medium text-foreground">{n.adminName}</p>
                      <p className="text-muted-foreground">{n.note}</p>
                      <p className="text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  )}
                </div>
                <Textarea
                  placeholder="Add internal note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  disabled={!noteText.trim() || addNote.isPending}
                  onClick={() => addNote.mutate({ freelancerId: v.id, note: noteText })}
                >
                  {addNote.isPending ? "Adding..." : "Add Note"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

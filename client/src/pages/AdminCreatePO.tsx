import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";

const SERVICE_TYPES = [
  "Translation", "Localization", "Transcription", "Subtitling",
  "Voice-over", "eLearning Development", "Instructional Design",
  "LMS Administration", "RTL Engineering", "QA/Proofreading", "DTP", "Content Writing",
];

export default function AdminCreatePO() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedVendorId = params.get("vendorId");

  const [, navigate] = useLocation();
  const [created, setCreated] = useState<{ poNumber: string } | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState(preselectedVendorId ?? "");

  const vendors = trpc.admin.listVendors.useQuery(
    { status: "active", search: vendorSearch || undefined },
    { enabled: true }
  );

  const selectedVendor = vendors.data?.find((v: { id: number; name: string; email: string }) => v.id.toString() === selectedVendorId);

  const [form, setForm] = useState({
    projectName: "",
    serviceType: "",
    languagePair: "",
    description: "",
    quantity: "",
    unit: "per word",
    rate: "",
    currency: "USD" as "USD" | "EUR" | "EGP",
    dueDate: "",
    freelancerNote: "",
  });

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.rate) || 0);

  const createMutation = trpc.po.create.useMutation({
    onSuccess: (data) => setCreated({ poNumber: data.poNumber }),
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!selectedVendorId) { toast.error("Please select a vendor"); return; }
    if (!form.projectName || !form.serviceType || !form.quantity || !form.rate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      freelancerId: parseInt(selectedVendorId),
      projectName: form.projectName,
      serviceType: form.serviceType,
      languagePair: form.languagePair || undefined,
      description: form.description || undefined,
      quantity: form.quantity,
      unit: form.unit,
      rate: form.rate,
      totalValue: total.toFixed(2),
      currency: form.currency,
      dueDate: form.dueDate || undefined,
      freelancerNote: form.freelancerNote || undefined,
    });
  }

  if (created) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">PO Created & Sent!</h2>
          <p className="text-muted-foreground mb-2">
            Purchase order <span className="font-mono font-semibold">{created.poNumber}</span> has been created and sent to the vendor.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            The vendor will receive an email notification and can accept or decline from their dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/admin/pos")}>View All POs</Button>
            <Button onClick={() => { setCreated(null); setForm({ projectName: "", serviceType: "", languagePair: "", description: "", quantity: "", unit: "per word", rate: "", currency: "USD", dueDate: "", freelancerNote: "" }); setSelectedVendorId(""); }}>
              Create Another
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/pos")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Create Purchase Order</h1>
        </div>

        <Card className="border border-border">
          <CardContent className="pt-6 pb-6 space-y-6">
            {/* Vendor selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Vendor *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search active vendors..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {selectedVendor ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{selectedVendor.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedVendor.email}</p>
                  </div>
                  <button onClick={() => setSelectedVendorId("")} className="text-muted-foreground hover:text-foreground text-sm">
                    Change
                  </button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {vendors.data?.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No active vendors found.</p>
                  ) : (
                    vendors.data?.map((v: { id: number; name: string; email: string; status: string; tier: string | null }) => (
                      <button
                        key={v.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        onClick={() => { setSelectedVendorId(v.id.toString()); setVendorSearch(""); }}
                      >
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Project details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Project Details</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Project Name *</Label>
                  <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="e.g. Almentor Module 3 Arabic Localization" />
                </div>
                <div className="space-y-1.5">
                  <Label>Service Type *</Label>
                  <Select value={form.serviceType} onValueChange={v => setForm(f => ({ ...f, serviceType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select service..." /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language Pair</Label>
                  <Input value={form.languagePair} onChange={e => setForm(f => ({ ...f, languagePair: e.target.value }))} placeholder="e.g. EN > AR" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Scope of work, deliverables, special instructions..." />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Pricing */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Pricing</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity *</Label>
                  <Input type="number" min="0" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="2500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit *</Label>
                  <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per word">per word</SelectItem>
                      <SelectItem value="per hour">per hour</SelectItem>
                      <SelectItem value="per minute">per minute</SelectItem>
                      <SelectItem value="per page">per page</SelectItem>
                      <SelectItem value="flat rate">flat rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rate *</Label>
                  <Input type="number" min="0" step="0.0001" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="0.05" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v as "USD" | "EUR" | "EGP" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="EGP">EGP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {total > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Value</span>
                  <span className="text-xl font-bold text-primary">{form.currency} {total.toFixed(2)}</span>
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Dates & notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Delivery Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Note to Vendor</Label>
                <Textarea value={form.freelancerNote} onChange={e => setForm(f => ({ ...f, freelancerNote: e.target.value }))} rows={2} placeholder="Any additional instructions for the vendor..." />
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating & Sending..." : "Create & Send PO"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

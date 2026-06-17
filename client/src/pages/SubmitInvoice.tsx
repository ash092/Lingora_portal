import type { PurchaseOrder } from "@shared/types";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, X, CheckCircle2 } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

export default function SubmitInvoice() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

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
  const acceptedPOs = myPOs.data?.filter((p: PurchaseOrder) => p.status === "accepted") ?? [];

  const [form, setForm] = useState({
    poId: "" as string,
    serviceDescription: "",
    languagePair: "",
    quantity: "",
    unit: "per word",
    rate: "",
    currency: "USD" as "USD" | "EUR" | "EGP",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceFileBase64: "",
    invoiceFileName: "",
  });

  const submitMutation = trpc.invoice.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message),
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setForm(f => ({ ...f, invoiceFileBase64: base64, invoiceFileName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  // Auto-fill from selected PO
  function handlePOSelect(poId: string) {
    const po = acceptedPOs.find((p: PurchaseOrder) => p.id.toString() === poId);
    if (po) {
      setForm(f => ({
        ...f, poId,
        serviceDescription: po.description ?? po.projectName,
        languagePair: po.languagePair ?? "",
        quantity: po.quantity.toString(),
        unit: po.unit,
        rate: po.rate.toString(),
        currency: po.currency,
      }));
    } else {
      setForm(f => ({ ...f, poId }));
    }
  }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.rate) || 0);
  const dueDate = new Date(form.invoiceDate);
  dueDate.setDate(dueDate.getDate() + 45);

  function handleSubmit() {
    if (!freelancerId) {
      toast.error("Freelancer profile not found. Please complete registration first.");
      return;
    }
    if (!form.serviceDescription || !form.quantity || !form.rate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitMutation.mutate({
      freelancerId,
      poId: form.poId && form.poId !== "none" ? parseInt(form.poId) : undefined,
      serviceDescription: form.serviceDescription,
      languagePair: form.languagePair || undefined,
      quantity: form.quantity,
      unit: form.unit,
      rate: form.rate,
      currency: form.currency,
      totalAmount: total.toFixed(2),
      invoiceDate: form.invoiceDate,
      invoiceFileBase64: form.invoiceFileBase64 || "",
      invoiceFileName: form.invoiceFileName || "invoice.pdf",
    });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="pt-10 pb-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Invoice Submitted!</h2>
            <p className="text-muted-foreground mb-2">Your invoice has been submitted for review.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Payment is due by <strong>{dueDate.toLocaleDateString()}</strong> (Net 45).
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/invoices")}>View Invoices</Button>
              <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <img src={LOGO_URL} alt="Lingora" className="h-7 w-auto" />
          <h1 className="font-semibold text-foreground">Submit Invoice</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="border border-border">
          <CardContent className="pt-6 pb-6 space-y-5">
            {/* Link to PO */}
            <div className="space-y-1.5">
              <Label>Link to Purchase Order (optional)</Label>
              <Select value={form.poId} onValueChange={handlePOSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an accepted PO..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No PO (standalone invoice)</SelectItem>
                  {acceptedPOs.map((po: PurchaseOrder) => (
                    <SelectItem key={po.id} value={po.id.toString()}>
                      {po.poNumber} — {po.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service description */}
            <div className="space-y-1.5">
              <Label>Service Description *</Label>
              <Textarea value={form.serviceDescription} onChange={e => setForm(f => ({ ...f, serviceDescription: e.target.value }))}
                placeholder="e.g. Arabic translation of Module 3 — 2,500 words" rows={2} />
            </div>

            {/* Language pair */}
            <div className="space-y-1.5">
              <Label>Language Pair</Label>
              <Input value={form.languagePair} onChange={e => setForm(f => ({ ...f, languagePair: e.target.value }))} placeholder="e.g. EN > AR" />
            </div>

            {/* Quantity, unit, rate, currency */}
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

            {/* Total */}
            {total > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">{form.currency} {total.toFixed(2)}</span>
              </div>
            )}

            {/* Invoice date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Invoice Date *</Label>
                <Input type="date" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Due (Net 45)</Label>
                <Input type="date" value={dueDate.toISOString().split("T")[0]} disabled className="bg-muted" />
              </div>
            </div>

            {/* Invoice PDF */}
            <div className="space-y-1.5">
              <Label>Invoice PDF (optional)</Label>
              {form.invoiceFileName ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm flex-1 truncate">{form.invoiceFileName}</span>
                  <button onClick={() => setForm(f => ({ ...f, invoiceFileBase64: "", invoiceFileName: "" }))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-5 cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Upload your invoice PDF</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
                </label>
              )}
            </div>

            <Button className="w-full" size="lg"
              disabled={submitMutation.isPending || !form.serviceDescription || !form.quantity || !form.rate}
              onClick={handleSubmit}>
              {submitMutation.isPending ? "Submitting..." : "Submit Invoice"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

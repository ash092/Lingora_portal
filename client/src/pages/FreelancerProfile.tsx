import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, X, Save } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";
const SERVICES = ["Translation", "Localization", "Transcription", "Subtitling", "Voice-over", "eLearning Development", "Instructional Design", "LMS Administration", "RTL Engineering", "QA/Proofreading", "DTP", "Content Writing"];
const LANGUAGES = ["Arabic", "English", "French", "Spanish", "German", "Italian", "Portuguese", "Turkish", "Hebrew", "Persian", "Urdu", "Hindi", "Chinese", "Japanese", "Korean", "Russian"];

export default function FreelancerProfile() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  // Get profile by the logged-in user's email
  const myProfile = trpc.freelancer.getByEmail.useQuery(
    { email: user?.email ?? "" },
    { enabled: !!user?.email }
  );

  const updateMutation = trpc.freelancer.updateMyProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      myProfile.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    phone: "",
    linkedinUrl: "",
    prozUrl: "",
    services: [] as string[],
    sourceLanguages: [] as string[],
    targetLanguages: [] as string[],
    paymentMethod: "payoneer" as "payoneer" | "bank_transfer",
    payoneerEmail: "",
    bankName: "",
    bankAccountName: "",
    bankIban: "",
    bankSwiftCode: "",
    bankCountry: "",
    cvFileBase64: "",
    cvFileName: "",
  });

  useEffect(() => {
    if (myProfile.data) {
      const p = myProfile.data;
      setForm({
        phone: p.phone ?? "",
        linkedinUrl: p.linkedinUrl ?? "",
        prozUrl: p.prozUrl ?? "",
        services: (p.services as string[]) ?? [],
        sourceLanguages: (p.sourceLanguages as string[]) ?? [],
        targetLanguages: (p.targetLanguages as string[]) ?? [],
        paymentMethod: (p.paymentMethod as "payoneer" | "bank_transfer") ?? "payoneer",
        payoneerEmail: p.payoneerEmail ?? "",
        bankName: p.bankName ?? "",
        bankAccountName: p.bankAccountName ?? "",
        bankIban: p.bankIban ?? "",
        bankSwiftCode: p.bankSwiftCode ?? "",
        bankCountry: p.bankCountry ?? "",
        cvFileBase64: "",
        cvFileName: "",
      });
    }
  }, [myProfile.data]);

  function toggleArr(key: "services" | "sourceLanguages" | "targetLanguages", val: string) {
    const arr = form[key];
    setForm(f => ({ ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setForm(f => ({ ...f, cvFileBase64: base64, cvFileName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!myProfile.data?.id) return;
    updateMutation.mutate({
      id: myProfile.data.id,
      phone: form.phone || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      prozUrl: form.prozUrl || undefined,
      services: form.services,
      sourceLanguages: form.sourceLanguages,
      targetLanguages: form.targetLanguages,
      paymentMethod: form.paymentMethod,
      payoneerEmail: form.paymentMethod === "payoneer" ? form.payoneerEmail : undefined,
      bankName: form.paymentMethod === "bank_transfer" ? form.bankName : undefined,
      bankAccountName: form.paymentMethod === "bank_transfer" ? form.bankAccountName : undefined,
      bankIban: form.paymentMethod === "bank_transfer" ? form.bankIban : undefined,
      bankSwiftCode: form.paymentMethod === "bank_transfer" ? form.bankSwiftCode : undefined,
      bankCountry: form.paymentMethod === "bank_transfer" ? form.bankCountry : undefined,
      cvFileBase64: form.cvFileBase64 || undefined,
      cvFileName: form.cvFileName || undefined,
    });
  }

  if (myProfile.isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading profile...</p></div>;

  if (!myProfile.data) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">No vendor profile found for this account.</p>
        <Button onClick={() => navigate("/register")}>Register as Vendor</Button>
      </div>
    </div>
  );

  const p = myProfile.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <img src={LOGO_URL} alt="Lingora" className="h-7 w-auto" />
          <h1 className="font-semibold text-foreground flex-1">My Profile</h1>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-1" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">{p.name}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : p.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
            {p.status}
          </span>
          {p.tier && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.tier}</span>}
        </div>

        {/* Contact info */}
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={p.name} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={p.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+20..." />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={p.country ?? ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1.5">
                <Label>ProZ URL</Label>
                <Input value={form.prozUrl} onChange={e => setForm(f => ({ ...f, prozUrl: e.target.value }))} placeholder="https://proz.com/..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services & Languages */}
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services & Languages</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Services</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => (
                  <button key={s} type="button" onClick={() => toggleArr("services", s)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.services.includes(s) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Source Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggleArr("sourceLanguages", l)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.sourceLanguages.includes(l) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Target Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggleArr("targetLanguages", l)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.targetLanguages.includes(l) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(["payoneer", "bank_transfer"] as const).map(method => (
                <button key={method} type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: method }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${form.paymentMethod === method ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <p className="font-semibold text-sm">{method === "payoneer" ? "Payoneer" : "Bank Transfer"}</p>
                </button>
              ))}
            </div>
            {form.paymentMethod === "payoneer" && (
              <div className="space-y-1.5">
                <Label>Payoneer Email</Label>
                <Input value={form.payoneerEmail} onChange={e => setForm(f => ({ ...f, payoneerEmail: e.target.value }))} placeholder="your@payoneer.com" />
              </div>
            )}
            {form.paymentMethod === "bank_transfer" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Holder Name</Label>
                  <Input value={form.bankAccountName} onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>IBAN</Label>
                  <Input value={form.bankIban} onChange={e => setForm(f => ({ ...f, bankIban: e.target.value }))} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>SWIFT / BIC</Label>
                  <Input value={form.bankSwiftCode} onChange={e => setForm(f => ({ ...f, bankSwiftCode: e.target.value }))} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Bank Country</Label>
                  <Input value={form.bankCountry} onChange={e => setForm(f => ({ ...f, bankCountry: e.target.value }))} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">CV / Portfolio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {p.cvFileUrl && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Current CV:</span>
                <a href={p.cvFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {p.cvFileName ?? "Download"}
                </a>
              </div>
            )}
            {form.cvFileName ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm flex-1 truncate">{form.cvFileName}</span>
                <button onClick={() => setForm(f => ({ ...f, cvFileBase64: "", cvFileName: "" }))} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-5 cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">Upload new CV (PDF)</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
              </label>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

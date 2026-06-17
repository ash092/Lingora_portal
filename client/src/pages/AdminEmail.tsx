import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, CheckCircle2, Plus, Trash2, Users, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Full language list (same as Register.tsx)
const LANGUAGES = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian",
  "Bengali","Bosnian","Bulgarian","Catalan","Cebuano","Chinese (Simplified)","Chinese (Traditional)",
  "Corsican","Croatian","Czech","Danish","Dutch","English","Esperanto","Estonian","Finnish",
  "French","Frisian","Galician","Georgian","German","Greek","Gujarati","Haitian Creole","Hausa",
  "Hawaiian","Hebrew","Hindi","Hmong","Hungarian","Icelandic","Igbo","Indonesian","Irish",
  "Italian","Japanese","Javanese","Kannada","Kazakh","Khmer","Kinyarwanda","Korean","Kurdish",
  "Kyrgyz","Lao","Latin","Latvian","Lithuanian","Luxembourgish","Macedonian","Malagasy","Malay",
  "Malayalam","Maltese","Maori","Marathi","Mongolian","Myanmar (Burmese)","Nepali","Norwegian",
  "Nyanja (Chichewa)","Odia (Oriya)","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian",
  "Russian","Samoan","Scots Gaelic","Serbian","Sesotho","Shona","Sindhi","Sinhala","Slovak",
  "Slovenian","Somali","Spanish","Sundanese","Swahili","Swedish","Tagalog (Filipino)","Tajik",
  "Tamil","Tatar","Telugu","Thai","Turkish","Turkmen","Ukrainian","Urdu","Uyghur","Uzbek",
  "Vietnamese","Welsh","Xhosa","Yiddish","Yoruba","Zulu",
];

type Recipient = {
  id: number;
  name: string;
  email: string;
  tier?: string | null;
  sourceLanguages?: string[] | null;
  targetLanguages?: string[] | null;
};

export default function AdminEmail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterTier, setFilterTier] = useState("all");
  const [filterSourceLang, setFilterSourceLang] = useState("all");
  const [filterTargetLang, setFilterTargetLang] = useState("all");
  const [searchRecipients, setSearchRecipients] = useState("");

  // Manual deselection: track which IDs are unchecked
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());

  const [sent, setSent] = useState<{ sentCount: number; failedCount: number } | null>(null);

  // Template management
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  const templates = trpc.email.listTemplates.useQuery();

  // Live recipient preview — debounced via enabled flag
  const previewQuery = trpc.email.previewRecipients.useQuery(
    {
      filterStatus: filterStatus !== "all" ? filterStatus : undefined,
      filterTier: filterTier !== "all" ? filterTier : undefined,
      filterSourceLanguage: filterSourceLang !== "all" ? filterSourceLang : undefined,
      filterTargetLanguage: filterTargetLang !== "all" ? filterTargetLang : undefined,
    },
    { refetchOnWindowFocus: false }
  );

  // Reset deselections when filters change
  useEffect(() => {
    setDeselectedIds(new Set());
  }, [filterStatus, filterTier, filterSourceLang, filterTargetLang]);

  const allRecipients: Recipient[] = previewQuery.data ?? [];

  // Apply search filter on top of the server-filtered list
  const filteredRecipients = useMemo(() => {
    if (!searchRecipients.trim()) return allRecipients;
    const q = searchRecipients.toLowerCase();
    return allRecipients.filter(r =>
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [allRecipients, searchRecipients]);

  // Final recipients = filtered list minus manually deselected
  const selectedRecipients = filteredRecipients.filter(r => !deselectedIds.has(r.id));
  const selectedCount = selectedRecipients.length;

  function toggleRecipient(id: number) {
    setDeselectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (deselectedIds.size === 0) {
      // Deselect all currently visible
      setDeselectedIds(new Set(filteredRecipients.map(r => r.id)));
    } else {
      setDeselectedIds(new Set());
    }
  }

  const sendMutation = trpc.email.send.useMutation({
    onSuccess: (data) => {
      setSent({ sentCount: data.sentCount, failedCount: data.failedCount });
      toast.success(`Email sent to ${data.sentCount} vendors`);
    },
    onError: (e) => toast.error(e.message),
  });

  const createTemplate = trpc.email.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template saved");
      setShowTemplateDialog(false);
      setTemplateName(""); setTemplateSubject(""); setTemplateBody("");
      templates.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTemplate = trpc.email.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template deleted"); templates.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function loadTemplate(t: { subject: string; body: string }) {
    setSubject(t.subject);
    setBody(t.body);
  }

  function handleSend() {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body are required"); return; }
    if (selectedCount === 0) { toast.error("No recipients selected"); return; }
    sendMutation.mutate({
      subject,
      body,
      // Pass the exact IDs we want to send to (respects manual deselection)
      recipientIds: selectedRecipients.map(r => r.id),
      filterStatus: filterStatus !== "all" ? filterStatus : undefined,
      filterTier: filterTier !== "all" ? filterTier : undefined,
      filterSourceLanguage: filterSourceLang !== "all" ? filterSourceLang : undefined,
      filterTargetLanguage: filterTargetLang !== "all" ? filterTargetLang : undefined,
    });
  }

  if (sent) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Emails Sent!</h2>
          <p className="text-muted-foreground mb-2">
            Successfully sent to <span className="font-bold text-foreground">{sent.sentCount}</span> vendors.
            {sent.failedCount > 0 && <span className="text-red-600"> {sent.failedCount} failed.</span>}
          </p>
          <Button className="mt-6" onClick={() => { setSent(null); setSubject(""); setBody(""); }}>
            Send Another Email
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Filter vendors by status, tier, or language pair — then review and adjust the recipient list before sending.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Compose + Filters */}
          <div className="xl:col-span-2 space-y-5">

            {/* Filters */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Recipient Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Vendor Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tier</Label>
                    <Select value={filterTier} onValueChange={setFilterTier}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="tier1">Tier 1</SelectItem>
                        <SelectItem value="tier2">Tier 2</SelectItem>
                        <SelectItem value="tier3">Tier 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Source Language</Label>
                    <Select value={filterSourceLang} onValueChange={setFilterSourceLang}>
                      <SelectTrigger><SelectValue placeholder="Any source language" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Any Source Language</SelectItem>
                        {LANGUAGES.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Language</Label>
                    <Select value={filterTargetLang} onValueChange={setFilterTargetLang}>
                      <SelectTrigger><SelectValue placeholder="Any target language" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Any Target Language</SelectItem>
                        {LANGUAGES.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active filter badges */}
                {(filterSourceLang !== "all" || filterTargetLang !== "all" || filterTier !== "all") && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {filterTier !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {filterTier}
                        <button onClick={() => setFilterTier("all")}><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                    {filterSourceLang !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Source: {filterSourceLang}
                        <button onClick={() => setFilterSourceLang("all")}><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                    {filterTargetLang !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Target: {filterTargetLang}
                        <button onClick={() => setFilterTargetLang("all")}><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compose */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Compose Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
                </div>

                <div className="space-y-1.5">
                  <Label>Message Body *</Label>
                  <p className="text-xs text-muted-foreground">Use {"{{name}}"} to personalize with the vendor's name.</p>
                  <Textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={10}
                    placeholder={`Dear {{name}},\n\nYour message here...\n\nBest regards,\nLingora Team`}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !subject.trim() || !body.trim() || selectedCount === 0}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendMutation.isPending
                      ? "Sending..."
                      : `Send to ${selectedCount} Vendor${selectedCount !== 1 ? "s" : ""}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!subject.trim() || !body.trim()) { toast.error("Fill in subject and body first"); return; }
                      setTemplateName(""); setTemplateSubject(subject); setTemplateBody(body);
                      setShowTemplateDialog(true);
                    }}
                  >
                    Save as Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Recipient list + Templates */}
          <div className="space-y-4">

            {/* Recipient preview */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Recipients
                  </CardTitle>
                  <Badge variant={selectedCount > 0 ? "default" : "secondary"} className="gap-1">
                    <Users className="w-3 h-3" />
                    {previewQuery.isLoading ? "..." : selectedCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search within results */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8 h-8 text-sm"
                    placeholder="Search by name or email..."
                    value={searchRecipients}
                    onChange={e => setSearchRecipients(e.target.value)}
                  />
                </div>

                {/* Select / deselect all */}
                {filteredRecipients.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                    <button
                      className="hover:text-foreground transition-colors font-medium"
                      onClick={toggleAll}
                    >
                      {deselectedIds.size === 0 ? "Deselect all" : "Select all"}
                    </button>
                    <span>{selectedCount} / {filteredRecipients.length} selected</span>
                  </div>
                )}

                {/* Vendor list */}
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {previewQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading vendors...</p>
                  ) : filteredRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {allRecipients.length === 0
                        ? "No vendors match the current filters."
                        : "No results for your search."}
                    </p>
                  ) : (
                    filteredRecipients.map(r => {
                      const isSelected = !deselectedIds.has(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "hover:bg-muted/40" : "opacity-50 hover:bg-muted/20"
                          }`}
                          onClick={() => toggleRecipient(r.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRecipient(r.id)}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.tier && (
                                <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                  {r.tier}
                                </Badge>
                              )}
                              {r.sourceLanguages?.slice(0, 2).map(l => (
                                <Badge key={l} variant="secondary" className="text-xs px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                  {l}
                                </Badge>
                              ))}
                              {(r.sourceLanguages?.length ?? 0) > 2 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                  +{(r.sourceLanguages?.length ?? 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card className="border border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Templates</CardTitle>
                <button
                  onClick={() => { setTemplateName(""); setTemplateSubject(""); setTemplateBody(""); setShowTemplateDialog(true); }}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                {templates.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !templates.data?.length ? (
                  <p className="text-sm text-muted-foreground">No templates yet.</p>
                ) : (
                  <div className="space-y-2">
                    {templates.data.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <button
                          className="flex-1 text-left"
                          onClick={() => loadTemplate(t)}
                        >
                          <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                        </button>
                        <button
                          onClick={() => deleteTemplate.mutate({ id: t.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Monthly Update" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={templateSubject} onChange={e => setTemplateSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea value={templateBody} onChange={e => setTemplateBody(e.target.value)} rows={6} className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createTemplate.mutate({ name: templateName, subject: templateSubject, body: templateBody })}
              disabled={!templateName.trim() || !templateSubject.trim() || !templateBody.trim() || createTemplate.isPending}
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getVendorLoginUrl } from "@/const";
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, X, ChevronsUpDown, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

// ─── Constants ──────────────────────────────────────────────────────────────

const SERVICES = [
  "Translation", "Localization", "Transcription", "Subtitling",
  "Voice-over", "eLearning Development", "Instructional Design",
  "LMS Administration", "RTL Engineering", "QA/Proofreading", "DTP", "Content Writing",
];

// Services that require language pairs
const LANGUAGE_SERVICES = new Set([
  "Translation", "Localization", "Transcription", "Subtitling",
  "Voice-over", "QA/Proofreading",
]);

// Services that use CAT tools
const CAT_TOOL_SERVICES = new Set([
  "Translation", "Localization", "QA/Proofreading",
]);

// Services that use authoring tools
const AUTHORING_TOOL_SERVICES = new Set([
  "eLearning Development", "Instructional Design", "LMS Administration",
]);

// Full ISO 639-1 language list (200+ languages)
const ALL_LANGUAGES = [
  "Afar", "Abkhazian", "Afrikaans", "Akan", "Albanian", "Amharic", "Arabic",
  "Aragonese", "Armenian", "Assamese", "Avaric", "Avestan", "Aymara",
  "Azerbaijani", "Bambara", "Bashkir", "Basque", "Belarusian", "Bengali",
  "Bihari", "Bislama", "Bosnian", "Breton", "Bulgarian", "Burmese",
  "Catalan", "Chamorro", "Chechen", "Chichewa", "Chinese (Simplified)",
  "Chinese (Traditional)", "Chuvash", "Cornish", "Corsican", "Cree",
  "Croatian", "Czech", "Danish", "Divehi", "Dutch", "Dzongkha",
  "English", "Esperanto", "Estonian", "Ewe", "Faroese", "Fijian",
  "Finnish", "French", "Fula", "Galician", "Georgian", "German",
  "Greek", "Guaraní", "Gujarati", "Haitian Creole", "Hausa", "Hebrew",
  "Herero", "Hindi", "Hiri Motu", "Hungarian", "Interlingua", "Indonesian",
  "Interlingue", "Irish", "Igbo", "Inupiaq", "Ido", "Icelandic",
  "Italian", "Inuktitut", "Japanese", "Javanese", "Kalaallisut",
  "Kannada", "Kanuri", "Kashmiri", "Kazakh", "Khmer", "Kikuyu",
  "Kinyarwanda", "Kirghiz", "Komi", "Kongo", "Korean", "Kurdish",
  "Kwanyama", "Latin", "Luxembourgish", "Luganda", "Limburgish",
  "Lingala", "Lao", "Lithuanian", "Luba-Katanga", "Latvian", "Manx",
  "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Māori",
  "Marathi", "Marshallese", "Mongolian", "Nauru", "Navajo", "Norwegian Bokmål",
  "North Ndebele", "Nepali", "Ndonga", "Norwegian Nynorsk", "Norwegian",
  "Nuosu", "South Ndebele", "Occitan", "Ojibwe", "Old Church Slavonic",
  "Oromo", "Oriya", "Ossetian", "Panjabi", "Pāli", "Pashto", "Persian",
  "Polish", "Pashto", "Portuguese", "Quechua", "Romansh", "Kirundi",
  "Romanian", "Russian", "Sanskrit", "Sardinian", "Sindhi", "Northern Sami",
  "Samoan", "Sango", "Serbian", "Scottish Gaelic", "Shona", "Sinhala",
  "Slovak", "Slovenian", "Somali", "Southern Sotho", "Spanish", "Sundanese",
  "Swahili", "Swati", "Swedish", "Tamil", "Telugu", "Tajik", "Thai",
  "Tigrinya", "Tibetan", "Turkmen", "Tagalog", "Tswana", "Tonga",
  "Turkish", "Tsonga", "Tatar", "Twi", "Tahitian", "Uyghur", "Ukrainian",
  "Urdu", "Uzbek", "Venda", "Vietnamese", "Volapük", "Walloon", "Welsh",
  "Wolof", "Western Frisian", "Xhosa", "Yiddish", "Yoruba", "Zhuang", "Zulu",
];

const CAT_TOOLS = ["SDL Trados", "memoQ", "Wordfast", "OmegaT", "Memsource", "Smartcat", "Phrase", "Déjà Vu", "Other"];
const AUTHORING_TOOLS = ["Articulate Storyline", "Adobe Captivate", "iSpring", "Lectora", "Rise 360", "Camtasia", "Adobe Premiere", "Final Cut Pro", "Other"];
const COUNTRIES = [
  "Egypt", "Saudi Arabia", "UAE", "Jordan", "Lebanon", "Tunisia", "Morocco",
  "Algeria", "Iraq", "Kuwait", "Qatar", "Bahrain", "Oman", "Yemen", "Libya",
  "Sudan", "Palestine", "Syria", "Afghanistan", "Pakistan", "India", "Turkey",
  "United Kingdom", "United States", "Canada", "Germany", "France", "Spain",
  "Italy", "Netherlands", "Belgium", "Switzerland", "Sweden", "Norway",
  "Denmark", "Finland", "Poland", "Czech Republic", "Romania", "Hungary",
  "Greece", "Portugal", "Austria", "Other",
];

const RATE_UNITS = ["per word", "per hour", "per minute", "per page", "flat rate"];
const WORD_BASED_UNIT = "per word";

// ─── Step definitions ────────────────────────────────────────────────────────

type StepId =
  | "personal"
  | "services"
  | "languages"
  | "tools"
  | "rates"
  | "payment"
  | "files";

// ─── Language combobox ───────────────────────────────────────────────────────

function LanguageCombobox({
  placeholder,
  selected,
  onToggle,
}: {
  placeholder: string;
  selected: string[];
  onToggle: (lang: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-white"
        >
          {selected.length === 0
            ? placeholder
            : selected.length === 1
            ? selected[0]
            : `${selected.length} languages selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList className="max-h-60">
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {ALL_LANGUAGES.map((lang) => (
                <CommandItem key={lang} value={lang} onSelect={() => onToggle(lang)}>
                  <Check
                    className={cn("mr-2 h-4 w-4", selected.includes(lang) ? "opacity-100" : "opacity-0")}
                  />
                  {lang}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Register() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from Google OAuth redirect query params
  const searchParams = new URLSearchParams(window.location.search);
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillName = searchParams.get("name") ?? "";
  const fromGoogle = searchParams.get("google") === "1";

  const [form, setForm] = useState({
    name: prefillName,
    email: prefillEmail,
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    linkedinUrl: "",
    prozUrl: "",
    services: [] as string[],
    sourceLanguages: [] as string[],
    targetLanguages: [] as string[],
    areasOfExpertise: "",
    catTools: [] as string[],
    authoringTools: [] as string[],
    paymentMethod: "payoneer" as "payoneer" | "bank_transfer",
    payoneerEmail: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIban: "",
    bankSwiftCode: "",
    bankCountry: "",
    cvFileBase64: "",
    cvFileName: "",
    portfolioFilesBase64: [] as { base64: string; name: string }[],
    rates: {} as Record<string, { rate: string; currency: string; unit: string }>,
  });

  // Compute which steps are needed based on selected services
  const needsLanguages = form.services.some(s => LANGUAGE_SERVICES.has(s));
  const needsCatTools = form.services.some(s => CAT_TOOL_SERVICES.has(s));
  const needsAuthoringTools = form.services.some(s => AUTHORING_TOOL_SERVICES.has(s));
  const needsTools = needsCatTools || needsAuthoringTools;

  const STEPS: { id: StepId; label: string }[] = useMemo(() => {
    const steps: { id: StepId; label: string }[] = [
      { id: "personal", label: "Personal Info" },
      { id: "services", label: "Services" },
    ];
    if (needsLanguages) steps.push({ id: "languages", label: "Languages" });
    if (needsTools) steps.push({ id: "tools", label: "Tools" });
    steps.push(
      { id: "rates", label: "Rates" },
      { id: "payment", label: "Payment" },
      { id: "files", label: "Files" },
    );
    return steps;
  }, [needsLanguages, needsTools]);

  const [stepId, setStepId] = useState<StepId>("personal");
  const stepIdx = STEPS.findIndex(s => s.id === stepId);
  const isLast = stepIdx === STEPS.length - 1;

  const registerMutation = trpc.freelancer.register.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message),
  });

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function toggleArr(key: "services" | "sourceLanguages" | "targetLanguages" | "catTools" | "authoringTools", val: string) {
    const arr = form[key] as string[];
    setField(key, (arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]) as never);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: "cv" | "portfolio") {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        if (field === "cv") {
          setForm(f => ({ ...f, cvFileBase64: base64, cvFileName: file.name }));
        } else {
          if (form.portfolioFilesBase64.length >= 3) {
            toast.error("Maximum 3 portfolio files allowed.");
            return;
          }
          setForm(f => ({ ...f, portfolioFilesBase64: [...f.portfolioFilesBase64, { base64, name: file.name }] }));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Per-step validation ────────────────────────────────────────────────────

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (stepId === "personal") {
      if (!form.name.trim() || form.name.trim().length < 2)
        newErrors.name = "Full name is required (at least 2 characters).";
      if (!form.email.trim())
        newErrors.email = "Email is required.";
      else if (!validateEmail(form.email))
        newErrors.email = "Please enter a valid email address.";
      if (!fromGoogle) {
        if (!form.password)
          newErrors.password = "Password is required.";
        else if (form.password.length < 8)
          newErrors.password = "Password must be at least 8 characters.";
        if (form.confirmPassword !== form.password)
          newErrors.confirmPassword = "Passwords do not match.";
      }
      if (!form.country)
        newErrors.country = "Please select your country.";
    }

    if (stepId === "services") {
      if (form.services.length === 0)
        newErrors.services = "Please select at least one service.";
    }

    if (stepId === "languages") {
      if (needsLanguages) {
        if (form.sourceLanguages.length === 0)
          newErrors.sourceLanguages = "Please select at least one source language.";
        if (form.targetLanguages.length === 0)
          newErrors.targetLanguages = "Please select at least one target language.";
      }
    }

    if (stepId === "payment") {
      if (form.paymentMethod === "payoneer") {
        if (!form.payoneerEmail.trim())
          newErrors.payoneerEmail = "Payoneer email is required.";
        else if (!validateEmail(form.payoneerEmail))
          newErrors.payoneerEmail = "Please enter a valid Payoneer email.";
      } else {
        if (!form.bankName.trim()) newErrors.bankName = "Bank name is required.";
        if (!form.bankAccountName.trim()) newErrors.bankAccountName = "Account holder name is required.";
        if (!form.bankIban.trim()) newErrors.bankIban = "IBAN is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    // If moving from "services" and next step would be "languages" but not needed, skip
    const next = STEPS[stepIdx + 1];
    if (next) setStepId(next.id);
  }

  function goBack() {
    const prev = STEPS[stepIdx - 1];
    if (prev) setStepId(prev.id);
  }

  function handleSubmit() {
    if (!validateStep()) return;
    // Convert rate values from string to number
    const numericRates: Record<string, { rate: number; currency: string; unit: string }> = {};
    for (const [service, r] of Object.entries(form.rates)) {
      const parsed = parseFloat(r.rate);
      if (!isNaN(parsed) && parsed > 0) {
        numericRates[service] = { rate: parsed, currency: r.currency, unit: r.unit };
      }
    }
    registerMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone || undefined,
      country: form.country || undefined,
      services: form.services,
      sourceLanguages: form.sourceLanguages.length ? form.sourceLanguages : undefined,
      targetLanguages: form.targetLanguages.length ? form.targetLanguages : undefined,
      areasOfExpertise: form.areasOfExpertise ? form.areasOfExpertise.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      catTools: form.catTools.length ? form.catTools : undefined,
      authoringTools: form.authoringTools.length ? form.authoringTools : undefined,
      rates: Object.keys(numericRates).length ? numericRates : undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      prozUrl: form.prozUrl || undefined,
      paymentMethod: form.paymentMethod,
      payoneerEmail: form.paymentMethod === "payoneer" ? form.payoneerEmail : undefined,
      bankName: form.paymentMethod === "bank_transfer" ? form.bankName : undefined,
      bankAccountName: form.paymentMethod === "bank_transfer" ? form.bankAccountName : undefined,
      bankAccountNumber: form.paymentMethod === "bank_transfer" ? form.bankAccountNumber : undefined,
      bankIban: form.paymentMethod === "bank_transfer" ? form.bankIban : undefined,
      bankSwiftCode: form.paymentMethod === "bank_transfer" ? form.bankSwiftCode : undefined,
      bankCountry: form.paymentMethod === "bank_transfer" ? form.bankCountry : undefined,
      cvFileBase64: form.cvFileBase64 || undefined,
      cvFileName: form.cvFileName || undefined,
      portfolioFilesBase64: form.portfolioFilesBase64.length ? form.portfolioFilesBase64 : undefined,
    });
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="pt-10 pb-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Registration Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for registering. The Lingora team will review your profile and get back to you within 2–3 business days.
            </p>
            <Button onClick={() => navigate("/login")}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Lingora" className="h-10 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Vendor Registration</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the Lingora freelance network</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-1.5 ${i <= stepIdx ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${i < stepIdx ? "bg-primary border-primary text-white" : i === stepIdx ? "border-primary text-primary bg-white" : "border-muted text-muted-foreground bg-white"}`}>
                  {i < stepIdx ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-4 sm:w-8 mx-1 flex-shrink-0 ${i < stepIdx ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-md">
          <CardContent className="pt-6 pb-6 space-y-5">

            {/* ── Step: Personal Info ── */}
            {stepId === "personal" && (
              <div className="space-y-4">
                {/* Google sign-up option — only show if not already coming from Google */}
                {!fromGoogle && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = getVendorLoginUrl()}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign up with Google
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">or fill in manually</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  </>
                )}
                {fromGoogle && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Signed in with Google — your name and email are pre-filled. No password needed.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={e => setField("name", e.target.value)}
                      placeholder="Your full name"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setField("email", e.target.value)}
                      placeholder="your@email.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  {!fromGoogle && <div className="space-y-1.5">
                    <Label>Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={e => setField("password", e.target.value)}
                        placeholder="Min. 8 characters"
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>}
                  {!fromGoogle && <div className="space-y-1.5">
                    <Label>Confirm Password <span className="text-destructive">*</span></Label>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => setField("confirmPassword", e.target.value)}
                      placeholder="Repeat password"
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>}
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={e => setField("phone", e.target.value)}
                      placeholder="+20 XX XXXX XXXX"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country <span className="text-destructive">*</span></Label>
                    <Select value={form.country} onValueChange={v => setField("country", v)}>
                      <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={form.linkedinUrl}
                      onChange={e => setField("linkedinUrl", e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ProZ Profile URL</Label>
                    <Input
                      value={form.prozUrl}
                      onChange={e => setField("prozUrl", e.target.value)}
                      placeholder="https://proz.com/..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step: Services ── */}
            {stepId === "services" && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    Services Offered <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select all services you can provide. Language-related services will prompt you to specify your language pairs in the next step.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleArr("services", s)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.services.includes(s) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {errors.services && <p className="text-xs text-destructive mt-2">{errors.services}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Areas of Expertise</Label>
                  <Textarea
                    value={form.areasOfExpertise}
                    onChange={e => setField("areasOfExpertise", e.target.value)}
                    placeholder="e.g. eLearning, medical, legal, marketing (comma-separated)"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* ── Step: Languages (only if needed) ── */}
            {stepId === "languages" && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Specify the language pairs you work with for:{" "}
                  <span className="font-medium text-foreground">
                    {form.services.filter(s => LANGUAGE_SERVICES.has(s)).join(", ")}
                  </span>
                </p>
                <div className="space-y-1.5">
                  <Label>
                    Source Languages <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground ml-2">(languages you translate FROM)</span>
                  </Label>
                  <LanguageCombobox
                    placeholder="Select source languages..."
                    selected={form.sourceLanguages}
                    onToggle={lang => toggleArr("sourceLanguages", lang)}
                  />
                  {form.sourceLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.sourceLanguages.map(l => (
                        <span key={l} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                          {l}
                          <button type="button" onClick={() => toggleArr("sourceLanguages", l)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.sourceLanguages && <p className="text-xs text-destructive">{errors.sourceLanguages}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Target Languages <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground ml-2">(languages you translate INTO)</span>
                  </Label>
                  <LanguageCombobox
                    placeholder="Select target languages..."
                    selected={form.targetLanguages}
                    onToggle={lang => toggleArr("targetLanguages", lang)}
                  />
                  {form.targetLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.targetLanguages.map(l => (
                        <span key={l} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                          {l}
                          <button type="button" onClick={() => toggleArr("targetLanguages", l)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.targetLanguages && <p className="text-xs text-destructive">{errors.targetLanguages}</p>}
                </div>
              </div>
            )}

            {/* ── Step: Tools (only if needed) ── */}
            {stepId === "tools" && (
              <div className="space-y-5">
                {needsCatTools && (
                  <div>
                    <Label className="mb-2 block">CAT Tools</Label>
                    <p className="text-xs text-muted-foreground mb-2">Computer-assisted translation tools you use.</p>
                    <div className="flex flex-wrap gap-2">
                      {CAT_TOOLS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleArr("catTools", t)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.catTools.includes(t) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {needsAuthoringTools && (
                  <div>
                    <Label className="mb-2 block">Authoring Tools</Label>
                    <p className="text-xs text-muted-foreground mb-2">eLearning and content authoring tools you use.</p>
                    <div className="flex flex-wrap gap-2">
                      {AUTHORING_TOOLS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleArr("authoringTools", t)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.authoringTools.includes(t) ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: Rates ── */}
            {stepId === "rates" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set your rates per service. You can update these later from your profile.
                </p>
                {form.services.map(service => {
                  const r = form.rates[service] ?? { rate: "", currency: "USD", unit: "per word" };
                  const isWordBased = r.unit === WORD_BASED_UNIT;
                  return (
                    <div key={service} className="border border-border rounded-lg p-4">
                      <p className="font-medium text-sm mb-3">{service}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Select
                            value={r.unit}
                            onValueChange={v => setForm(f => ({
                              ...f,
                              rates: { ...f.rates, [service]: { ...r, unit: v } },
                            }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {RATE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Rate</Label>
                          {isWordBased ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              placeholder="0.000"
                              value={r.rate}
                              onChange={e => setForm(f => ({
                                ...f,
                                rates: { ...f.rates, [service]: { ...r, rate: e.target.value } },
                              }))}
                            />
                          ) : (
                            <Input
                              type="text"
                              placeholder={r.unit === "flat rate" ? "e.g. 200" : "e.g. 25"}
                              value={r.rate}
                              onChange={e => setForm(f => ({
                                ...f,
                                rates: { ...f.rates, [service]: { ...r, rate: e.target.value } },
                              }))}
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Currency</Label>
                          <Select
                            value={r.currency}
                            onValueChange={v => setForm(f => ({
                              ...f,
                              rates: { ...f.rates, [service]: { ...r, currency: v } },
                            }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="EGP">EGP</SelectItem>
                              <SelectItem value="SAR">SAR</SelectItem>
                              <SelectItem value="AED">AED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Step: Payment ── */}
            {stepId === "payment" && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">
                    Preferred Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["payoneer", "bank_transfer"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setField("paymentMethod", method)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${form.paymentMethod === method ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      >
                        <p className="font-semibold text-sm">{method === "payoneer" ? "Payoneer" : "Bank Transfer"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {method === "payoneer" ? "Fast international payments" : "Direct bank wire transfer"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {form.paymentMethod === "payoneer" && (
                  <div className="space-y-1.5">
                    <Label>Payoneer Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      value={form.payoneerEmail}
                      onChange={e => setField("payoneerEmail", e.target.value)}
                      placeholder="your@payoneer.com"
                      className={errors.payoneerEmail ? "border-destructive" : ""}
                    />
                    {errors.payoneerEmail && <p className="text-xs text-destructive">{errors.payoneerEmail}</p>}
                  </div>
                )}

                {form.paymentMethod === "bank_transfer" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Bank Name <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.bankName}
                        onChange={e => setField("bankName", e.target.value)}
                        placeholder="e.g. CIB"
                        className={errors.bankName ? "border-destructive" : ""}
                      />
                      {errors.bankName && <p className="text-xs text-destructive">{errors.bankName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Account Holder Name <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.bankAccountName}
                        onChange={e => setField("bankAccountName", e.target.value)}
                        placeholder="Full name on account"
                        className={errors.bankAccountName ? "border-destructive" : ""}
                      />
                      {errors.bankAccountName && <p className="text-xs text-destructive">{errors.bankAccountName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Account Number</Label>
                      <Input
                        value={form.bankAccountNumber}
                        onChange={e => setField("bankAccountNumber", e.target.value)}
                        placeholder="Account number"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>IBAN <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.bankIban}
                        onChange={e => setField("bankIban", e.target.value)}
                        placeholder="EG000000000000000000000000"
                        className={errors.bankIban ? "border-destructive" : ""}
                      />
                      {errors.bankIban && <p className="text-xs text-destructive">{errors.bankIban}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>SWIFT / BIC</Label>
                      <Input
                        value={form.bankSwiftCode}
                        onChange={e => setField("bankSwiftCode", e.target.value)}
                        placeholder="XXXXXXXX"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bank Country</Label>
                      <Select value={form.bankCountry} onValueChange={v => setField("bankCountry", v)}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: Files ── */}
            {stepId === "files" && (
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">CV / Resume (PDF)</Label>
                  {form.cvFileName ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm text-foreground flex-1 truncate">{form.cvFileName}</span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cvFileBase64: "", cvFileName: "" }))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload PDF</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(e, "cv")} />
                    </label>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Portfolio Files (PDF, up to 3)</Label>
                  {form.portfolioFilesBase64.length < 3 && (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload PDFs</span>
                      <input type="file" accept=".pdf" multiple className="hidden" onChange={e => handleFileUpload(e, "portfolio")} />
                    </label>
                  )}
                  {form.portfolioFilesBase64.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {form.portfolioFilesBase64.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="text-sm flex-1 truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setForm(fm => ({ ...fm, portfolioFilesBase64: fm.portfolioFilesBase64.filter((_, j) => j !== i) }))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Before you submit</p>
                  <p>By registering, you confirm that all information provided is accurate. The Lingora team will review your profile and contact you within 2–3 business days.</p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={goBack} disabled={stepIdx === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {isLast ? (
            <Button onClick={handleSubmit} disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
            </Button>
          ) : (
            <Button onClick={goNext}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already registered?{" "}
          <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

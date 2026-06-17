import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminSetup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    setupKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setup = trpc.adminAuth.setup.useMutation({
    onSuccess: () => {
      navigate("/admin");
    },
    onError: (err) => {
      setErrors({ form: err.message });
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.setupKey.trim()) e.setupKey = "Setup key is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setup.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      setupKey: form.setupKey,
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Lingora Admin Setup</h1>
          <p className="text-gray-400 mt-1 text-sm">Create your first super admin account</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Initial Setup</CardTitle>
            <CardDescription className="text-gray-400">
              This page is only available when no admin accounts exist. Enter the setup key from your <code className="text-red-400">.env</code> file to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <Alert className="bg-red-900/30 border-red-700">
                  <AlertDescription className="text-red-300">{errors.form}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Email Address</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Confirm Password</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat password"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Setup Key</Label>
                <Input
                  type="password"
                  value={form.setupKey}
                  onChange={e => setForm(f => ({ ...f, setupKey: e.target.value }))}
                  placeholder="From your .env ADMIN_SETUP_KEY"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.setupKey && <p className="text-red-400 text-xs">{errors.setupKey}</p>}
              </div>

              <Button
                type="submit"
                disabled={setup.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {setup.isPending ? "Creating account…" : "Create Super Admin Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-4">
          Already have an account?{" "}
          <a href="/admin/login" className="text-red-400 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}

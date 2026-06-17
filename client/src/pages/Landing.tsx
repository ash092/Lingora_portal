import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { FileText, Globe, CreditCard, CheckCircle2 } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

export default function Landing() {
  const [, navigate] = useLocation();

  // Check standalone admin session
  const { data: adminMe, isLoading: adminLoading } = trpc.adminAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check freelancer session
  const { data: freelancerMe, isLoading: freelancerLoading } = trpc.freelancer.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (adminLoading || freelancerLoading) return;
    if (adminMe) {
      navigate("/admin");
      return;
    }
    if (freelancerMe) {
      navigate("/dashboard");
    }
  }, [adminMe, adminLoading, freelancerMe, freelancerLoading, navigate]);

  // Show nothing while checking auth to avoid flash of landing page
  if (adminLoading || freelancerLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Lingora" className="h-9 w-auto" />
            <div>
              <span className="font-bold text-lg text-foreground">Lingora</span>
              <span className="text-muted-foreground text-sm ml-2">Vendor Portal</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/login")}>Sign In</Button>
            <Button onClick={() => navigate("/register")}>Join as Vendor</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Lingora Vendor Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A dedicated workspace for Lingora's freelance translators, localization specialists, and eLearning content creators. Manage your projects, invoices, and payments in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")} className="text-base px-8">
              Register as a Vendor
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-base px-8">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-12">
            Everything you need as a Lingora vendor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: "Purchase Orders",
                desc: "Receive and respond to POs directly. Accept or decline with a single click.",
              },
              {
                icon: CreditCard,
                title: "Invoice Management",
                desc: "Submit invoices, track approval status, and monitor payment timelines.",
              },
              {
                icon: Globe,
                title: "Profile & Rates",
                desc: "Maintain your language pairs, services, rates, and portfolio in one profile.",
              },
              {
                icon: CheckCircle2,
                title: "Payment Tracking",
                desc: "Know exactly when payments are due and when they've been processed.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 px-6 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to join the Lingora network?</h2>
        <p className="text-white/80 mb-8 text-lg">
          Register your profile and start receiving projects from Lingora's team.
        </p>
        <Button
          size="lg"
          variant="outline"
          className="bg-white text-primary hover:bg-white/90 border-white text-base px-8"
          onClick={() => navigate("/register")}
        >
          Register Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lingora. All rights reserved. &nbsp;·&nbsp;
        <a href="https://lingoraloc.com" className="hover:text-primary transition-colors">lingoraloc.com</a>
      </footer>
    </div>
  );
}

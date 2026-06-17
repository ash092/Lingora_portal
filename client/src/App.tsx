import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVendors from "./pages/AdminVendors";
import AdminVendorProfile from "./pages/AdminVendorProfile";
import AdminPOs from "./pages/AdminPOs";
import AdminInvoices from "./pages/AdminInvoices";
import AdminEmail from "./pages/AdminEmail";
import SuperAdminAudit from "./pages/SuperAdminAudit";
import AdminCreatePO from "./pages/AdminCreatePO";
import FreelancerPOs from "./pages/FreelancerPOs";
import FreelancerInvoices from "./pages/FreelancerInvoices";
import FreelancerProfile from "./pages/FreelancerProfile";
import SubmitInvoice from "./pages/SubmitInvoice";
import AdminMessages from "./pages/AdminMessages";
import VendorMessages from "./pages/VendorMessages";
import AdminLogin from "./pages/AdminLogin";
import AdminSetup from "./pages/AdminSetup";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />

      {/* Freelancer dashboard */}
      <Route path="/dashboard" component={FreelancerDashboard} />
      <Route path="/dashboard/:tab" component={FreelancerDashboard} />
      <Route path="/purchase-orders" component={FreelancerPOs} />
      <Route path="/invoices" component={FreelancerInvoices} />
      <Route path="/invoices/submit" component={SubmitInvoice} />
      <Route path="/profile" component={FreelancerProfile} />
      <Route path="/messages" component={VendorMessages} />

      {/* Admin auth */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/setup" component={AdminSetup} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/vendors" component={AdminVendors} />
      <Route path="/admin/vendors/:id" component={AdminVendorProfile} />
      <Route path="/admin/pos" component={AdminPOs} />
      <Route path="/admin/pos/create" component={AdminCreatePO} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/email" component={AdminEmail} />
      <Route path="/admin/audit" component={SuperAdminAudit} />
      <Route path="/admin/messages" component={AdminMessages} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

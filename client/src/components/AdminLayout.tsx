import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LogOut,
  Mail,
  MessageSquare,
  PanelLeft,
  Plus,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/118976239/cxgEoKyMPdgTQBfKrdJCoe/LingoraLogo_mainlogomark_f6617120.png";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Vendors", path: "/admin/vendors" },
  { icon: ClipboardList, label: "Purchase Orders", path: "/admin/pos" },
  { icon: FileText, label: "Invoices", path: "/admin/invoices" },
  { icon: Mail, label: "Email", path: "/admin/email" },
  { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
  { icon: ScrollText, label: "Audit Log", path: "/admin/audit" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  const { data: adminUser, isLoading } = trpc.adminAuth.me.useQuery();
  const [, navigate] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (isLoading) return <DashboardLayoutSkeleton />;

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
          <Shield className="w-12 h-12 text-primary" />
          <h1 className="text-2xl font-semibold">Admin Access Required</h1>
          <p className="text-sm text-muted-foreground">
            Please sign in with your admin account to access this panel.
          </p>
          <Button
            onClick={() => navigate("/admin/login")}
            size="lg"
            className="w-full"
          >
            Sign in as Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth} adminUser={adminUser}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
  setSidebarWidth,
  adminUser,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
  adminUser: { id: number; name: string; email: string };
}) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const utils = trpc.useUtils();

  const logout = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      utils.adminAuth.me.invalidate();
      setLocation("/admin/login");
    },
  });

  const activeItem = menuItems.find(
    (item) => location === item.path || location.startsWith(item.path + "/")
  );

  const { data: convs } = trpc.messages.listConversations.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const totalUnread = convs?.reduce((acc, c) => acc + c.unreadForAdmin, 0) ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border">
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <img src={LOGO_URL} alt="Lingora" className="h-6 w-auto shrink-0" />
                  <span className="font-semibold text-sm truncate text-foreground">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {/* Quick action: Create PO */}
            <div className="px-3 pb-2">
              <button
                onClick={() => setLocation("/admin/pos/create")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Create PO</span>}
              </button>
            </div>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/admin" && location.startsWith(item.path + "/"));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.path === "/admin/messages" && totalUnread > 0 && (
                        <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0 min-w-[1.2rem] text-center">
                          {totalUnread}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {adminUser.name?.charAt(0).toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">{adminUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{adminUser.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            onMouseDown={() => setIsResizing(true)}
            style={{ zIndex: 50 }}
          />
        )}
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center gap-3 bg-background/95 px-4 sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <img src={LOGO_URL} alt="Lingora" className="h-6 w-auto" />
            <span className="font-semibold text-sm">{activeItem?.label ?? "Admin"}</span>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}

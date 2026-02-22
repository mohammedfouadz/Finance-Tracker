import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Target, 
  LineChart, 
  Bot, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Income", href: "/income", icon: Wallet },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Investments", href: "/investments", icon: LineChart },
  { label: "Bank Savings", href: "/savings", icon: PiggyBank },
  { label: "Settings", href: "/settings", icon: Target },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="hidden lg:flex h-screen w-72 flex-col fixed left-0 top-0 border-r bg-white z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <LineChart className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          FinTrack
        </h1>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/30" 
                    : "text-[#666666] hover:bg-[#f8f9fa] hover:text-[#1a1a1a]"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#999999] group-hover:text-primary")} />
                <span className="font-semibold text-[15px]">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-card/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
            {user?.firstName?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
        FinTrack
      </h1>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Menu</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

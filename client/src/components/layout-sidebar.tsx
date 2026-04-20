import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Receipt, LineChart, LogOut, Menu, Wallet,
  Moon, Sun, Languages, Building2, Landmark, HandCoins, Target,
  PieChart, BarChart3, Star, Shield, ChevronDown, TrendingUp,
  Settings, User, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function WealthlyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1B4FE4" />
      <path d="M5 9L10.5 23L16 13L21.5 23L27 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 23L16 13L21.5 23" stroke="#00C896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Home", href: "/dashboard", icon: LayoutDashboard },
      { label: "Net Worth", href: "/net-worth", icon: TrendingUp },
    ],
  },
  {
    label: "Money Flow",
    items: [
      { label: "Income", href: "/income", icon: Wallet },
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Accounts", href: "/bank-accounts", icon: Landmark },
    ],
  },
  {
    label: "Wealth",
    items: [
      { label: "Investments", href: "/investments", icon: LineChart },
      { label: "Assets", href: "/assets", icon: Building2 },
      { label: "Debts", href: "/debts", icon: HandCoins },
    ],
  },
  {
    label: "Planning",
    items: [
      { label: "Goals", href: "/goals", icon: Target },
      { label: "Budget", href: "/budget", icon: PieChart },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Obligations",
    items: [
      { label: "Zakat", href: "/zakat", icon: Star },
    ],
  },
];

function NavItem({ item, isActive, onClick }: { item: { label: string; href: string; icon: any }; isActive: boolean; onClick?: () => void }) {
  return (
    <Link href={item.href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group",
          isActive
            ? "bg-[#1B4FE4] text-white shadow-md shadow-[#1B4FE4]/20"
            : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
        )}
        data-testid={`nav-${item.href.replace(/\//g, "-").slice(1) || "home"}`}
        onClick={onClick}
      >
        <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#1B4FE4] dark:group-hover:text-[#4F8EF7]")} />
        <span className="font-medium text-[14px]">{item.label}</span>
      </div>
    </Link>
  );
}

function ProfileDropdown({ user, isAdmin, isDark, lang, onThemeToggle, onLangToggle, onLogout }: {
  user: any; isAdmin: boolean; isDark: boolean; lang: string;
  onThemeToggle: () => void; onLangToggle: () => void; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] transition-colors group"
        data-testid="button-profile-menu"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ background: "linear-gradient(135deg, #1B4FE4, #00C896)" }}>
          {initials}
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-semibold truncate text-[#0F1729] dark:text-white">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-3 space-y-0.5">
              <Link href="/settings">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white cursor-pointer" onClick={() => setOpen(false)}>
                  <Settings className="w-4 h-4" /> Settings
                </div>
              </Link>
              <button
                onClick={() => { onThemeToggle(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white"
                data-testid="button-theme-toggle">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? t("lightMode") : t("darkMode")}
              </button>
              <button
                onClick={() => { onLangToggle(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white"
                data-testid="button-lang-toggle">
                <Languages className="w-4 h-4" />
                {lang === "en" ? t("arabic") : t("english")}
              </button>
              {isAdmin && (
                <>
                  <div className="h-px bg-[#E2E8F0] dark:bg-[#334155] my-1" />
                  <Link href="/admin">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] cursor-pointer" onClick={() => setOpen(false)}>
                      <Shield className="w-4 h-4" /> Admin Panel
                    </div>
                  </Link>
                </>
              )}
              <div className="h-px bg-[#E2E8F0] dark:bg-[#334155] my-1" />
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                data-testid="button-logout">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const isAdmin = (user as any)?.isAdmin;

  const handleThemeToggle = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    fetch("/api/auth/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: newTheme }), credentials: "include" }).catch(() => {});
  };
  const handleLangToggle = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    fetch("/api/auth/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: newLang }), credentials: "include" }).catch(() => {});
  };

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-[#EEF4FF] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] z-50 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l">
      {/* logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 shrink-0">
        <WealthlyLogo size={30} />
        <h1 className="text-xl font-bold text-[#1B4FE4] dark:text-white tracking-tight">Wealthly</h1>
      </div>

      {/* scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-3 mb-1">{group.label}</p>
            {group.items.map(item => (
              <NavItem
                key={item.href}
                item={item}
                isActive={location === item.href || (item.href === "/dashboard" && location === "/")}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* profile footer */}
      <div className="px-3 pb-4 border-t border-[#EEF4FF] dark:border-[#1E3A5F] pt-3 shrink-0">
        <ProfileDropdown
          user={user}
          isAdmin={isAdmin}
          isDark={isDark}
          lang={lang}
          onThemeToggle={handleThemeToggle}
          onLangToggle={handleLangToggle}
          onLogout={() => logout()}
        />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const isAdmin = (user as any)?.isAdmin;

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#EEF4FF] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <WealthlyLogo size={26} />
        <h1 className="text-lg font-bold text-[#1B4FE4] dark:text-white tracking-tight">Wealthly</h1>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
        </SheetTrigger>
        <SheetContent side={lang === "ar" ? "right" : "left"} className="w-64 p-0 bg-white dark:bg-[#0A1628] border-[#EEF4FF] dark:border-[#1E3A5F]">
          <div className="p-4 border-b border-[#EEF4FF] dark:border-[#1E3A5F] flex items-center gap-2">
            <WealthlyLogo size={24} />
            <h2 className="text-base font-bold text-[#1B4FE4] dark:text-white">Wealthly</h2>
          </div>
          <nav className="flex-1 p-3 overflow-y-auto max-h-[70vh] space-y-3">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-2 mb-1">{group.label}</p>
                {group.items.map(item => (
                  <NavItem key={item.href} item={item}
                    isActive={location === item.href || (item.href === "/dashboard" && location === "/")}
                    onClick={() => setOpen(false)} />
                ))}
              </div>
            ))}
            {isAdmin && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-2 mb-1">Admin</p>
                <NavItem item={{ label: "Admin Panel", href: "/admin", icon: Shield }}
                  isActive={location.startsWith("/admin")} onClick={() => setOpen(false)} />
              </div>
            )}
          </nav>
          <div className="p-3 border-t border-[#EEF4FF] dark:border-[#1E3A5F] space-y-1">
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? t("lightMode") : t("darkMode")}
            </button>
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]">
              <Languages className="w-4 h-4" />
              {lang === "en" ? t("arabic") : t("english")}
            </button>
            <button onClick={() => logout()} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Sidebar />
      <div className={cn("flex flex-col min-h-screen", lang === "ar" ? "lg:pr-64" : "lg:pl-64")}>
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

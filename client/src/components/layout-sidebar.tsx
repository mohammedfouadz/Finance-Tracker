import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  LineChart,
  LogOut,
  Menu,
  Wallet,
  Moon,
  Sun,
  Languages,
  Building2,
  Landmark,
  HandCoins,
  Target,
  PieChart,
  BarChart3,
  Star,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function WealthlyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1B4FE4" />
      <path
        d="M5 9L10.5 23L16 13L21.5 23L27 9"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 23L16 13L21.5 23"
        stroke="#00C896"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function useNavItems() {
  const { t } = useI18n();
  return [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("income"), href: "/income", icon: Wallet },
    { label: t("expenses"), href: "/expenses", icon: Receipt },
    { label: t("investments"), href: "/investments", icon: LineChart },
    { label: "Assets", href: "/assets", icon: Building2 },
    { label: "Bank Accounts", href: "/bank-accounts", icon: Landmark },
    { label: "Debts", href: "/debts", icon: HandCoins },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Budget", href: "/budget", icon: PieChart },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "AI Reports", href: "/reports/ai", icon: Sparkles },
    { label: "Zakat", href: "/zakat", icon: Star },
    { label: t("settings"), href: "/settings", icon: Settings },
  ];
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { lang, setLang, t } = useI18n();
  const navItems = useNavItems();
  const isAdmin = (user as any)?.isAdmin;

  const handleThemeToggle = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    fetch("/api/auth/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: newTheme }),
      credentials: "include",
    }).catch(() => {});
  };

  const handleLangToggle = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    fetch("/api/auth/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
      credentials: "include",
    }).catch(() => {});
  };

  return (
    <aside className="hidden lg:flex h-screen w-72 flex-col fixed left-0 top-0 border-r border-[#EEF4FF] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] z-50 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l overflow-y-auto">
      <div className="p-8 flex items-center gap-3">
        <WealthlyLogo size={34} />
        <h1 className="text-2xl font-bold text-[#1B4FE4] dark:text-white tracking-tight">Wealthly</h1>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-[#1B4FE4] text-white shadow-lg shadow-[#1B4FE4]/25"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
                )}
                data-testid={`nav-${item.href.slice(1)}`}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#1B4FE4] dark:group-hover:text-[#4F8EF7]")} />
                <span className="font-semibold text-[15px]">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#CBD5E1] dark:text-[#1E3A5F]">Administration</p>
            </div>
            {[
              { label: "Admin Panel", href: "/admin", icon: Shield },
              { label: "Users", href: "/admin/users", icon: Shield },
            ].map((item) => {
              const isActive = location === item.href || (item.href === "/admin/users" && location.startsWith("/admin/users"));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-[#1B4FE4] text-white shadow-lg shadow-[#1B4FE4]/25"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
                    )}
                    data-testid={`nav-${item.href.replace(/\//g, "-").slice(1)}`}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#1B4FE4]")} />
                    <span className="font-semibold text-[15px]">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-6 pb-2 space-y-1">
        <button
          onClick={handleThemeToggle}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer w-full text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-semibold text-[15px]">{isDark ? t("lightMode") : t("darkMode")}</span>
        </button>
        <button
          onClick={handleLangToggle}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer w-full text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
          data-testid="button-lang-toggle"
        >
          <Languages className="w-5 h-5" />
          <span className="font-semibold text-[15px]">{lang === "en" ? t("arabic") : t("english")}</span>
        </button>
      </div>

      <div className="p-4 border-t border-[#EEF4FF] dark:border-[#1E3A5F]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #1B4FE4, #00C896)" }}>
            {(user as any)?.firstName?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold truncate text-[#0F1729] dark:text-white">{(user as any)?.firstName} {(user as any)?.lastName}</p>
              {isAdmin && <Shield className="w-3 h-3 text-[#1B4FE4] flex-shrink-0" />}
            </div>
            <p className="text-xs text-[#64748B] truncate">{(user as any)?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("logout")}
        </Button>
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
  const navItems = useNavItems();
  const isAdmin = (user as any)?.isAdmin;

  const adminItems = isAdmin
    ? [
        { label: "Admin Panel", href: "/admin", icon: Shield },
        { label: "Users", href: "/admin/users", icon: Shield },
      ]
    : [];

  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#EEF4FF] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <WealthlyLogo size={28} />
        <h1 className="text-xl font-bold text-[#1B4FE4] dark:text-white tracking-tight">Wealthly</h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side={lang === "ar" ? "right" : "left"} className="w-64 p-0 bg-white dark:bg-[#0A1628] border-[#EEF4FF] dark:border-[#1E3A5F]">
          <div className="p-6 border-b border-[#EEF4FF] dark:border-[#1E3A5F] flex items-center gap-2">
            <WealthlyLogo size={24} />
            <h2 className="text-lg font-bold text-[#1B4FE4] dark:text-white">Wealthly</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[60vh]">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                      isActive
                        ? "bg-[#1B4FE4] text-white"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744] hover:text-[#1B4FE4] dark:hover:text-white"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            {adminItems.length > 0 && (
              <>
                <div className="pt-2 pb-1 px-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#CBD5E1]">Admin</p>
                </div>
                {adminItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                          isActive
                            ? "bg-[#1B4FE4] text-white"
                            : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
          <div className="p-4 border-t border-[#EEF4FF] dark:border-[#1E3A5F] space-y-2">
            <button
              onClick={() => { setTheme(isDark ? "light" : "dark"); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{isDark ? t("lightMode") : t("darkMode")}</span>
            </button>
            <button
              onClick={() => { setLang(lang === "en" ? "ar" : "en"); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]"
            >
              <Languages className="w-5 h-5" />
              <span className="font-medium">{lang === "en" ? t("arabic") : t("english")}</span>
            </button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("logout")}
            </Button>
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
      <div className={cn("flex flex-col min-h-screen", lang === "ar" ? "lg:pr-72" : "lg:pl-72")}>
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

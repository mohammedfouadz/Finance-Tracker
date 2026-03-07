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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    <aside className="hidden lg:flex h-screen w-72 flex-col fixed left-0 top-0 border-r bg-white dark:bg-gray-950 dark:border-gray-800 z-50 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l overflow-y-auto">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <LineChart className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">FinTrack</h1>
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
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "text-[#666666] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 hover:text-[#1a1a1a] dark:hover:text-white"
                )}
                data-testid={`nav-${item.href.slice(1)}`}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#999999] dark:text-gray-500 group-hover:text-primary")} />
                <span className="font-semibold text-[15px]">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#bbb] dark:text-gray-600">Administration</p>
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
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-[#666666] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 hover:text-[#1a1a1a] dark:hover:text-white"
                    )}
                    data-testid={`nav-${item.href.replace(/\//g, "-").slice(1)}`}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#999999] dark:text-gray-500 group-hover:text-primary")} />
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
          className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer w-full text-[#666666] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 hover:text-[#1a1a1a] dark:hover:text-white"
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="w-5 h-5 text-[#999] dark:text-gray-500" /> : <Moon className="w-5 h-5 text-[#999]" />}
          <span className="font-semibold text-[15px]">{isDark ? t("lightMode") : t("darkMode")}</span>
        </button>
        <button
          onClick={handleLangToggle}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer w-full text-[#666666] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-gray-800 hover:text-[#1a1a1a] dark:hover:text-white"
          data-testid="button-lang-toggle"
        >
          <Languages className="w-5 h-5 text-[#999] dark:text-gray-500" />
          <span className="font-semibold text-[15px]">{lang === "en" ? t("arabic") : t("english")}</span>
        </button>
      </div>

      <div className="p-4 border-t dark:border-gray-800 bg-card/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
            {(user as any)?.firstName?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate dark:text-white">{(user as any)?.firstName} {(user as any)?.lastName}</p>
              {isAdmin && <Shield className="w-3 h-3 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{(user as any)?.email}</p>
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
    <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card dark:bg-gray-950 dark:border-gray-800 sticky top-0 z-50">
      <h1 className="text-xl font-bold text-gradient">FinTrack</h1>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side={lang === "ar" ? "right" : "left"} className="w-64 p-0 dark:bg-gray-950">
          <div className="p-6 border-b dark:border-gray-800">
            <h2 className="text-xl font-bold dark:text-white">Menu</h2>
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
            {adminItems.length > 0 && (
              <>
                <div className="pt-2 pb-1 px-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                </div>
                {adminItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
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
          <div className="p-4 border-t dark:border-gray-800 space-y-2">
            <button
              onClick={() => { setTheme(isDark ? "light" : "dark"); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-secondary"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{isDark ? t("lightMode") : t("darkMode")}</span>
            </button>
            <button
              onClick={() => { setLang(lang === "en" ? "ar" : "en"); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-secondary"
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

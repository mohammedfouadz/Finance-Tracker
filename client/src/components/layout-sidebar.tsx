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
import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { addDays, differenceInDays, isBefore } from "date-fns";

function useZakatDaysLeft() {
  const { data } = useQuery({
    queryKey: ["/api/zakat/settings"],
    queryFn: async () => {
      const r = await fetch("/api/zakat/settings", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    staleTime: 60 * 1000,
  });
  return useMemo(() => {
    if (!data?.hawlDate && !data?.hawlStartDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let nextDate: Date | null = null;
    if (data.hawlDateType === "tracking" && data.hawlStartDate) {
      let next = addDays(new Date(data.hawlStartDate), 354);
      while (isBefore(next, today)) next = addDays(next, 354);
      nextDate = next;
    } else if (data.hawlDate) {
      const base = new Date(data.hawlDate);
      let next = new Date(today.getFullYear(), base.getMonth(), base.getDate());
      if (isBefore(next, today)) next = new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
      nextDate = next;
    }
    if (!nextDate) return null;
    return differenceInDays(nextDate, today);
  }, [data]);
}

function ZakatBadge({ isActive }: { isActive: boolean }) {
  const days = useZakatDaysLeft();
  const { isRtl } = useI18n();
  if (days === null || days > 14) return null;
  const color = days <= 7 ? "#DC2626" : days <= 14 ? "#EA580C" : "#D97706";
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center", isRtl ? "mr-auto" : "ml-auto")}
      style={{ backgroundColor: isActive ? "rgba(255,255,255,0.3)" : color, color: isActive ? "#fff" : "#fff" }}
      data-testid="badge-zakat-countdown">
      {days === 0 ? "!" : `${days}d`}
    </span>
  );
}

function WealthlyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1B4FE4" />
      <path d="M5 9L10.5 23L16 13L21.5 23L27 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 23L16 13L21.5 23" stroke="#00C896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

// Navigation groups - labels & item labels are now translation KEYS, not strings
// They get resolved via t() at render time so the language can switch live.
const NAV_GROUPS = [
  {
    labelKey: "nav.group.overview",
    items: [
      { labelKey: "nav.home", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.netWorth", href: "/net-worth", icon: TrendingUp },
    ],
  },
  {
    labelKey: "nav.group.moneyFlow",
    items: [
      { labelKey: "nav.income", href: "/income", icon: Wallet },
      { labelKey: "nav.expenses", href: "/expenses", icon: Receipt },
      { labelKey: "nav.accounts", href: "/bank-accounts", icon: Landmark },
    ],
  },
  {
    labelKey: "nav.group.wealth",
    items: [
      { labelKey: "nav.investments", href: "/investments", icon: LineChart },
      { labelKey: "nav.assets", href: "/assets", icon: Building2 },
      { labelKey: "nav.debts", href: "/debts", icon: HandCoins },
    ],
  },
  {
    labelKey: "nav.group.planning",
    items: [
      { labelKey: "nav.goals", href: "/goals", icon: Target },
      { labelKey: "nav.budget", href: "/budget", icon: PieChart },
    ],
  },
  {
    labelKey: "nav.group.insights",
    items: [
      { labelKey: "nav.reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    labelKey: "nav.group.obligations",
    items: [
      { labelKey: "nav.zakat", href: "/zakat", icon: Star },
    ],
  },
];

function NavItem({ item, isActive, onClick, badge }: {
  item: { labelKey: string; href: string; icon: any };
  isActive: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}) {
  const { t } = useI18n();
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
        <span className="font-medium text-[14px] flex-1">{t(item.labelKey)}</span>
        {badge}
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
        <div className="flex-1 text-start overflow-hidden">
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
                  <Settings className="w-4 h-4" /> {t("nav.settings")}
                </div>
              </Link>
              <button
                onClick={() => { onThemeToggle(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white"
                data-testid="button-theme-toggle">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? t("nav.lightMode") : t("nav.darkMode")}
              </button>
              <button
                onClick={() => { onLangToggle(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white"
                data-testid="button-lang-toggle">
                <Languages className="w-4 h-4" />
                {lang === "en" ? t("nav.languageAr") : t("nav.languageEn")}
              </button>
              {isAdmin && (
                <>
                  <div className="h-px bg-[#E2E8F0] dark:bg-[#334155] my-1" />
                  <Link href="/admin">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] cursor-pointer" onClick={() => setOpen(false)}>
                      <Shield className="w-4 h-4" /> {t("nav.adminPanel")}
                    </div>
                  </Link>
                </>
              )}
              <div className="h-px bg-[#E2E8F0] dark:bg-[#334155] my-1" />
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                data-testid="button-logout">
                <LogOut className="w-4 h-4" /> {t("nav.signOut")}
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
  const { lang, setLang, t, isRtl } = useI18n();
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
    <aside className={cn(
      "hidden lg:flex h-screen w-64 flex-col fixed top-0 border-[#EEF4FF] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] z-50",
      isRtl ? "right-0 border-l" : "left-0 border-r"
    )}>
      {/* logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 shrink-0">
        <WealthlyLogo size={30} />
        <h1 className="text-xl font-bold text-[#1B4FE4] dark:text-white tracking-tight">Wealthly</h1>
      </div>

      {/* scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.labelKey}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-3 mb-1">{t(group.labelKey)}</p>
            {group.items.map(item => {
              const active = location === item.href || (item.href === "/dashboard" && location === "/");
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={active}
                  badge={item.href === "/zakat" ? <ZakatBadge isActive={active} /> : undefined}
                />
              );
            })}
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
              <div key={group.labelKey}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-2 mb-1">{t(group.labelKey)}</p>
                {group.items.map(item => {
                  const active = location === item.href || (item.href === "/dashboard" && location === "/");
                  return (
                    <NavItem key={item.href} item={item} isActive={active}
                      onClick={() => setOpen(false)}
                      badge={item.href === "/zakat" ? <ZakatBadge isActive={active} /> : undefined} />
                  );
                })}
              </div>
            ))}
            {isAdmin && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] dark:text-[#334155] px-2 mb-1">{t("nav.group.admin")}</p>
                <NavItem item={{ labelKey: "nav.adminPanel", href: "/admin", icon: Shield }}
                  isActive={location.startsWith("/admin")} onClick={() => setOpen(false)} />
              </div>
            )}
          </nav>
          <div className="p-3 border-t border-[#EEF4FF] dark:border-[#1E3A5F] space-y-1">
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? t("nav.lightMode") : t("nav.darkMode")}
            </button>
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FF] dark:hover:bg-[#1A2744]">
              <Languages className="w-4 h-4" />
              {lang === "en" ? t("nav.languageAr") : t("nav.languageEn")}
            </button>
            <button onClick={() => logout()} className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-4 h-4" /> {t("nav.signOut")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { lang, isRtl } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      <Sidebar />
      <div className={cn("flex flex-col min-h-screen", isRtl ? "lg:pr-64" : "lg:pl-64")}>
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


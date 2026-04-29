import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import { usePreferences } from "@/lib/preferences";
import {
  User, Palette, FolderOpen, Bell, Shield, CreditCard, Bot, Database,
  Globe, Crown, Smartphone, HelpCircle, AlertTriangle, Plus, Trash2, Save,
  Edit2, ChevronRight, Check, X, Sparkles, Lock, Eye, EyeOff, Download,
  Upload, RefreshCw, Settings2, Moon, Sun, Monitor, Zap, Info,
} from "lucide-react";

const BRAND  = "#1B4FE4";
const DANGER = "#EF4444";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const PURPLE = "#8B5CF6";

/* ── sub-nav sections ── */
const NAV_SECTIONS = [
  { id: "profile",       label: "settings.profile",                icon: User },
  { id: "preferences",  label: "settings.preferences",            icon: Palette },
  { id: "categories",   label: "settings.categories",             icon: FolderOpen },
  { id: "notifications",label: "settings.notifications",          icon: Bell },
  { id: "security",     label: "settings.security",               icon: Shield },
  { id: "integrations", label: "nav.accounts",                    icon: CreditCard },
  { id: "ai",           label: "aiCoach.title",                   icon: Bot },
  { id: "data",         label: "settings.dataExport",             icon: Database },
  { id: "localization", label: "settings.language",               icon: Globe },
  { id: "billing",      label: "Subscription & Billing", icon: Crown },
  { id: "devices",      label: "Devices & Sessions",     icon: Smartphone },
  { id: "help",         label: "Help & Support",         icon: HelpCircle },
  { id: "danger",       label: "settings.dangerZone",            icon: AlertTriangle },
];

/* ── reusable toggle component ── */
function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? BRAND : "#E2E8F0" }}>
        <span className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
          style={{ transform: checked ? "translateX(17px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

/* ── section card wrapper ── */
function SectionCard({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl mb-4">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">{title}</h3>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/* ── saved indicator ── */
function SavedIndicator({ state }: { state: "idle"|"saving"|"saved" }) {
  if (state === "idle") return null;
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${state === "saved" ? "text-emerald-600" : "text-gray-400"}`}>
      {state === "saving" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      {state === "saving" ? "Saving…" : "Saved ✓"}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SECTION COMPONENTS
═══════════════════════════════════════════════════════ */

function ProfileSection({ user }: { user: any }) {
  const { t } = useI18n();
  const [name, setName] = useState(user?.firstName || "");
  const [bio, setBio]   = useState("");
  const [goals, setGoals] = useState<string[]>(["Save for home", "Build emergency fund"]);
  const [risk, setRisk]  = useState(50);

  const GOAL_OPTIONS = ["Save for home","Pay off debt","Retire early","Build emergency fund","Invest","Travel","Other"];

  return (
    <div>
      <SectionCard title={t("settings.personalInfo")} sub={t("settings.profileSub") || "Your basic profile details"}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}>
            {(user?.firstName?.[0] || "U").toUpperCase()}
          </div>
          <div className="text-start">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400">{user?.email || "No email set"}</p>
            <div className="flex gap-2 mt-2">
              <button className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{t("common.edit")}</button>
              <button className="text-xs font-medium px-3 py-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">{t("common.delete")}</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.name")}</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("common.name")} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("settings.email")}</label>
            <div className="relative">
              <Input value={user?.email || ""} readOnly className="pe-16 bg-gray-50 dark:bg-gray-800" />
              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">{t("common.verified") || "Verified"}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("settings.country")}</label>
            <Input defaultValue="Saudi Arabia" placeholder={t("settings.country")} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("settings.timezone") || "Time Zone"}</label>
            <Input defaultValue="UTC+3 (Riyadh)" placeholder="Time zone" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("common.bio") || "Bio"}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="..." />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.financialProfile") || "Financial Profile"} sub={t("settings.financialProfileSub") || "Helps AI personalize recommendations for you"}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("goals.title")}</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(g => (
                <button key={g} onClick={() => setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                  style={goals.includes(g) ? { backgroundColor: BRAND, color: "#fff", borderColor: BRAND } : { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("settings.riskTolerance") || "Risk Tolerance"}</p>
              <span className="text-xs font-bold" style={{ color: risk < 34 ? MINT : risk < 67 ? AMBER : DANGER }}>
                {risk < 34 ? t("settings.riskLow") : risk < 67 ? t("settings.riskMedium") : t("settings.riskHigh")}
              </span>
            </div>
            <input type="range" min="0" max="100" value={risk} onChange={e => setRisk(Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>{t("settings.riskLow")}</span><span>{t("settings.riskMedium")}</span><span>{t("settings.riskHigh")}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("settings.monthlyTarget") || "Monthly Savings Target"}</label>
              <Input type="number" placeholder="$0" defaultValue="500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{t("settings.householdSize") || "Household Size"}</label>
              <Input type="number" placeholder="1" defaultValue="1" min="1" />
            </div>
          </div>
          <Button className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }}>
            <Save className="w-4 h-4" /> {t("settings.saveChanges")}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function PreferencesSection() {
  const { theme: currentTheme, setTheme } = useTheme();
  const { prefs, setPrefs } = usePreferences();
  const { t, isRtl } = useI18n();

  const [saved, setSaved] = useState(false);

  function save(patch: Parameters<typeof setPrefs>[0]) {
    setPrefs(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const THEMES = [
    { id: "light",  icon: Sun,     label: t("settings.themeLight") },
    { id: "dark",   icon: Moon,    label: t("settings.themeDark") },
    { id: "system", icon: Monitor, label: t("settings.themeSystem") },
  ] as const;

  const ACCENTS = [
    { hex: "#1B4FE4", label: "Blue" },
    { hex: "#8B5CF6", label: "Purple" },
    { hex: "#00C896", label: "Mint" },
    { hex: "#F59E0B", label: "Amber" },
    { hex: "#EC4899", label: "Pink" },
    { hex: "#14B8A6", label: "Teal" },
  ];

  return (
    <div>
      {saved && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-medium">
          <Check className="w-4 h-4" />
          {isRtl ? "تم الحفظ تلقائياً" : "Changes saved automatically"}
        </div>
      )}

      <SectionCard title={isRtl ? "المظهر" : "Appearance"} sub={isRtl ? "تخصيص مظهر Wealthly" : "Customize how Wealthly looks"}>
        <div className="space-y-5">

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("settings.theme")}</p>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(th => (
                <button
                  key={th.id}
                  data-testid={`btn-theme-${th.id}`}
                  onClick={() => { setTheme(th.id); save({}); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                  style={currentTheme === th.id
                    ? { borderColor: prefs.accentColor, backgroundColor: "#EEF4FF" }
                    : { borderColor: "#E2E8F0", backgroundColor: "transparent" }}>
                  <th.icon className="w-5 h-5" style={{ color: currentTheme === th.id ? prefs.accentColor : "#94A3B8" }} />
                  <span className="text-xs font-medium" style={{ color: currentTheme === th.id ? prefs.accentColor : "#64748B" }}>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {isRtl ? "لون التمييز" : "Accent Color"}
            </p>
            <div className="flex gap-3">
              {ACCENTS.map(({ hex, label }) => (
                <button
                  key={hex}
                  data-testid={`btn-accent-${label.toLowerCase()}`}
                  title={label}
                  onClick={() => save({ accentColor: hex })}
                  className="w-8 h-8 rounded-full transition-all hover:scale-110 relative"
                  style={{
                    backgroundColor: hex,
                    boxShadow: prefs.accentColor === hex ? `0 0 0 3px white, 0 0 0 5px ${hex}` : "0 1px 3px rgba(0,0,0,.2)",
                  }}
                >
                  {prefs.accentColor === hex && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {isRtl ? "كثافة التخطيط" : "Layout Density"}
            </p>
            <div className="flex gap-2">
              {([
                { id: "compact",     label: isRtl ? "مضغوط"    : "Compact" },
                { id: "comfortable", label: isRtl ? "مريح"      : "Comfortable" },
                { id: "spacious",    label: isRtl ? "متسع"      : "Spacious" },
              ] as const).map(d => (
                <button
                  key={d.id}
                  data-testid={`btn-density-${d.id}`}
                  onClick={() => save({ density: d.id })}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border-2 capitalize transition-all"
                  style={prefs.density === d.id
                    ? { borderColor: prefs.accentColor, color: prefs.accentColor, backgroundColor: "#EEF4FF" }
                    : { borderColor: "#E2E8F0", color: "#64748B" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <Toggle
            checked={prefs.reduceMotion}
            onChange={() => save({ reduceMotion: !prefs.reduceMotion })}
            label={isRtl ? "تقليل الحركة" : "Reduce Motion"}
            sub={isRtl ? "تعطيل الرسوم المتحركة والانتقالات" : "Disable animations and transitions"}
          />
          <Toggle
            checked={prefs.highContrast}
            onChange={() => save({ highContrast: !prefs.highContrast })}
            label={isRtl ? "وضع التباين العالي" : "High Contrast Mode"}
            sub={isRtl ? "زيادة التباين البصري" : "Increase visual contrast"}
          />
        </div>
      </SectionCard>

      <SectionCard title={isRtl ? "تفضيلات العرض" : "Display Preferences"} sub={isRtl ? "الأرقام والتواريخ وإعدادات المخططات" : "Numbers, dates, and chart defaults"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {isRtl ? "الصفحة الافتراضية" : "Default Landing Page"}
            </label>
            <Select
              value={prefs.landingPage}
              onValueChange={v => save({ landingPage: v })}
            >
              <SelectTrigger data-testid="select-landing-page"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">{isRtl ? "لوحة التحكم" : "Home Dashboard"}</SelectItem>
                <SelectItem value="net-worth">{isRtl ? "صافي الثروة" : "Net Worth"}</SelectItem>
                <SelectItem value="expenses">{isRtl ? "المصروفات" : "Expenses"}</SelectItem>
                <SelectItem value="budget">{isRtl ? "الميزانية" : "Budget"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {t("settings.dateFormat")}
            </label>
            <Select
              value={prefs.dateFormat}
              onValueChange={v => save({ dateFormat: v })}
            >
              <SelectTrigger data-testid="select-date-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {t("settings.numberFormat")}
            </label>
            <Select
              value={prefs.numberFormat}
              onValueChange={v => save({ numberFormat: v })}
            >
              <SelectTrigger data-testid="select-number-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">1,000.00 (US)</SelectItem>
                <SelectItem value="eu">1.000,00 (EU)</SelectItem>
                <SelectItem value="fr">1 000,00 (FR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              {isRtl ? "نوع المخطط الافتراضي" : "Default Chart Type"}
            </label>
            <Select
              value={prefs.chartType}
              onValueChange={v => save({ chartType: v })}
            >
              <SelectTrigger data-testid="select-chart-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">{isRtl ? "مخطط أعمدة" : "Bar Chart"}</SelectItem>
                <SelectItem value="line">{isRtl ? "مخطط خطي" : "Line Chart"}</SelectItem>
                <SelectItem value="area">{isRtl ? "مخطط مساحة" : "Area Chart"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={isRtl ? "السلوك" : "Behavior"} sub={isRtl ? "تفضيلات التفاعل مع التطبيق" : "App interaction preferences"}>
        <Toggle
          checked={prefs.autoCategory}
          onChange={() => save({ autoCategory: !prefs.autoCategory })}
          label={isRtl ? "تصنيف المعاملات تلقائياً" : "Auto-categorize Transactions"}
          sub={isRtl ? "الذكاء الاصطناعي يقترح التصنيف بناءً على اسم التاجر" : "AI suggests category based on merchant name"}
        />
        <Toggle
          checked={prefs.confirmDelete}
          onChange={() => save({ confirmDelete: !prefs.confirmDelete })}
          label={isRtl ? "تأكيد قبل الحذف" : "Confirm Before Delete"}
          sub={isRtl ? "عرض نافذة تأكيد قبل حذف السجلات" : "Show confirmation dialog before deleting records"}
        />
        <Toggle
          checked={prefs.shortcuts}
          onChange={() => save({ shortcuts: !prefs.shortcuts })}
          label={isRtl ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}
          sub={isRtl ? "تمكين المفاتيح السريعة للتنقل" : "Enable hotkeys for quick navigation"}
        />
        <Toggle
          checked={prefs.tooltips}
          onChange={() => save({ tooltips: !prefs.tooltips })}
          label={isRtl ? "عرض التلميحات" : "Show Tooltips"}
          sub={isRtl ? "عرض تلميحات مساعدة في التطبيق" : "Display helpful hints throughout the app"}
        />
      </SectionCard>
    </div>
  );
}

function CategoriesSection({ user }: { user: any }) {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory  = useUpdateCategory();
  const deleteCategory  = useDeleteCategory();
  const { toast } = useToast();

  const dedup = useMutation({
    mutationFn: () => apiRequest("POST", "/api/categories/deduplicate"),
    onSuccess: async (res: any) => {
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: `Duplicates removed: ${data.removed} categories cleaned up` });
    },
    onError: () => toast({ title: "Failed to clean duplicates", variant: "destructive" }),
  });

  const [activeTab, setActiveTab] = useState<"expense"|"income"|"investment">("expense");
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState({ name: "", type: "expense", color: "#2563eb", allocationPercentage: "" });
  const [editingAllocations, setEditingAllocations] = useState<Record<number, string>>({});
  const [savingState, setSavingState] = useState<"idle"|"saving"|"saved">("idle");

  const expenseCategories = useMemo(() => (categories as any[] | undefined)?.filter(c => c.type === "expense") || [], [categories]);
  const incomeCategories  = useMemo(() => (categories as any[] | undefined)?.filter(c => c.type === "income")  || [], [categories]);

  const totalAllocation = useMemo(() =>
    expenseCategories.reduce((sum: number, c: any) => {
      const alloc = editingAllocations[c.id] !== undefined ? Number(editingAllocations[c.id]) : Number(c.allocationPercentage || 0);
      return sum + alloc;
    }, 0),
    [expenseCategories, editingAllocations]
  );

  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await createCategory.mutateAsync({ name: formData.name, type: formData.type, color: formData.color, userId: user!.id, allocationPercentage: formData.allocationPercentage || undefined });
      setFormData({ name: "", type: "expense", color: "#2563eb", allocationPercentage: "" });
      setShowForm(false);
      toast({ title: "Category created" });
    } catch { toast({ title: "Failed to create category", variant: "destructive" }); }
  };

  const handleSaveAlloc = async (catId: number) => {
    const val = editingAllocations[catId];
    if (val === undefined) return;
    setSavingState("saving");
    try {
      await updateCategory.mutateAsync({ id: catId, allocationPercentage: val });
      const n = { ...editingAllocations }; delete n[catId]; setEditingAllocations(n);
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 2000);
    } catch { toast({ title: "Failed to update", variant: "destructive" }); setSavingState("idle"); }
  };

  const handleDelete = async (catId: number) => {
    if (!confirm("Delete this category? History will be preserved.")) return;
    try { await deleteCategory.mutateAsync(catId); toast({ title: "Category deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const INVEST_TYPES = [
    { name: "Gold",        color: AMBER,  risk: "Low" },
    { name: "Stocks",      color: BRAND,  risk: "High" },
    { name: "Crypto",      color: PURPLE, risk: "Very High" },
    { name: "Real Estate", color: MINT,   risk: "Medium" },
    { name: "Bonds",       color: "#EF4444", risk: "Low" },
    { name: "ETFs",        color: "#14B8A6", risk: "Medium" },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: BRAND }} /></div>;

  return (
    <div>
      {/* tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "#F1F5F9" }}>
        {([["expense","Expense Categories"],["income","Income Categories"],["investment","Investment & Assets"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={activeTab === id ? { backgroundColor: "#fff", color: BRAND, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#64748B" }}>
            {label}
          </button>
        ))}
      </div>

      {/* dedup toolbar */}
      <div className="flex items-center justify-end mb-3">
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8 border-orange-200 text-orange-600 hover:bg-orange-50"
          onClick={() => dedup.mutate()} disabled={dedup.isPending} data-testid="button-clean-duplicates">
          {dedup.isPending
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cleaning…</>
            : <><RefreshCw className="w-3.5 h-3.5" /> Clean Duplicates</>}
        </Button>
      </div>

      {/* add category dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name</label>
              <Input placeholder="e.g. Subscriptions" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} data-testid="input-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Color</label>
                <Input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="h-10" data-testid="input-color" />
              </div>
            </div>
            {formData.type === "expense" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Budget Allocation %</label>
                <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 10" value={formData.allocationPercentage} onChange={e => setFormData({ ...formData, allocationPercentage: e.target.value })} data-testid="input-allocation" />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" style={{ backgroundColor: BRAND }} disabled={createCategory.isPending} data-testid="button-submit-category">
                {createCategory.isPending ? "Saving…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* expense categories */}
      {activeTab === "expense" && (
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">Expense Categories</h3>
                <p className="text-xs text-gray-400">{expenseCategories.length} categories · budget allocation</p>
              </div>
              <div className="flex items-center gap-3">
                <SavedIndicator state={savingState} />
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalAllocation > 100 ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" : totalAllocation >= 95 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"}`}>
                  {totalAllocation.toFixed(1)}% allocated
                </div>
                <Button onClick={() => { setFormData(p => ({ ...p, type: "expense" })); setShowForm(true); }} className="gap-1.5 rounded-xl h-8 text-xs" style={{ backgroundColor: BRAND }} data-testid="button-add-category">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>

            {/* allocation bar */}
            <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${Math.min(totalAllocation, 100)}%`,
                backgroundColor: totalAllocation > 100 ? DANGER : totalAllocation >= 95 ? AMBER : MINT,
              }} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Category","Color","Type","Budget %",""].map(h => (
                      <th key={h} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${h === "Budget %" ? "text-center" : h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenseCategories.map((cat: any) => {
                    const curAlloc = editingAllocations[cat.id] !== undefined ? editingAllocations[cat.id] : (cat.allocationPercentage || "");
                    const isEditing = editingAllocations[cat.id] !== undefined;
                    return (
                      <tr key={cat.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group" data-testid={`row-category-${cat.id}`}>
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white text-sm">{cat.name}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: cat.color || "#94A3B8" }} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.isSystem ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"}`}>
                            {cat.isSystem ? "System" : "Custom"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 justify-center">
                            <input type="number" step="0.1" min="0" max="100"
                              className="w-16 text-center h-7 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1"
                              style={{ "--ring-color": BRAND } as any}
                              value={curAlloc}
                              onChange={e => setEditingAllocations({ ...editingAllocations, [cat.id]: e.target.value })}
                              data-testid={`input-alloc-${cat.id}`}
                            />
                            <span className="text-xs text-gray-400">%</span>
                            {isEditing && (
                              <button onClick={() => handleSaveAlloc(cat.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" data-testid={`button-save-alloc-${cat.id}`}>
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => handleDelete(cat.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-auto" data-testid={`button-delete-${cat.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {expenseCategories.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No expense categories. Add one above.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* income categories */}
      {activeTab === "income" && (
        <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">Income Categories</h3>
                <p className="text-xs text-gray-400">{incomeCategories.length} categories</p>
              </div>
              <Button onClick={() => { setFormData(p => ({ ...p, type: "income" })); setShowForm(true); }} className="gap-1.5 rounded-xl h-8 text-xs" style={{ backgroundColor: BRAND }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Category","Color","Type",""].map(h => (
                      <th key={h} className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incomeCategories.map((cat: any) => (
                    <tr key={cat.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group">
                      <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                      <td className="py-2.5 px-3"><div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color || "#94A3B8" }} /></td>
                      <td className="py-2.5 px-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.isSystem ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"}`}>{cat.isSystem ? "System" : "Custom"}</span></td>
                      <td className="py-2.5 px-3 text-right">
                        {!cat.isSystem && (
                          <button onClick={() => handleDelete(cat.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-auto">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {incomeCategories.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No income categories yet.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* investment & asset categories */}
      {activeTab === "investment" && (
        <div className="space-y-4">
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Investment Types</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INVEST_TYPES.map(t => (
                  <div key={t.name} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color + "33" }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                        <p className="text-[10px] text-gray-400">Risk: {t.risk}</p>
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-4">Asset Types</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[["Real Estate","Appreciates",BRAND],["Vehicle","Depreciates",AMBER],["Equipment","Depreciates","#6366F1"],["Jewelry","Appreciates","#EC4899"],["Other","Stable","#64748B"]].map(([name, trend, color]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{name}</p>
                      <p className="text-[10px]" style={{ color: trend === "Appreciates" ? MINT : trend === "Depreciates" ? DANGER : AMBER }}>{trend}</p>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color as string }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function NotificationsSection() {
  const groups = [
    { label: "Budget Alerts", items: ["75% of category budget reached","90% of category budget reached","Category budget exceeded","Monthly budget summary"] },
    { label: "Goals",         items: ["Goal milestone reached","Goal deadline approaching","Goal completed"] },
    { label: "Bills & Recurring", items: ["Bill due soon","Recurring payment processed","Unusual charge detected"] },
    { label: "Investments",   items: ["Portfolio value change >5%","Dividend received","Asset price alert"] },
    { label: "Security",      items: ["New device login","Password changed","Suspicious activity"] },
    { label: "AI Insights",   items: ["Weekly AI summary","Important insights","Anomalies detected"] },
  ];

  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  const [quietHours, setQuietHours] = useState(false);

  const toggle = (key: string) => setNotifs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <SectionCard title="Notification Channels" sub="Choose how you receive alerts">
        <Toggle checked={notifs["email"] ?? true}   onChange={() => toggle("email")}   label="Email Notifications"      sub="mohammedfalzaq@gmail.com" />
        <Toggle checked={notifs["push"] ?? false}   onChange={() => toggle("push")}   label="Push Notifications"       sub="Browser and mobile" />
        <Toggle checked={notifs["sms"] ?? false}    onChange={() => toggle("sms")}    label="SMS Notifications"        sub="Requires phone number" />
        <Toggle checked={notifs["inapp"] ?? true}   onChange={() => toggle("inapp")}  label="In-App Notifications"     sub="Alerts within Wealthly" />
      </SectionCard>

      {groups.map(g => (
        <SectionCard key={g.label} title={g.label}>
          {g.items.map(item => (
            <Toggle key={item} checked={notifs[item] ?? true} onChange={() => toggle(item)} label={item} />
          ))}
        </SectionCard>
      ))}

      <SectionCard title="Quiet Hours" sub="Pause non-critical notifications">
        <Toggle checked={quietHours} onChange={setQuietHours} label="Enable Quiet Hours" sub="No notifications during this window" />
        {quietHours && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
              <Input type="time" defaultValue="22:00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
              <Input type="time" defaultValue="08:00" />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SecuritySection() {
  const [hideBalances, setHideBalances] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [autoLock, setAutoLock] = useState(true);

  return (
    <div>
      <SectionCard title="Password" sub="Last changed: Never">
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your password is set via Replit authentication.</p>
          <Button variant="outline" className="rounded-xl text-xs h-8 gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Change
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" sub="Add an extra layer of security">
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: twoFa ? "#ECFDF5" : "#FEF2F2" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: twoFa ? MINT + "33" : DANGER + "33" }}>
              {twoFa ? <Check className="w-4 h-4" style={{ color: MINT }} /> : <X className="w-4 h-4" style={{ color: DANGER }} />}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: twoFa ? "#059669" : DANGER }}>{twoFa ? "2FA Enabled" : "2FA Disabled"}</p>
              <p className="text-xs text-gray-400">{twoFa ? "Your account is protected" : "Recommended for security"}</p>
            </div>
          </div>
          <Button onClick={() => setTwoFa(!twoFa)} className="rounded-xl text-xs h-8" style={{ backgroundColor: twoFa ? "#F1F5F9" : BRAND, color: twoFa ? "#64748B" : "#fff" }}>
            {twoFa ? "Disable" : "Enable 2FA"}
          </Button>
        </div>
        {!twoFa && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Available methods:</p>
            {["Authenticator App (TOTP)","SMS (Fallback)","Email (Fallback)"].map(m => (
              <div key={m} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{m}</p>
                <button className="text-xs text-blue-600 font-semibold">Set up →</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Privacy Shield" sub="Control what others can see">
        <Toggle checked={hideBalances} onChange={setHideBalances} label="Hide All Balances" sub="Masks money values as ••••••" />
        <Toggle checked={autoLock}    onChange={setAutoLock}    label="Auto-Lock on Background" sub="Require auth when returning to app" />
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Require Authentication For</p>
          {["Export Data","Delete Data","Transfers > $1,000"].map(item => (
            <Toggle key={item} checked={notifState(item)} onChange={() => {}} label={item} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Security Activity">
        {[
          { event: "Login from Chrome on Windows", time: "Today, 8:33 PM", safe: true },
          { event: "Login from iPhone Safari",      time: "Yesterday, 2:14 PM", safe: true },
        ].map((e, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: e.safe ? "#ECFDF5" : "#FEF2F2" }}>
                {e.safe ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{e.event}</p>
                <p className="text-[10px] text-gray-400">{e.time}</p>
              </div>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function notifState(key: string) { return false; }

function AISection() {
  const [personality, setPersonality] = useState("balanced");
  const [tone, setTone]               = useState("friendly");
  const [caps, setCaps]               = useState({ proactive: true, autocat: true, anomaly: true, spending: true, goals: true, invest: false, zakat: true, tax: false });
  const toggleCap = (k: keyof typeof caps) => setCaps(p => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <SectionCard title="AI Personality" sub="Customize how Wealthly AI behaves">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">AI Model Persona</label>
            <Select value={personality} onValueChange={setPersonality}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Default (Balanced)</SelectItem>
                <SelectItem value="advisor">Financial Advisor</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="islamic">Islamic Finance Aware</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Response Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="AI Capabilities" sub="Control what Wealthly AI can do">
        <Toggle checked={caps.proactive} onChange={() => toggleCap("proactive")} label="Proactive Insights on Dashboard" sub="AI surfaces insights you didn't ask for" />
        <Toggle checked={caps.autocat}   onChange={() => toggleCap("autocat")}   label="Auto-Categorize Transactions"   sub="AI suggests category from merchant name" />
        <Toggle checked={caps.anomaly}   onChange={() => toggleCap("anomaly")}   label="Anomaly Detection"               sub="Flag unusual transactions" />
        <Toggle checked={caps.spending}  onChange={() => toggleCap("spending")}  label="Spending Pattern Analysis"       sub="Weekly/monthly pattern summaries" />
        <Toggle checked={caps.goals}     onChange={() => toggleCap("goals")}     label="Goal Recommendations"            sub="Suggest adjustments to meet goals" />
        <Toggle checked={caps.invest}    onChange={() => toggleCap("invest")}    label="Investment Suggestions"          sub="Includes regulatory disclaimer" />
        <Toggle checked={caps.zakat}     onChange={() => toggleCap("zakat")}     label="Zakat Calculations"              sub="Islamic finance calculations" />
        <Toggle checked={caps.tax}       onChange={() => toggleCap("tax")}       label="Tax Optimization Hints"          sub="General tax efficiency suggestions" />
      </SectionCard>

      <SectionCard title="AI Data Access" sub="What information can the AI see">
        {[["Transactions","Full transaction history"],["Budget","Category limits and spending"],["Goals","Savings goals and progress"],["Debts","Debt balances and payments"],["Investments","Portfolio data"],["Personal Info","Name, age, location"]].map(([label, desc]) => (
          <Toggle key={label} checked={["Transactions","Budget","Goals","Debts"].includes(label)} onChange={() => {}} label={label} sub={desc} />
        ))}
      </SectionCard>

      <SectionCard title="AI Chat History">
        <div className="flex gap-3">
          <Button variant="outline" className="gap-1.5 rounded-xl text-xs"><Download className="w-3.5 h-3.5" /> Download History</Button>
          <Button variant="outline" className="gap-1.5 rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Clear History</Button>
        </div>
      </SectionCard>
    </div>
  );
}

function DataSection() {
  return (
    <div>
      <SectionCard title="Export Data" sub="Download your financial data">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {["CSV","Excel","JSON","PDF"].map(f => (
              <button key={f} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{f}</button>
            ))}
          </div>
          <Button className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }}>
            <Download className="w-4 h-4" /> Export All My Data
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Import Data" sub="Bring data from other apps">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {["CSV File","Mint","YNAB","Personal Capital","Quicken","Excel"].map(src => (
            <button key={src} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">{src}</button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Privacy Controls">
        <Toggle checked={false} onChange={() => {}} label="Anonymous Analytics"           sub="Help improve Wealthly (no personal data)" />
        <Toggle checked={false} onChange={() => {}} label="Share Data to Improve AI"      sub="Anonymized transaction patterns only" />
        <Toggle checked={true}  onChange={() => {}} label="Product Updates via Email"     sub="New features and improvements" />
        <Toggle checked={false} onChange={() => {}} label="Marketing Communications"      sub="Promotions and offers" />
      </SectionCard>

      <SectionCard title="Data Retention">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">Auto-delete transactions older than</p>
          <Select defaultValue="never">
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="3y">3 Years</SelectItem>
              <SelectItem value="5y">5 Years</SelectItem>
              <SelectItem value="10y">10 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>
    </div>
  );
}

function LocalizationSection() {
  const { currency, setCurrency } = useCurrency();
  const { t } = useI18n();
  const { user, updatePreferences } = useAuth();
  const { toast } = useToast();
  const [savingCurrency, setSavingCurrency] = useState<"idle"|"saving"|"saved">("idle");

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    setSavingCurrency("saving");
    try {
      await updatePreferences({ currency: value });
      setSavingCurrency("saved");
      setTimeout(() => setSavingCurrency("idle"), 2000);
    } catch { toast({ title: "Failed to update currency", variant: "destructive" }); setSavingCurrency("idle"); }
  };

  return (
    <div>
      <SectionCard title="Language & Region">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">App Language</label>
            <Select defaultValue="en">
              <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Region</label>
            <Select defaultValue="us">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="gb">United Kingdom</SelectItem>
                <SelectItem value="sa">Saudi Arabia</SelectItem>
                <SelectItem value="ae">UAE</SelectItem>
                <SelectItem value="il">Israel</SelectItem>
                <SelectItem value="om">Oman</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Currency" sub="Primary display currency for all amounts" action={<SavedIndicator state={savingCurrency} />}>
        <div className="max-w-xs">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Display Currency</label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-2">All amounts are stored in USD and converted for display using current exchange rates.</p>
        </div>
      </SectionCard>

      <SectionCard title="Regional Financial Rules">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tax Year Start</label>
            <Select defaultValue="jan">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["January","April","July","October"].map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Zakat Method</label>
            <Select defaultValue="gold">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">Gold Standard (87.48g)</SelectItem>
                <SelectItem value="silver">Silver Standard (612.36g)</SelectItem>
                <SelectItem value="cash">Cash Nisab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function BillingSection() {
  const plans = [
    { name: "Free",   price: "$0",    color: "#94A3B8", features: ["50 transactions/mo","2 accounts","Basic insights"] },
    { name: "Plus",   price: "$9",    color: BRAND,     features: ["Unlimited transactions","10 accounts","AI insights","CSV export"] },
    { name: "Pro",    price: "$19",   color: PURPLE,    features: ["Everything in Plus","Unlimited accounts","Advanced AI","Priority support"] },
    { name: "Family", price: "$29",   color: AMBER,     features: ["Everything in Pro","Up to 5 members","Shared budgets","Family reports"] },
  ];
  const [current] = useState("Free");

  return (
    <div>
      <SectionCard title="Current Plan">
        <div className="flex items-center justify-between p-4 rounded-xl mb-4 bg-gradient-to-br from-[#EEF4FF] to-[#F5F3FF] dark:from-[#0F1A30] dark:to-[#1A1630]">
          <div>
            <p className="text-xs text-gray-500 mb-1">Active Plan</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Free</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Current</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">50 transactions used of 50 limit this month</p>
          </div>
          <Button className="gap-2 rounded-xl" style={{ backgroundColor: BRAND }}>
            <Crown className="w-4 h-4" /> Upgrade
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Plan Comparison">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {plans.map(p => (
            <div key={p.name} className={`p-4 rounded-xl border-2 ${p.name === current ? "border-blue-400" : "border-gray-100 dark:border-gray-800"}`}>
              <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
              <p className="text-xl font-bold mt-1" style={{ color: p.color }}>{p.price}<span className="text-xs text-gray-400">/mo</span></p>
              <ul className="mt-3 space-y-1">
                {p.features.map(f => <li key={f} className="text-[10px] text-gray-500 flex items-start gap-1"><Check className="w-2.5 h-2.5 mt-0.5 shrink-0 text-emerald-500" />{f}</li>)}
              </ul>
              {p.name !== current && (
                <button className="mt-3 w-full text-[11px] font-semibold py-1.5 rounded-lg transition-colors" style={{ backgroundColor: p.color + "22", color: p.color }}>
                  Choose {p.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DevicesSection() {
  const devices = [
    { name: "Chrome on Windows",  type: "laptop", location: "London, UK",    last: "Now",            current: true  },
    { name: "iPhone 15 Safari",   type: "phone",  location: "London, UK",    last: "2 hours ago",    current: false },
    { name: "Firefox on macOS",   type: "laptop", location: "New York, US",  last: "3 days ago",     current: false },
  ];

  return (
    <div>
      <SectionCard title="Active Sessions" action={<Button variant="outline" className="rounded-xl text-xs h-8 text-red-600 border-red-200">Sign Out All Others</Button>}>
        <div className="space-y-2">
          {devices.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {d.type === "phone" ? <Smartphone className="w-4 h-4 text-gray-600" /> : <Monitor className="w-4 h-4 text-gray-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{d.name}</p>
                    {d.current && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">Current</span>}
                  </div>
                  <p className="text-[10px] text-gray-400">{d.location} · {d.last}</p>
                </div>
              </div>
              {!d.current && <button className="text-xs font-medium text-red-500 hover:text-red-700">Sign out</button>}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function HelpSection() {
  const articles = [
    "Getting Started with Wealthly",
    "How to connect bank accounts",
    "Setting up budgets and alerts",
    "Understanding your Net Worth",
    "Using the AI Financial Coach",
    "Zakat calculation guide",
  ];

  return (
    <div>
      <SectionCard title="Help Center" sub="Find answers to common questions">
        <div className="space-y-2">
          {articles.map(a => (
            <a key={a} href="#" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <p className="text-sm text-gray-700 dark:text-gray-300">{a}</p>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </a>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Contact Support">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="mailto:support@wealthly.app" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><Info className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Email Support</p><p className="text-[10px] text-gray-400">Response within 24 hours</p></div>
          </a>
          <button className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center"><Zap className="w-4 h-4 text-purple-600" /></div>
            <div className="text-left"><p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Live Chat</p><p className="text-[10px] text-gray-400">Currently offline</p></div>
          </button>
        </div>
      </SectionCard>

      <SectionCard title="App Information">
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between"><span>Version</span><span className="font-mono text-gray-700 dark:text-gray-300">1.0.0</span></div>
          <div className="flex justify-between"><span>Build</span><span className="font-mono text-gray-700 dark:text-gray-300">2026.04.20</span></div>
        </div>
        <div className="flex gap-3 mt-4">
          <a href="#" className="text-xs text-blue-600 hover:underline">Terms of Service</a>
          <a href="#" className="text-xs text-blue-600 hover:underline">Privacy Policy</a>
          <a href="#" className="text-xs text-blue-600 hover:underline">Licenses</a>
        </div>
      </SectionCard>
    </div>
  );
}

function DangerZoneSection() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-400">Actions in this section are permanent and cannot be undone. Proceed with extreme caution.</p>
      </div>

      <Card className="border-2 border-red-100 dark:border-red-900/30 rounded-2xl mb-4">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 text-base">Reset All Data</h3>
              <p className="text-xs text-gray-500 mt-1">Clears all transactions, budgets, goals, investments. Your account remains active.</p>
            </div>
            <Button variant="outline" onClick={() => setConfirmReset(true)} className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs h-8 shrink-0">
              Reset Data
            </Button>
          </div>
          {confirmReset && (
            <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30">
              <p className="text-xs font-semibold text-red-700 mb-2">⚠️ This cannot be undone. Type "RESET" to confirm:</p>
              <div className="flex gap-2">
                <Input placeholder="Type RESET" className="text-xs h-8 border-red-300" />
                <Button className="h-8 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm Reset</Button>
                <button onClick={() => setConfirmReset(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancel</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-red-100 dark:border-red-900/30 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 text-base">Delete Account Permanently</h3>
              <p className="text-xs text-gray-500 mt-1">Exports all your data, then permanently deletes your account and all associated data. This action is irreversible.</p>
            </div>
            <Button variant="outline" onClick={() => setConfirmDelete(true)} className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs h-8 shrink-0">
              Delete Account
            </Button>
          </div>
          {confirmDelete && (
            <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30">
              <p className="text-xs font-semibold text-red-700 mb-3">⚠️ We'll first export all your data, then permanently delete your account.</p>
              <div className="flex gap-2 flex-wrap">
                <Button className="h-8 text-xs rounded-lg gap-1.5" style={{ backgroundColor: BRAND }}><Download className="w-3 h-3" /> Export & Delete</Button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3">Cancel</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
═══════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user }   = useAuth();
  const { t, lang } = useI18n();
  const [activeSection, setActiveSection] = useState("profile");

  const currentSection = NAV_SECTIONS.find(s => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case "profile":       return <ProfileSection user={user} />;
      case "preferences":  return <PreferencesSection />;
      case "categories":   return <CategoriesSection user={user} />;
      case "notifications":return <NotificationsSection />;
      case "security":     return <SecuritySection />;
      case "ai":           return <AISection />;
      case "data":         return <DataSection />;
      case "localization": return <LocalizationSection />;
      case "billing":      return <BillingSection />;
      case "devices":      return <DevicesSection />;
      case "help":         return <HelpSection />;
      case "danger":       return <DangerZoneSection />;
      case "integrations": return (
        <SectionCard title="Accounts & Integrations" sub="Connect external services to Wealthly">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Plaid",           desc: "Bank account aggregation",       status: false },
              { name: "Google Sheets",   desc: "Auto-sync to spreadsheet",       status: false },
              { name: "QuickBooks",      desc: "Accounting software",             status: false },
              { name: "Google Calendar", desc: "Bill payment reminders",         status: false },
              { name: "Zapier",          desc: "Workflow automation",             status: false },
              { name: "TurboTax",        desc: "Tax filing integration",         status: false },
            ].map(int => (
              <div key={int.name} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{int.name}</p>
                  <p className="text-[10px] text-gray-400">{int.desc}</p>
                </div>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {int.status ? "Connected" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      );
      default: return <p className="text-gray-400 text-sm">Section coming soon.</p>;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-10">
        {/* page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">{t("settings.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("settings.subtitle")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {lang === "ar" ? "حفظ تلقائي" : "Changes auto-save"}
          </div>
        </div>

        <div className="flex gap-6">
          {/* LEFT sub-nav */}
          <div className="w-56 shrink-0 hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              {NAV_SECTIONS.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                const isDanger = s.id === "danger";
                return (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={isActive
                      ? { backgroundColor: isDanger ? "#FEF2F2" : "#EEF4FF", color: isDanger ? DANGER : BRAND }
                      : { color: "#64748B" }}>
                    <Icon className="w-4 h-4 shrink-0" style={isActive ? { color: isDanger ? DANGER : BRAND } : { color: "#94A3B8" }} />
                    <span className={`text-xs font-medium ${isDanger ? "text-red-500" : ""}`} style={isActive && !isDanger ? { color: BRAND } : isDanger ? { color: DANGER } : {}}>{t(s.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* mobile nav */}
          <div className="lg:hidden w-full mb-4">
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NAV_SECTIONS.map(s => <SelectItem key={s.id} value={s.id}>{t(s.label)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* RIGHT content */}
          <div className="flex-1 min-w-0">
            {/* section breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
              <span>{t("settings.title")}</span>
              <ChevronRight className="w-3 h-3 rtl:rotate-180" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{currentSection ? t(currentSection.label) : ""}</span>
            </div>

            {renderSection()}
          </div>
        </div>
      </div>
    </Layout>
  );
}

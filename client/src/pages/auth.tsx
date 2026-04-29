import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Eye, EyeOff, Globe } from "lucide-react";

// Country codes & Arabic names — kept as-is so backend receives canonical names
const COUNTRIES: Array<{ code: string; en: string; ar: string }> = [
  { code: "SA", en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  { code: "AE", en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  { code: "US", en: "United States", ar: "الولايات المتحدة" },
  { code: "GB", en: "United Kingdom", ar: "المملكة المتحدة" },
  { code: "EG", en: "Egypt", ar: "مصر" },
  { code: "JO", en: "Jordan", ar: "الأردن" },
  { code: "KW", en: "Kuwait", ar: "الكويت" },
  { code: "BH", en: "Bahrain", ar: "البحرين" },
  { code: "QA", en: "Qatar", ar: "قطر" },
  { code: "OM", en: "Oman", ar: "عُمان" },
  { code: "IQ", en: "Iraq", ar: "العراق" },
  { code: "LB", en: "Lebanon", ar: "لبنان" },
  { code: "MA", en: "Morocco", ar: "المغرب" },
  { code: "TN", en: "Tunisia", ar: "تونس" },
  { code: "DZ", en: "Algeria", ar: "الجزائر" },
  { code: "LY", en: "Libya", ar: "ليبيا" },
  { code: "SD", en: "Sudan", ar: "السودان" },
  { code: "IN", en: "India", ar: "الهند" },
  { code: "PK", en: "Pakistan", ar: "باكستان" },
  { code: "BD", en: "Bangladesh", ar: "بنغلاديش" },
  { code: "TR", en: "Turkey", ar: "تركيا" },
  { code: "DE", en: "Germany", ar: "ألمانيا" },
  { code: "FR", en: "France", ar: "فرنسا" },
  { code: "CA", en: "Canada", ar: "كندا" },
  { code: "AU", en: "Australia", ar: "أستراليا" },
  { code: "JP", en: "Japan", ar: "اليابان" },
  { code: "KR", en: "South Korea", ar: "كوريا الجنوبية" },
  { code: "CN", en: "China", ar: "الصين" },
  { code: "BR", en: "Brazil", ar: "البرازيل" },
  { code: "MX", en: "Mexico", ar: "المكسيك" },
  { code: "ZA", en: "South Africa", ar: "جنوب أفريقيا" },
  { code: "NG", en: "Nigeria", ar: "نيجيريا" },
  { code: "KE", en: "Kenya", ar: "كينيا" },
  { code: "OTHER", en: "Other", ar: "أخرى" },
];

function WealthlyLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1B4FE4" />
      <path d="M6 11L13 29L20 16L27 29L34 11" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 29L20 16L27 29" stroke="#00C896" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang, setLang, isRtl } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", country: "", password: "", confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message || t("auth.errorLoginFailed"), variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/dashboard");
    } catch {
      toast({ title: t("auth.errorLoginFailed"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({ title: t("auth.errorPasswordMismatch"), variant: "destructive" });
      return;
    }
    if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.phone || !signupForm.country || !signupForm.password) {
      toast({ title: t("auth.errorFillFields"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = signupForm;
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message || t("auth.errorSignupFailed"), variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/dashboard");
    } catch {
      toast({ title: t("auth.errorSignupFailed"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)" }} dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 -z-10" style={{ background: "radial-gradient(circle, #4F8EF7 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 -z-10" style={{ background: "radial-gradient(circle, #00C896 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      {/* Language Switcher (top-right corner) */}
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className="absolute top-4 end-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#1B4FE4] hover:border-[#1B4FE4] transition-all"
        data-testid="button-toggle-language"
      >
        <Globe className="w-3.5 h-3.5" />
        {lang === "en" ? "العربية" : "English"}
      </button>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <WealthlyLogo size={44} />
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="text-3xl font-bold text-[#1B4FE4] tracking-tight leading-none">Wealthly</h1>
            <p className="text-[#64748B] text-xs mt-0.5">{t("common.tagline")}</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm" style={{ boxShadow: "0 20px 60px rgba(27, 79, 228, 0.12)" }}>
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl text-[#0F1729]">
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
            </CardTitle>
            <p className="text-sm text-[#64748B] mt-1">
              {mode === "login" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.email")}</label>
                  <Input
                    data-testid="input-login-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8] focus-visible:border-[#1B4FE4]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.password")}</label>
                  <div className="relative">
                    <Input
                      data-testid="input-login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8] focus-visible:border-[#1B4FE4]"
                    />
                    <button type="button" className="absolute end-3 top-2.5 text-[#94A3B8] hover:text-[#64748B]" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-white transition-all duration-200"
                  style={{ background: "#1B4FE4" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1640C0")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1B4FE4")}
                  disabled={isSubmitting}
                  data-testid="button-login"
                >
                  {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.firstName")}</label>
                    <Input
                      data-testid="input-first-name"
                      placeholder={t("auth.firstNamePlaceholder")}
                      value={signupForm.firstName}
                      onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.lastName")}</label>
                    <Input
                      data-testid="input-last-name"
                      placeholder={t("auth.lastNamePlaceholder")}
                      value={signupForm.lastName}
                      onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.email")}</label>
                  <Input
                    data-testid="input-signup-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.phone")}</label>
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    placeholder={t("auth.phonePlaceholder")}
                    value={signupForm.phone}
                    onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.country")}</label>
                  <Select value={signupForm.country} onValueChange={v => setSignupForm({ ...signupForm, country: v })}>
                    <SelectTrigger data-testid="select-country" className="border-[#CBD5E1]"><SelectValue placeholder={t("auth.selectCountry")} /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.en}>
                          {lang === "ar" ? c.ar : c.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.password")}</label>
                  <div className="relative">
                    <Input
                      data-testid="input-signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordSignupPlaceholder")}
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                    <button type="button" className="absolute end-3 top-2.5 text-[#94A3B8]" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">{t("auth.confirmPassword")}</label>
                  <Input
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={signupForm.confirmPassword}
                    onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-white"
                  style={{ background: "#1B4FE4" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1640C0")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1B4FE4")}
                  disabled={isSubmitting}
                  data-testid="button-signup"
                >
                  {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-[#64748B]">
              {mode === "login" ? (
                <p>
                  {t("auth.noAccount")}{" "}
                  <button className="text-[#1B4FE4] font-semibold hover:text-[#1640C0] hover:underline transition-colors" onClick={() => setMode("signup")} data-testid="link-signup">
                    {t("auth.signUp")}
                  </button>
                </p>
              ) : (
                <p>
                  {t("auth.haveAccount")}{" "}
                  <button className="text-[#1B4FE4] font-semibold hover:text-[#1640C0] hover:underline transition-colors" onClick={() => setMode("login")} data-testid="link-login">
                    {t("auth.signIn")}
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

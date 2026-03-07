import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard, Wallet, Receipt, TrendingUp, Building2,
  Landmark, HandCoins, Target, PieChart, Star, Moon, Sun,
  LineChart, ChevronDown, Check, ArrowRight, Globe,
} from "lucide-react";

const content = {
  en: {
    dir: "ltr" as const,
    nav: { login: "Login", signup: "Sign Up" },
    hero: {
      badge: "Smart Personal Finance",
      headline: "Take Full Control of Your",
      headlineAccent: "Financial Life",
      sub: "Wealthly brings all your finances into one place — income, expenses, investments, assets, debts, goals and Zakat — with beautiful insights and full bilingual support.",
      cta1: "Get Started Free",
      cta2: "See Features",
    },
    features: {
      title: "Everything You Need",
      sub: "10 powerful modules to manage every aspect of your money",
      items: [
        { icon: LayoutDashboard, title: "Dashboard & Overview", desc: "Visual snapshot of your entire financial life at a glance." },
        { icon: Wallet, title: "Income Tracking", desc: "Record every salary, freelance, or passive income stream." },
        { icon: Receipt, title: "Expense Management", desc: "Categorize and analyse where every dirham goes." },
        { icon: TrendingUp, title: "Investment Portfolio", desc: "Track stocks, crypto, gold and other investments." },
        { icon: Building2, title: "Assets Management", desc: "Manage properties, vehicles and all your owned assets." },
        { icon: Landmark, title: "Bank Accounts", desc: "Monitor multiple bank accounts in multiple currencies." },
        { icon: HandCoins, title: "Debt Tracking", desc: "Stay on top of loans and repayments effortlessly." },
        { icon: Target, title: "Goals & Savings", desc: "Set financial goals and track your progress over time." },
        { icon: PieChart, title: "Budget Planning", desc: "Allocate income to categories and stick to your plan." },
        { icon: Star, title: "Zakat Calculator", desc: "Calculate your annual Zakat with live gold/silver rates." },
      ],
    },
    stats: {
      title: "Everything you need to manage your money",
      items: [
        { value: "10+", label: "Powerful Features" },
        { value: "∞", label: "Multi-currency Support" },
        { value: "AR / EN", label: "Arabic & English" },
      ],
    },
    tags: ["Multi-currency", "Dark Mode", "RTL Support", "Budget Planning", "Zakat Calculator", "Investment Tracking", "Goal Setting", "Debt Management"],
    testimonials: {
      title: "Trusted by users worldwide",
      items: [
        { name: "Ahmed Al-Rashidi", role: "Business Owner, Saudi Arabia", text: "Wealthly changed how I manage my finances. The Zakat calculator alone is worth it. I can finally track my investments and expenses across multiple currencies without any headache.", avatar: "A" },
        { name: "Sarah Johnson", role: "Finance Analyst, UAE", text: "The budget planning and goal tracking features are incredible. I've managed to save 30% more every month since I started using Wealthly. The dark mode is gorgeous too!", avatar: "S" },
        { name: "Mohammed Al-Farsi", role: "Entrepreneur, Qatar", text: "Finally a financial app that truly supports Arabic! The RTL layout is perfect and switching between languages is seamless. My whole team uses it now.", avatar: "M" },
      ],
    },
    cta: { title: "Start managing your finances today", sub: "Join thousands of users who trust Wealthly to take control of their money.", button: "Sign Up Free" },
    footer: { copy: "© 2026 Wealthly. All rights reserved." },
  },
  ar: {
    dir: "rtl" as const,
    nav: { login: "تسجيل الدخول", signup: "إنشاء حساب" },
    hero: {
      badge: "إدارة مالية ذكية",
      headline: "تحكم كامل في",
      headlineAccent: "حياتك المالية",
      sub: "Wealthly يجمع كل أمورك المالية في مكان واحد — الدخل والمصروفات والاستثمارات والأصول والديون والأهداف والزكاة — مع رؤى تحليلية ودعم كامل للغتين.",
      cta1: "ابدأ مجاناً",
      cta2: "استعرض المميزات",
    },
    features: {
      title: "كل ما تحتاجه",
      sub: "١٠ وحدات متكاملة لإدارة كل جانب من جوانب أموالك",
      items: [
        { icon: LayoutDashboard, title: "لوحة التحكم والنظرة العامة", desc: "لمحة بصرية شاملة عن وضعك المالي بالكامل دفعة واحدة." },
        { icon: Wallet, title: "تتبع الدخل", desc: "سجّل كل راتب أو دخل حر أو مصدر دخل سلبي." },
        { icon: Receipt, title: "إدارة المصروفات", desc: "صنّف وحلّل أين يذهب كل درهم من أموالك." },
        { icon: TrendingUp, title: "محفظة الاستثمارات", desc: "تابع الأسهم والعملات الرقمية والذهب وسائر الاستثمارات." },
        { icon: Building2, title: "إدارة الأصول", desc: "أدر العقارات والمركبات وكافة الأصول التي تمتلكها." },
        { icon: Landmark, title: "الحسابات البنكية", desc: "راقب حسابات بنكية متعددة بعملات مختلفة." },
        { icon: HandCoins, title: "تتبع الديون", desc: "ابقَ على اطلاع بالقروض والأقساط بكل سهولة." },
        { icon: Target, title: "الأهداف والمدخرات", desc: "حدد أهدافاً مالية وتابع تقدمك عبر الزمن." },
        { icon: PieChart, title: "تخطيط الميزانية", desc: "وزّع دخلك على الفئات والتزم بخطتك المالية." },
        { icon: Star, title: "حاسبة الزكاة", desc: "احسب زكاتك السنوية بأسعار الذهب والفضة المباشرة." },
      ],
    },
    stats: {
      title: "كل ما تحتاجه لإدارة أموالك",
      items: [
        { value: "+١٠", label: "ميزة متكاملة" },
        { value: "∞", label: "دعم متعدد العملات" },
        { value: "عر / EN", label: "عربي وإنجليزي" },
      ],
    },
    tags: ["متعدد العملات", "الوضع المظلم", "دعم RTL", "تخطيط الميزانية", "حاسبة الزكاة", "تتبع الاستثمارات", "تحديد الأهداف", "إدارة الديون"],
    testimonials: {
      title: "موثوق به من مستخدمين حول العالم",
      items: [
        { name: "أحمد الراشدي", role: "صاحب أعمال، المملكة العربية السعودية", text: "غيّر Wealthly طريقة إدارتي لأموالي. حاسبة الزكاة وحدها تستحق التجربة. أستطيع الآن تتبع استثماراتي ومصروفاتي بعملات مختلفة دون أي تعقيد.", avatar: "أ" },
        { name: "سارة جونسون", role: "محللة مالية، الإمارات العربية المتحدة", text: "ميزات تخطيط الميزانية وتتبع الأهداف رائعة للغاية. تمكنت من توفير ٣٠٪ أكثر كل شهر منذ بدأت استخدام Wealthly. الوضع المظلم جميل جداً أيضاً!", avatar: "س" },
        { name: "محمد الفارسي", role: "رائد أعمال، قطر", text: "أخيراً تطبيق مالي يدعم العربية بشكل حقيقي! تخطيط RTL مثالي والتبديل بين اللغتين سلس جداً. أصبح فريقي كله يستخدمه الآن.", avatar: "م" },
      ],
    },
    cta: { title: "ابدأ إدارة مالياتك اليوم", sub: "انضم إلى آلاف المستخدمين الذين يثقون بـ Wealthly للسيطرة على أموالهم.", button: "سجّل مجاناً" },
    footer: { copy: "© ٢٠٢٦ Wealthly. جميع الحقوق محفوظة." },
  },
};

type Lang = "en" | "ar";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("landing-lang") as Lang) || "en");
  const [dark, setDark] = useState(() => localStorage.getItem("landing-theme") === "dark");
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  const t = content[lang];

  useEffect(() => { localStorage.setItem("landing-lang", lang); }, [lang]);

  useEffect(() => {
    localStorage.setItem("landing-theme", dark ? "dark" : "light");
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observe = (id: string, setter: (v: boolean) => void) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.1 });
      obs.observe(el);
      observers.push(obs);
    };
    observe("features-section", setFeaturesVisible);
    observe("stats-section", setStatsVisible);
    observe("testimonials-section", setTestimonialsVisible);
    observe("cta-section", setCtaVisible);
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div dir={t.dir} className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/landing">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LineChart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Wealthly</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLang((l) => l === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-lang-toggle"
            >
              <Globe className="w-4 h-4" />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-theme-toggle"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/auth">
              <button className="hidden sm:block text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5" data-testid="button-nav-login">
                {t.nav.login}
              </button>
            </Link>
            <Link href="/auth">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900/40" data-testid="button-nav-signup">
                {t.nav.signup}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-6 border border-blue-100 dark:border-blue-900">
              <Star className="w-3.5 h-3.5 fill-current" />
              {t.hero.badge}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              {t.hero.headline}{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                {t.hero.headlineAccent}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              {t.hero.sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:scale-105 active:scale-100 text-base" data-testid="button-hero-cta">
                  {t.hero.cta1} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={() => scrollTo("features-section")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-base"
                data-testid="button-hero-demo"
              >
                {t.hero.cta2} <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/40 dark:shadow-blue-900/30 border border-gray-200 dark:border-gray-800">
              {/* Browser chrome */}
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <div className="mx-auto flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-1 rounded-md text-xs text-gray-400 border border-gray-200 dark:border-gray-600">
                  🔒 fintrack.app/dashboard
                </div>
              </div>
              {/* App content */}
              <div className="flex bg-gray-50 dark:bg-gray-900" style={{ height: "360px" }}>
                {/* Sidebar */}
                <div className="hidden sm:flex w-44 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex-col p-4 gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                      <LineChart className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm">Wealthly</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Wallet, label: "Income", active: false },
                    { icon: Receipt, label: "Expenses", active: false },
                    { icon: TrendingUp, label: "Investments", active: false },
                    { icon: Building2, label: "Assets", active: false },
                    { icon: Target, label: "Goals", active: false },
                    { icon: Star, label: "Zakat", active: false },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${item.active ? "bg-blue-600 text-white" : "text-gray-400 dark:text-gray-500"}`}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Good morning</p>
                      <p className="text-sm font-bold dark:text-white">Mohammed Fouad</p>
                    </div>
                    <div className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">March 2026</div>
                  </div>
                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Total Income", value: "$11,299", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/50" },
                      { label: "Expenses", value: "$4,820", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/50" },
                      { label: "Net Savings", value: "$6,479", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50" },
                    ].map((card) => (
                      <div key={card.label} className={`${card.bg} rounded-xl p-3 border border-gray-100 dark:border-gray-800`}>
                        <p className="text-[9px] font-medium text-gray-400 mb-1.5">{card.label}</p>
                        <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart area */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-3">
                    <p className="text-[10px] text-gray-400 mb-3">Monthly Overview</p>
                    <div className="flex items-end gap-2 h-16">
                      {[
                        { inc: 70, exp: 40 }, { inc: 85, exp: 55 }, { inc: 60, exp: 35 },
                        { inc: 90, exp: 60 }, { inc: 75, exp: 45 }, { inc: 100, exp: 65 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex items-end gap-0.5">
                          <div className="flex-1 bg-blue-500 rounded-t opacity-80" style={{ height: `${bar.inc}%` }} />
                          <div className="flex-1 bg-red-400 rounded-t opacity-70" style={{ height: `${bar.exp}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                      <p className="text-[9px] text-gray-400 mb-2">Car Goal</p>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: "67%" }} />
                      </div>
                      <p className="text-[9px] text-gray-400">$6,700 / $10,000</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                      <p className="text-[9px] text-gray-400 mb-2">Budget Used</p>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                        <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "48%" }} />
                      </div>
                      <p className="text-[9px] text-gray-400">48% of monthly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features-section" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.features.title}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t.features.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {t.features.items.map((feature, i) => (
              <div
                key={i}
                className={`group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-950/30 transition-all duration-500 cursor-default ${
                  featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: featuresVisible ? `${i * 60}ms` : "0ms" }}
                data-testid={`card-feature-${i}`}
              >
                <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors group-hover:scale-110 duration-300">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm leading-snug">{feature.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats-section" className={`py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 transition-all duration-700 ${statsVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16">{t.stats.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-16">
            {t.stats.items.map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-item-${i}`}>
                <div className="text-5xl sm:text-6xl font-extrabold text-white mb-3 drop-shadow-sm">{stat.value}</div>
                <div className="text-blue-200 font-semibold text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {t.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur text-white rounded-full text-sm font-medium border border-white/20 hover:bg-white/25 transition-colors">
                <Check className="w-3.5 h-3.5" />{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials-section" className={`py-20 sm:py-28 bg-white dark:bg-gray-950 transition-all duration-700 ${testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">{t.testimonials.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.testimonials.items.map((item, i) => (
              <div
                key={i}
                className={`bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl dark:hover:shadow-blue-950/20 transition-all duration-500 ${testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: testimonialsVisible ? `${i * 100}ms` : "0ms" }}
                data-testid={`card-testimonial-${i}`}
              >
                <div className="flex text-yellow-400 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 text-sm">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta-section" className={`py-20 sm:py-28 bg-gray-50 dark:bg-gray-900 transition-all duration-700 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-10 sm:p-16 shadow-2xl shadow-blue-200/40 dark:shadow-blue-900/30 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">{t.cta.title}</h2>
            <p className="text-blue-100 text-lg mb-10 relative">{t.cta.sub}</p>
            <Link href="/auth">
              <button className="relative inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-100 shadow-lg text-lg" data-testid="button-cta-signup">
                {t.cta.button} <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Wealthly</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t.footer.copy}</p>
        </div>
      </footer>

    </div>
  );
}

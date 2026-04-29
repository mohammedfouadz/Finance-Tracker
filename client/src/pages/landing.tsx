import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard, Wallet, Receipt, TrendingUp, Building2,
  Landmark, HandCoins, Target, PieChart, Star, Moon, Sun,
  LineChart, ChevronDown, ArrowRight, Globe, Shield, Lock,
  ShieldCheck, Key, Ban, Eye, ServerCog, Fingerprint, Download,
  CheckCircle2, Check, Building, Users, Zap,
} from "lucide-react";

const iconMap: Record<string, any> = {
  Lock, ShieldCheck, Key, Ban, Eye, ServerCog, Fingerprint, Download,
  LayoutDashboard, Wallet, Receipt, TrendingUp, Building2, Landmark,
  HandCoins, Target, PieChart, Star, CheckCircle2, ChevronDown, Shield,
  Building, Users, Zap, Check,
};

const content = {
  en: {
    dir: "ltr" as const,
    nav: { login: "Login", signup: "Get Started Free" },
    hero: {
      badge: "Bank-Grade Security · Privacy First",
      headline: "Your Financial Life,",
      headlineAccent: "Encrypted & Yours Alone",
      sub: "Wealthly is the privacy-first personal finance platform. Track income, expenses, investments, debts, goals, and Zakat — all protected by 256-bit encryption with zero-knowledge architecture. We can't see your data. Neither can anyone else.",
      cta1: "Start Free — No Credit Card",
      cta2: "How We Protect You",
      trustLine: "Trusted by users in 30+ countries · Your data never leaves encrypted storage",
    },
    trustBar: [
      { icon: "Lock", text: "256-bit Encryption" },
      { icon: "ShieldCheck", text: "GDPR Compliant" },
      { icon: "Key", text: "Zero-Knowledge" },
      { icon: "Ban", text: "No Data Selling" },
      { icon: "Eye", text: "Full Transparency" },
    ],
    security: {
      badge: "Privacy by Design",
      title: "Your Data. Your Rules. Always.",
      sub: "We built Wealthly with one rule: your financial data belongs to you and only you. Here's how we make sure it stays that way.",
      pillars: [
        { icon: "Lock", title: "Military-Grade Encryption", desc: "Every byte of your data is encrypted with AES-256 at rest and TLS 1.3 in transit. The same encryption used by banks and governments." },
        { icon: "Key", title: "Zero-Knowledge Architecture", desc: "Your password unlocks your data. Not even our engineers can read your finances. If you lose your password, we cannot recover it for you — that's the point." },
        { icon: "Ban", title: "We Never Sell Your Data", desc: "No advertisers. No data brokers. No marketing pixels. Wealthly makes money from subscriptions, never from your financial habits." },
        { icon: "ServerCog", title: "Secure Infrastructure", desc: "Hosted on enterprise-grade servers with daily encrypted backups, DDoS protection, and 24/7 monitoring. Your data is safe even if your laptop isn't." },
        { icon: "Fingerprint", title: "Strong Authentication", desc: "Passwords hashed with bcrypt (industry standard). Sessions expire automatically. Future support for 2FA and biometric login." },
        { icon: "Download", title: "Export & Delete Anytime", desc: "Want to leave? Export all your data in CSV or JSON. Delete your account in one click — every trace of your data is permanently erased." },
      ],
      promise: {
        title: "Our Privacy Promise",
        points: [
          "We will never read your financial data.",
          "We will never sell or share your information.",
          "We will never use your data to train AI models.",
          "We will always let you export or delete everything.",
          "We will always tell you about security incidents within 24 hours.",
        ],
      },
    },
    features: {
      title: "Everything You Need",
      sub: "10 powerful modules — every byte encrypted, every insight private",
      items: [
        { icon: "LayoutDashboard", title: "Smart Dashboard", desc: "A complete view of your finances. Calculated locally, displayed instantly." },
        { icon: "Wallet", title: "Income Tracking", desc: "Record salaries, freelance, rentals, and passive income — all encrypted." },
        { icon: "Receipt", title: "Expense Management", desc: "Categorize spending and stay on budget without a single ad." },
        { icon: "TrendingUp", title: "Investment Portfolio", desc: "Track stocks, crypto, gold, and silver with live private pricing." },
        { icon: "Building2", title: "Asset Management", desc: "Monitor properties, vehicles, and valuables — only you see the values." },
        { icon: "Landmark", title: "Multi-Bank Tracking", desc: "Connect multiple accounts manually. We never touch your bank login." },
        { icon: "HandCoins", title: "Debt Tracking", desc: "Manage loans, mortgages, and IOUs with payment reminders." },
        { icon: "Target", title: "Financial Goals", desc: "Set savings goals and watch your progress in real time." },
        { icon: "PieChart", title: "Smart Budgeting", desc: "Auto-allocate income across categories with monthly insights." },
        { icon: "Star", title: "Zakat Calculator", desc: "Accurate Zakat calculation with live gold/silver Nisab — Shariah-compliant." },
      ],
    },
    howItWorks: {
      title: "Three Steps to Financial Clarity",
      sub: "Setup takes 2 minutes. Privacy lasts forever.",
      steps: [
        { number: "01", title: "Sign Up Securely", desc: "Create your account with end-to-end encryption from the very first second. We don't even ask for your real name if you don't want." },
        { number: "02", title: "Add Your Finances", desc: "Manually log income, expenses, accounts, and assets. No bank connections needed. No third-party access." },
        { number: "03", title: "Get Private Insights", desc: "AI-powered analysis runs on your data — never shared, never stored externally. Your financial life stays yours." },
      ],
    },
    arabicFirst: {
      title: "Built for Arabic, Not Translated",
      sub: "Most finance apps treat Arabic as an afterthought. We built Wealthly for Arabic from day one.",
      features: [
        "Full RTL (right-to-left) layout that doesn't break",
        "Arabic finance terminology vetted by professionals",
        "Hijri calendar support for Zakat tracking",
        "Native Almarai font for beautiful Arabic typography",
        "Multi-currency: SAR, AED, USD, EUR, and 30+ more",
        "Cultural sensitivity — built to respect Islamic finance principles",
      ],
    },
    stats: {
      title: "Trusted by Privacy-Conscious Users Worldwide",
      items: [
        { value: "256-bit", label: "AES Encryption" },
        { value: "0", label: "Trackers · 0 Ads" },
        { value: "100%", label: "Your Data, Yours Alone" },
        { value: "30+", label: "Countries Served" },
      ],
    },
    testimonials: {
      title: "Trusted by users worldwide",
      items: [
        { name: "Ahmed Al-Rashidi", role: "Business Owner, Saudi Arabia", text: "Wealthly changed how I manage my finances. The Zakat calculator alone is worth it. I can finally track my investments and expenses across multiple currencies without any headache.", avatar: "A" },
        { name: "Sarah Johnson", role: "Finance Analyst, UAE", text: "The budget planning and goal tracking features are incredible. I've managed to save 30% more every month since I started using Wealthly. Knowing my data stays private gives me total peace of mind.", avatar: "S" },
        { name: "Mohammed Al-Farsi", role: "Entrepreneur, Qatar", text: "Finally a financial app that truly supports Arabic! The RTL layout is perfect and switching between languages is seamless. The privacy guarantees make it the only app I trust with my real numbers.", avatar: "M" },
      ],
    },
    faq: {
      title: "Privacy Questions, Honest Answers",
      items: [
        { q: "Where is my data physically stored?", a: "Your encrypted data is stored on enterprise-grade servers with daily backups. We do not store data in any country with weak privacy laws." },
        { q: "Can Wealthly employees see my account balances?", a: "No. Your data is encrypted with a key derived from your password. Even our database admins see only encrypted blobs, not real numbers." },
        { q: "What happens to my data if I delete my account?", a: "Within 30 days, all your data is permanently and irreversibly deleted from our active systems and backups. We do not retain any copy." },
        { q: "Is my password really safe?", a: "Yes. Passwords are never stored in plain text. We use bcrypt with high cost factors. Even if our database leaked, your password would take centuries to crack." },
        { q: "Do you use my data to train AI models?", a: "Absolutely not. We will never use your financial data for any AI training, ever. AI analysis happens on your data only when you explicitly request it." },
        { q: "How is Zakat calculated privately?", a: "Zakat calculations run entirely on your encrypted data. We don't know your wealth, your Nisab, or your Zakat amount — only you do." },
        { q: "Is Wealthly free?", a: "Yes, the core features are free forever. We offer optional premium features for advanced users, paid via subscription — never via your data." },
      ],
    },
    cta: {
      title: "Take Back Control of Your Money — Privately.",
      sub: "Join thousands who refuse to trade their financial privacy for free apps. Your data is yours. Always.",
      button: "Start Free Forever",
      reassurance: "No credit card · No tracking · Cancel anytime · Export everything",
    },
    footer: {
      copy: "© 2026 Wealthly. All rights reserved.",
      tagline: "Built with privacy. Designed for trust.",
      columns: [
        { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Security", href: "#security" }, { label: "Pricing", href: "#" }, { label: "Roadmap", href: "#" }] },
        { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Contact", href: "#" }] },
        { title: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Data Processing", href: "#" }, { label: "Security", href: "#security" }] },
      ],
    },
  },
  ar: {
    dir: "rtl" as const,
    nav: { login: "تسجيل الدخول", signup: "ابدأ مجاناً" },
    hero: {
      badge: "أمان مصرفي · الخصوصية أولاً",
      headline: "حياتك المالية،",
      headlineAccent: "مشفّرة وملك لك وحدك",
      sub: "Wealthly منصة إدارة الأموال الشخصية الأولى التي تضع خصوصيتك في المقام الأول. تتبّع دخلك ومصروفاتك واستثماراتك وديونك وأهدافك وزكاتك — كل ذلك محميّ بتشفير ٢٥٦-بت وبنية صفرية المعرفة. لا نستطيع رؤية بياناتك، ولا يستطيع أحد غيرك.",
      cta1: "ابدأ مجاناً — بدون بطاقة ائتمانية",
      cta2: "كيف نحميك",
      trustLine: "موثوق به في أكثر من ٣٠ دولة · بياناتك لا تغادر التخزين المشفّر أبداً",
    },
    trustBar: [
      { icon: "Lock", text: "تشفير ٢٥٦-بت" },
      { icon: "ShieldCheck", text: "متوافق مع GDPR" },
      { icon: "Key", text: "صفرية المعرفة" },
      { icon: "Ban", text: "لا نبيع البيانات" },
      { icon: "Eye", text: "شفافية كاملة" },
    ],
    security: {
      badge: "الخصوصية من التصميم",
      title: "بياناتك. قراراتك. دائماً.",
      sub: "بنينا Wealthly على قاعدة واحدة: بياناتك المالية ملك لك وحدك. إليك كيف نضمن استمرار ذلك.",
      pillars: [
        { icon: "Lock", title: "تشفير عسكري المستوى", desc: "كل بايت من بياناتك مشفّر بخوارزمية AES-256 أثناء التخزين، وبروتوكول TLS 1.3 أثناء النقل — نفس التشفير المستخدم في البنوك والحكومات." },
        { icon: "Key", title: "بنية صفرية المعرفة", desc: "كلمة مرورك هي مفتاح بياناتك. حتى مهندسونا لا يستطيعون قراءة أموالك. إن نسيت كلمة مرورك، لا نستطيع استعادتها لك — وهذا هو الهدف." },
        { icon: "Ban", title: "لا نبيع بياناتك أبداً", desc: "لا معلنين. لا وسطاء بيانات. لا أكواد تتبّع تسويقية. Wealthly يحقق دخلاً من الاشتراكات، وليس من عاداتك المالية." },
        { icon: "ServerCog", title: "بنية تحتية آمنة", desc: "مستضاف على خوادم بمستوى المؤسسات الكبرى مع نسخ احتياطية مشفّرة يومية، وحماية من هجمات DDoS، ومراقبة على مدار الساعة. بياناتك في أمان حتى لو فُقد جهازك." },
        { icon: "Fingerprint", title: "مصادقة قوية", desc: "كلمات المرور محميّة بخوارزمية bcrypt (المعيار الصناعي). الجلسات تنتهي صلاحيتها تلقائياً. دعم قريب للمصادقة الثنائية والبصمة." },
        { icon: "Download", title: "تصدير وحذف في أي وقت", desc: "تريد المغادرة؟ صدّر كل بياناتك بصيغة CSV أو JSON. احذف حسابك بضغطة واحدة — كل أثر لبياناتك يُمحى نهائياً." },
      ],
      promise: {
        title: "وعدنا لك بالخصوصية",
        points: [
          "لن نقرأ بياناتك المالية أبداً.",
          "لن نبيع أو نشارك معلوماتك أبداً.",
          "لن نستخدم بياناتك لتدريب نماذج ذكاء اصطناعي.",
          "سنسمح لك دائماً بتصدير أو حذف كل شيء.",
          "سنبلّغك عن أي حادث أمني خلال ٢٤ ساعة.",
        ],
      },
    },
    features: {
      title: "كل ما تحتاجه",
      sub: "١٠ وحدات قوية — كل بايت مشفّر، وكل تحليل خاص بك",
      items: [
        { icon: "LayoutDashboard", title: "لوحة تحكم ذكية", desc: "نظرة شاملة على وضعك المالي. تُحسب محلياً وتُعرض فوراً." },
        { icon: "Wallet", title: "تتبّع الدخل", desc: "سجّل الرواتب والعمل الحر والإيجارات والدخل السلبي — كله مشفّر." },
        { icon: "Receipt", title: "إدارة المصروفات", desc: "صنّف الإنفاق والتزم بميزانيتك دون أي إعلان." },
        { icon: "TrendingUp", title: "محفظة الاستثمارات", desc: "تابع الأسهم والعملات الرقمية والذهب والفضة بأسعار حية وخاصة." },
        { icon: "Building2", title: "إدارة الأصول", desc: "راقب العقارات والمركبات والمقتنيات — أنت وحدك من يرى القيم." },
        { icon: "Landmark", title: "حسابات بنكية متعددة", desc: "اربط حسابات متعددة يدوياً. لا نلمس بيانات دخولك البنكية أبداً." },
        { icon: "HandCoins", title: "تتبّع الديون", desc: "أدِر القروض والرهون والمستحقات مع تذكيرات بمواعيد السداد." },
        { icon: "Target", title: "الأهداف المالية", desc: "حدّد أهداف الادخار وتابع تقدمك لحظة بلحظة." },
        { icon: "PieChart", title: "ميزانية ذكية", desc: "وزّع دخلك تلقائياً على الفئات مع تحليلات شهرية." },
        { icon: "Star", title: "حاسبة الزكاة", desc: "حساب دقيق للزكاة بنصاب الذهب والفضة الحيّ — متوافق مع الشريعة." },
      ],
    },
    howItWorks: {
      title: "ثلاث خطوات لوضوح مالي كامل",
      sub: "الإعداد يستغرق دقيقتين. الخصوصية تبقى للأبد.",
      steps: [
        { number: "٠١", title: "سجّل بأمان", desc: "أنشئ حسابك بتشفير شامل من اللحظة الأولى. لا نطلب حتى اسمك الحقيقي إن لم ترغب." },
        { number: "٠٢", title: "أضف أموالك", desc: "سجّل دخلك ومصروفاتك وحساباتك وأصولك يدوياً. لا حاجة لربط بنكي. لا وصول لأطراف ثالثة." },
        { number: "٠٣", title: "احصل على تحليلات خاصة", desc: "تحليلات الذكاء الاصطناعي تعمل على بياناتك — لا تُشارك، ولا تُخزّن خارجياً. حياتك المالية تبقى لك." },
      ],
    },
    arabicFirst: {
      title: "صُمّم للعربية، لم يُترجم إليها",
      sub: "معظم تطبيقات المالية تعامل العربية على أنها فكرة لاحقة. نحن بنينا Wealthly للعربية من اليوم الأول.",
      features: [
        "تخطيط RTL كامل ومتقن لا ينكسر",
        "مصطلحات مالية عربية معتمدة من متخصصين",
        "دعم التقويم الهجري لتتبّع الزكاة",
        "خط المراعي الأصيل لطباعة عربية جميلة",
        "عملات متعددة: ريال سعودي، درهم إماراتي، دولار، يورو، و٣٠+ عملة",
        "حساسية ثقافية — مبني لاحترام مبادئ التمويل الإسلامي",
      ],
    },
    stats: {
      title: "موثوق به من مستخدمين يهتمون بالخصوصية حول العالم",
      items: [
        { value: "٢٥٦-بت", label: "تشفير AES" },
        { value: "٠", label: "متعقّبات · ٠ إعلانات" },
        { value: "١٠٠٪", label: "بياناتك، لك وحدك" },
        { value: "٣٠+", label: "دولة مخدومة" },
      ],
    },
    testimonials: {
      title: "موثوق به من مستخدمين حول العالم",
      items: [
        { name: "أحمد الراشدي", role: "صاحب أعمال، المملكة العربية السعودية", text: "غيّر Wealthly طريقة إدارتي لأموالي. حاسبة الزكاة وحدها تستحق التجربة. أستطيع الآن تتبع استثماراتي ومصروفاتي بعملات مختلفة دون أي تعقيد.", avatar: "أ" },
        { name: "سارة جونسون", role: "محللة مالية، الإمارات العربية المتحدة", text: "ميزات تخطيط الميزانية وتتبع الأهداف رائعة للغاية. تمكنت من توفير ٣٠٪ أكثر كل شهر. معرفتي أن بياناتي تبقى خاصة يمنحني راحة بال كاملة.", avatar: "س" },
        { name: "محمد الفارسي", role: "رائد أعمال، قطر", text: "أخيراً تطبيق مالي يدعم العربية بشكل حقيقي! تخطيط RTL مثالي والتبديل بين اللغتين سلس. ضمانات الخصوصية تجعله التطبيق الوحيد الذي أثق به بأرقامي الحقيقية.", avatar: "م" },
      ],
    },
    faq: {
      title: "أسئلة الخصوصية، إجابات صريحة",
      items: [
        { q: "أين تُخزَّن بياناتي فعلياً؟", a: "بياناتك المشفّرة مُخزّنة على خوادم بمستوى المؤسسات الكبرى مع نسخ احتياطية يومية. لا نخزّن البيانات في أي دولة ذات قوانين خصوصية ضعيفة." },
        { q: "هل يستطيع موظفو Wealthly رؤية أرصدتي؟", a: "لا. بياناتك مشفّرة بمفتاح مُشتقّ من كلمة مرورك. حتى مديرو قواعد البيانات لدينا يرون فقط بيانات مشفّرة، وليس أرقاماً حقيقية." },
        { q: "ماذا يحدث لبياناتي عند حذف الحساب؟", a: "خلال ٣٠ يوماً، تُحذف جميع بياناتك نهائياً ولا يمكن استرجاعها من أنظمتنا النشطة والنسخ الاحتياطية. لا نحتفظ بأي نسخة." },
        { q: "هل كلمة مروري آمنة فعلاً؟", a: "نعم. كلمات المرور لا تُخزَّن أبداً كنص صريح. نستخدم خوارزمية bcrypt بمعاملات عالية. حتى لو تسرّبت قاعدة بياناتنا، ستحتاج كلمة مرورك قروناً لاختراقها." },
        { q: "هل تستخدمون بياناتي لتدريب نماذج الذكاء الاصطناعي؟", a: "إطلاقاً. لن نستخدم بياناتك المالية لتدريب أي نموذج ذكاء اصطناعي، أبداً. التحليل الذكي يعمل على بياناتك فقط عندما تطلب ذلك صراحةً." },
        { q: "كيف تُحسب الزكاة بشكل خاص؟", a: "حسابات الزكاة تتم بالكامل على بياناتك المشفّرة. نحن لا نعرف ثروتك ولا نصابك ولا مبلغ زكاتك — أنت وحدك تعرف." },
        { q: "هل Wealthly مجاني؟", a: "نعم، الميزات الأساسية مجانية للأبد. نوفّر ميزات احترافية اختيارية للمستخدمين المتقدمين باشتراك مدفوع — وليس عبر بياناتك أبداً." },
      ],
    },
    cta: {
      title: "استعد السيطرة على أموالك — بخصوصية تامة.",
      sub: "انضم إلى الآلاف الذين يرفضون المساومة على خصوصيتهم المالية مقابل تطبيقات مجانية. بياناتك ملكك. دائماً.",
      button: "ابدأ مجاناً للأبد",
      reassurance: "لا بطاقة ائتمان · لا متعقّبات · ألغِ في أي وقت · صدّر كل شيء",
    },
    footer: {
      copy: "© ٢٠٢٦ Wealthly. جميع الحقوق محفوظة.",
      tagline: "مبنيّ بالخصوصية. مصمّم للثقة.",
      columns: [
        { title: "المنتج", links: [{ label: "المميزات", href: "#features" }, { label: "الأمان", href: "#security" }, { label: "الأسعار", href: "#" }, { label: "خارطة الطريق", href: "#" }] },
        { title: "الشركة", links: [{ label: "من نحن", href: "#" }, { label: "المدونة", href: "#" }, { label: "تواصل معنا", href: "#" }] },
        { title: "القانوني", links: [{ label: "سياسة الخصوصية", href: "#" }, { label: "شروط الاستخدام", href: "#" }, { label: "معالجة البيانات", href: "#" }, { label: "الأمان", href: "#security" }] },
      ],
    },
  },
};

type Lang = "en" | "ar";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("landing-lang") as Lang) || "en");
  const [dark, setDark] = useState(() => localStorage.getItem("landing-theme") === "dark");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [securityVisible,    setSecurityVisible]    = useState(false);
  const [featuresVisible,    setFeaturesVisible]    = useState(false);
  const [howVisible,         setHowVisible]         = useState(false);
  const [arabicVisible,      setArabicVisible]      = useState(false);
  const [statsVisible,       setStatsVisible]       = useState(false);
  const [testimonialsVisible,setTestimonialsVisible] = useState(false);
  const [faqVisible,         setFaqVisible]         = useState(false);
  const [ctaVisible,         setCtaVisible]         = useState(false);

  const c = content[lang];

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
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.08 });
      obs.observe(el);
      observers.push(obs);
    };
    observe("security-section",      setSecurityVisible);
    observe("features-section",      setFeaturesVisible);
    observe("how-section",           setHowVisible);
    observe("arabic-section",        setArabicVisible);
    observe("stats-section",         setStatsVisible);
    observe("testimonials-section",  setTestimonialsVisible);
    observe("faq-section",           setFaqVisible);
    observe("cta-section",           setCtaVisible);
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div dir={c.dir} className="min-h-screen bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white transition-colors duration-300">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A1628]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/landing">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <div className="w-8 h-8 bg-[#1B4FE4] rounded-lg flex items-center justify-center shadow-sm shadow-blue-300/30">
                <LineChart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Wealthly</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <button onClick={() => scrollTo("security-section")} className="hover:text-[#1B4FE4] transition-colors">{lang === "ar" ? "الأمان" : "Security"}</button>
            <button onClick={() => scrollTo("features-section")} className="hover:text-[#1B4FE4] transition-colors">{lang === "ar" ? "المميزات" : "Features"}</button>
            <button onClick={() => scrollTo("faq-section")} className="hover:text-[#1B4FE4] transition-colors">{lang === "ar" ? "الأسئلة" : "FAQ"}</button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLang((l) => l === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-[#1E3A5F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0F1729] transition-colors"
              data-testid="button-lang-toggle"
            >
              <Globe className="w-4 h-4" />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-gray-200 dark:border-[#1E3A5F] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0F1729] transition-colors"
              data-testid="button-theme-toggle"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/auth">
              <button className="hidden sm:block text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#1B4FE4] dark:hover:text-blue-400 transition-colors px-3 py-1.5" data-testid="button-nav-login">
                {c.nav.login}
              </button>
            </Link>
            <Link href="/auth">
              <button className="px-4 py-2 bg-[#1B4FE4] hover:bg-[#1640C0] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900/40" data-testid="button-nav-signup">
                {c.nav.signup}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-24 sm:pb-20">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#1B4FE4]/5 dark:bg-[#1B4FE4]/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-6 border border-blue-100 dark:border-blue-900/50">
              <Shield className="w-3.5 h-3.5" />
              {c.hero.badge}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
              {c.hero.headline}{" "}
              <span className="bg-gradient-to-r from-[#1B4FE4] via-blue-500 to-indigo-500 bg-clip-text text-transparent block sm:inline">
                {c.hero.headlineAccent}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              {c.hero.sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/auth">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1B4FE4] hover:bg-[#1640C0] text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:scale-105 active:scale-100 text-base" data-testid="button-hero-cta">
                  {c.hero.cta1} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </Link>
              <button
                onClick={() => scrollTo("security-section")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 dark:border-[#1E3A5F] text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-[#1B4FE4] dark:hover:border-blue-600 hover:text-[#1B4FE4] dark:hover:text-blue-400 transition-all text-base"
                data-testid="button-hero-demo"
              >
                <Lock className="w-4 h-4" />
                {c.hero.cta2}
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00C896]" />
              {c.hero.trustLine}
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/30 dark:shadow-blue-900/30 border border-gray-200 dark:border-[#1E3A5F]">
              <div className="bg-gray-100 dark:bg-[#0F1729] px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-[#1E3A5F]">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <div className="mx-auto flex items-center gap-2 bg-white dark:bg-[#0A1628] px-4 py-1 rounded-md text-xs text-gray-400 border border-gray-200 dark:border-[#1E3A5F]">
                  🔒 fintrack.app/dashboard
                </div>
              </div>
              <div className="flex bg-gray-50 dark:bg-[#0F1729]" style={{ height: "360px" }}>
                <div className="hidden sm:flex w-44 bg-white dark:bg-[#0A1628] border-e border-gray-100 dark:border-[#1E3A5F] flex-col p-4 gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-6 h-6 bg-[#1B4FE4] rounded-md flex items-center justify-center">
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
                    <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${item.active ? "bg-[#1B4FE4] text-white" : "text-gray-400 dark:text-gray-500"}`}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{lang === "ar" ? "صباح الخير" : "Good morning"}</p>
                      <p className="text-sm font-bold dark:text-white">Mohammed Fouad</p>
                    </div>
                    <div className="text-xs text-gray-400 bg-white dark:bg-[#0A1628] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#1E3A5F]">March 2026</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: lang === "ar" ? "إجمالي الدخل" : "Total Income", value: "$11,299", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/50" },
                      { label: lang === "ar" ? "المصروفات" : "Expenses", value: "$4,820", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/50" },
                      { label: lang === "ar" ? "صافي المدخرات" : "Net Savings", value: "$6,479", color: "text-[#1B4FE4]", bg: "bg-blue-50 dark:bg-blue-950/50" },
                    ].map((card) => (
                      <div key={card.label} className={`${card.bg} rounded-xl p-3 border border-gray-100 dark:border-[#1E3A5F]`}>
                        <p className="text-[9px] font-medium text-gray-400 mb-1.5">{card.label}</p>
                        <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-[#0A1628] rounded-xl p-4 border border-gray-100 dark:border-[#1E3A5F] mb-3">
                    <p className="text-[10px] text-gray-400 mb-3">{lang === "ar" ? "النظرة الشهرية" : "Monthly Overview"}</p>
                    <div className="flex items-end gap-2 h-16">
                      {[{ inc: 70, exp: 40 }, { inc: 85, exp: 55 }, { inc: 60, exp: 35 }, { inc: 90, exp: 60 }, { inc: 75, exp: 45 }, { inc: 100, exp: 65 }].map((bar, i) => (
                        <div key={i} className="flex-1 flex items-end gap-0.5">
                          <div className="flex-1 bg-[#1B4FE4] rounded-t opacity-80" style={{ height: `${bar.inc}%` }} />
                          <div className="flex-1 bg-red-400 rounded-t opacity-70" style={{ height: `${bar.exp}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-[#0A1628] border border-gray-100 dark:border-[#1E3A5F] rounded-xl p-3">
                      <p className="text-[9px] text-gray-400 mb-2">{lang === "ar" ? "هدف السيارة" : "Car Goal"}</p>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                        <div className="h-1.5 bg-[#1B4FE4] rounded-full" style={{ width: "67%" }} />
                      </div>
                      <p className="text-[9px] text-gray-400">$6,700 / $10,000</p>
                    </div>
                    <div className="bg-white dark:bg-[#0A1628] border border-gray-100 dark:border-[#1E3A5F] rounded-xl p-3">
                      <p className="text-[9px] text-gray-400 mb-2">{lang === "ar" ? "الميزانية المستخدمة" : "Budget Used"}</p>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                        <div className="h-1.5 bg-[#00C896] rounded-full" style={{ width: "48%" }} />
                      </div>
                      <p className="text-[9px] text-gray-400">48% {lang === "ar" ? "من الشهري" : "of monthly"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="border-y border-gray-100 dark:border-[#1E3A5F] bg-[#F8FAFF] dark:bg-[#0F1729] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {c.trustBar.map((item, i) => {
              const Icon = iconMap[item.icon];
              return (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/30">
                  {Icon && <Icon className="w-4 h-4 text-[#1B4FE4] dark:text-blue-400" />}
                  <span className="text-sm font-semibold text-[#1B4FE4] dark:text-blue-300 whitespace-nowrap">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECURITY SECTION ── */}
      <section id="security-section" className="py-20 sm:py-28 bg-white dark:bg-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${securityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#1B4FE4]/10 to-[#00C896]/10 dark:from-blue-950/60 dark:to-green-950/30 text-[#1B4FE4] dark:text-blue-400 rounded-full text-sm font-semibold mb-5 border border-blue-200/50 dark:border-blue-800/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {c.security.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 text-gray-900 dark:text-white">{c.security.title}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">{c.security.sub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {c.security.pillars.map((pillar, i) => {
              const Icon = iconMap[pillar.icon];
              return (
                <div
                  key={i}
                  className={`group relative p-6 rounded-2xl bg-white dark:bg-[#0F1729] border border-gray-100 dark:border-[#1E3A5F] hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-950/30 transition-all duration-300 ${securityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: securityVisible ? `${i * 80}ms` : "0ms" }}
                  data-testid={`card-security-${i}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B4FE4] to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">{pillar.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Privacy Promise */}
          <div className={`rounded-2xl bg-gradient-to-br from-[#F8FAFF] to-blue-50/50 dark:from-[#0F1729] dark:to-blue-950/20 border border-blue-100 dark:border-[#1E3A5F] p-8 sm:p-10 transition-all duration-700 delay-300 ${securityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C896] to-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{c.security.promise.title}</h3>
            </div>
            <ul className="space-y-3">
              {c.security.promise.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00C896] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features-section" className="py-20 sm:py-28 bg-[#F8FAFF] dark:bg-[#0F1729]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">{c.features.title}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{c.features.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {c.features.items.map((feature, i) => {
              const Icon = iconMap[feature.icon];
              return (
                <div
                  key={i}
                  className={`group bg-white dark:bg-[#0A1628] rounded-2xl p-6 border border-gray-100 dark:border-[#1E3A5F] hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-950/30 transition-all duration-500 cursor-default ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: featuresVisible ? `${i * 60}ms` : "0ms" }}
                  data-testid={`card-feature-${i}`}
                >
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors group-hover:scale-110 duration-300">
                    {Icon && <Icon className="w-5 h-5 text-[#1B4FE4] dark:text-blue-400" />}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm leading-snug">{feature.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-section" className="py-20 sm:py-28 bg-white dark:bg-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">{c.howItWorks.title}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">{c.howItWorks.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 start-1/3 end-1/3 h-px bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-800 to-transparent" />
            {c.howItWorks.steps.map((step, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-700 ${howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: howVisible ? `${i * 120}ms` : "0ms" }}
                data-testid={`card-how-${i}`}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1B4FE4] to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                  <span className="text-2xl font-black text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARABIC FIRST ── */}
      <section id="arabic-section" className="py-20 sm:py-28 bg-gradient-to-br from-[#1B4FE4] via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 end-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 start-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${arabicVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-white rounded-full text-sm font-semibold mb-6 border border-white/20">
                <Star className="w-3.5 h-3.5 fill-current" />
                {lang === "ar" ? "عربي أولاً" : "Arabic First"}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">{c.arabicFirst.title}</h2>
              <p className="text-blue-100 text-lg leading-relaxed mb-8">{c.arabicFirst.sub}</p>
              <Link href="/auth">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1B4FE4] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                  {lang === "ar" ? "جرّبه الآن" : "Try It Now"} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {c.arabicFirst.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/15 hover:bg-white/15 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-[#00C896] flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm font-medium leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats-section" className={`py-20 sm:py-28 bg-[#0F1729] transition-all duration-700 ${statsVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-16">{c.stats.title}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {c.stats.items.map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-item-${i}`}>
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-sm bg-gradient-to-r from-blue-400 to-[#00C896] bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-400 font-semibold text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials-section" className="py-20 sm:py-28 bg-white dark:bg-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{c.testimonials.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.testimonials.items.map((item, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl bg-[#F8FAFF] dark:bg-[#0F1729] border border-gray-100 dark:border-[#1E3A5F] hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-950/20 transition-all duration-300 ${testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: testimonialsVisible ? `${i * 100}ms` : "0ms" }}
                data-testid={`card-testimonial-${i}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 text-amber-400 fill-current" />)}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4FE4] to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq-section" className="py-20 sm:py-28 bg-[#F8FAFF] dark:bg-[#0F1729]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-700 ${faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{c.faq.title}</h2>
          </div>
          <div className={`space-y-3 transition-all duration-700 delay-150 ${faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {c.faq.items.map((item, i) => (
              <div key={i} className="border border-gray-200 dark:border-[#1E3A5F] rounded-2xl overflow-hidden bg-white dark:bg-[#0A1628]" data-testid={`faq-item-${i}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-[#0F1729] transition-colors text-start"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="font-semibold text-sm text-gray-900 dark:text-white text-start">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-[#1E3A5F] pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="cta-section" className="py-24 sm:py-32 bg-gradient-to-br from-[#1B4FE4] via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative transition-all duration-700 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">{c.cta.title}</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">{c.cta.sub}</p>
          <Link href="/auth">
            <button className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#1B4FE4] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:scale-105 active:scale-100 text-lg mb-5" data-testid="button-cta-final">
              {c.cta.button} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </Link>
          <p className="text-blue-200 text-sm">{c.cta.reassurance}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0A1628] border-t border-[#1E3A5F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#1B4FE4] rounded-lg flex items-center justify-center">
                  <LineChart className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Wealthly</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{c.footer.tagline}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#00C896]">
                <Lock className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "مشفّر دائماً" : "Always Encrypted"}</span>
              </div>
            </div>
            {c.footer.columns.map((col, i) => (
              <div key={i}>
                <h4 className="text-sm font-bold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-[#1E3A5F] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">{c.footer.copy}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00C896]" />
              <span>{lang === "ar" ? "الخصوصية أولاً" : "Privacy First"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

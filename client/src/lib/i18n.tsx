import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    income: "Income",
    expenses: "Expenses",
    investments: "Investments",
    bankSavings: "Bank Savings",
    settings: "Settings",
    logout: "Logout",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    arabic: "العربية",
    english: "English",
    addIncome: "Add Income",
    addExpense: "Add Expense",
    addInvestment: "Add Investment",
    addSavings: "Add Savings",
    addCategory: "Add Category",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    remaining: "Remaining",
    thisMonth: "This Month",
    monthlyAverage: "Monthly Average",
    save: "Save",
    delete: "Delete",
    description: "Description",
    amount: "Amount",
    category: "Category",
    date: "Date",
    bankName: "Bank Name",
    type: "Type",
    actions: "Actions",
    month: "Month",
    year: "Year",
    budgetAllocation: "Budget Allocation",
    currency: "Currency",
    language: "Language",
    theme: "Theme",
    manageCategories: "Manage categories and budget allocations.",
    trackIncome: "Track and manage your income sources.",
    trackExpenses: "Track spending vs budget per category.",
    trackInvestments: "Track Gold, Stocks and Crypto investments.",
    trackSavings: "Track monthly savings by bank.",
    netIncome: "Net Income",
    monthlyIncome: "Monthly Income",
    incomeEntries: "Income Entries",
    expenseEntries: "Expense Entries",
    investmentEntries: "Investment Entries",
    savingsEntries: "Savings Entries",
    noCategoryBudgets: "No budget allocations set. Go to Settings to configure category budgets.",
    noEntries: "No entries recorded.",
    gold: "Gold",
    stocks: "Stocks",
    cryptocurrencies: "Cryptocurrencies",
    totalInvested: "Total Invested",
    ofIncome: "of income",
    allTimeSavings: "All-Time Savings",
    budgetVsActual: "Budget vs Actual",
    overBudgetBy: "Over budget by",
    monthlyOverview: "Monthly Income Overview",
    expenseCategoriesBudget: "Expense Categories & Budget Allocation",
    incomeCategories: "Income Categories",
    system: "System",
    custom: "Custom",
    color: "Color",
    name: "Name",
    savingsByBank: "Savings by Bank",
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    country: "Country",
  },
  ar: {
    dashboard: "لوحة التحكم",
    income: "الدخل",
    expenses: "المصروفات",
    investments: "الاستثمارات",
    bankSavings: "التوفير البنكي",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    arabic: "العربية",
    english: "English",
    addIncome: "إضافة دخل",
    addExpense: "إضافة مصروف",
    addInvestment: "إضافة استثمار",
    addSavings: "إضافة توفير",
    addCategory: "إضافة فئة",
    totalIncome: "إجمالي الدخل",
    totalExpenses: "إجمالي المصروفات",
    remaining: "المتبقي",
    thisMonth: "هذا الشهر",
    monthlyAverage: "المتوسط الشهري",
    save: "حفظ",
    delete: "حذف",
    description: "الوصف",
    amount: "المبلغ",
    category: "الفئة",
    date: "التاريخ",
    bankName: "اسم البنك",
    type: "النوع",
    actions: "الإجراءات",
    month: "الشهر",
    year: "السنة",
    budgetAllocation: "توزيع الميزانية",
    currency: "العملة",
    language: "اللغة",
    theme: "المظهر",
    manageCategories: "إدارة الفئات وتوزيع الميزانية.",
    trackIncome: "تتبع وإدارة مصادر الدخل.",
    trackExpenses: "تتبع الإنفاق مقابل الميزانية لكل فئة.",
    trackInvestments: "تتبع استثمارات الذهب والأسهم والعملات الرقمية.",
    trackSavings: "تتبع التوفير الشهري حسب البنك.",
    netIncome: "صافي الدخل",
    monthlyIncome: "الدخل الشهري",
    incomeEntries: "سجل الدخل",
    expenseEntries: "سجل المصروفات",
    investmentEntries: "سجل الاستثمارات",
    savingsEntries: "سجل التوفير",
    noCategoryBudgets: "لا توجد ميزانيات محددة. اذهب إلى الإعدادات لتكوين ميزانيات الفئات.",
    noEntries: "لا توجد سجلات.",
    gold: "الذهب",
    stocks: "الأسهم",
    cryptocurrencies: "العملات الرقمية",
    totalInvested: "إجمالي الاستثمار",
    ofIncome: "من الدخل",
    allTimeSavings: "إجمالي التوفير",
    budgetVsActual: "الميزانية مقابل الفعلي",
    overBudgetBy: "تجاوز الميزانية بمقدار",
    monthlyOverview: "نظرة عامة على الدخل الشهري",
    expenseCategoriesBudget: "فئات المصروفات وتوزيع الميزانية",
    incomeCategories: "فئات الدخل",
    system: "نظام",
    custom: "مخصص",
    color: "اللون",
    name: "الاسم",
    savingsByBank: "التوفير حسب البنك",
    welcomeBack: "مرحباً بعودتك",
    createAccount: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "رقم الهاتف",
    country: "البلد",
  }
};

interface I18nContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  isRtl: false,
});

export function I18nProvider({ children, initialLang = "en" }: { children: ReactNode; initialLang?: string }) {
  const [lang, setLang] = useState(initialLang);
  const isRtl = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import IncomePage from "@/pages/income";
import ExpensesPage from "@/pages/expenses";
import InvestmentsPage from "@/pages/investments";
import AssetsPage from "@/pages/assets";
import BankAccountsPage from "@/pages/bank-accounts";
import DebtsPage from "@/pages/debts";
import GoalsPage from "@/pages/goals";
import BudgetPage from "@/pages/budget";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import ZakatPage from "@/pages/zakat";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import { Loader2 } from "lucide-react";

function ProtectedPage({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard">{() => <ProtectedPage component={Dashboard} />}</Route>
      <Route path="/income">{() => <ProtectedPage component={IncomePage} />}</Route>
      <Route path="/expenses">{() => <ProtectedPage component={ExpensesPage} />}</Route>
      <Route path="/investments">{() => <ProtectedPage component={InvestmentsPage} />}</Route>
      <Route path="/assets">{() => <ProtectedPage component={AssetsPage} />}</Route>
      <Route path="/bank-accounts">{() => <ProtectedPage component={BankAccountsPage} />}</Route>
      <Route path="/debts">{() => <ProtectedPage component={DebtsPage} />}</Route>
      <Route path="/goals">{() => <ProtectedPage component={GoalsPage} />}</Route>
      <Route path="/budget">{() => <ProtectedPage component={BudgetPage} />}</Route>
      <Route path="/reports">{() => <ProtectedPage component={ReportsPage} />}</Route>
      <Route path="/settings">{() => <ProtectedPage component={SettingsPage} />}</Route>
      <Route path="/zakat">{() => <ProtectedPage component={ZakatPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <ThemeProvider initialTheme={(user as any)?.theme || "light"}>
      <I18nProvider initialLang={(user as any)?.language || "en"}>
        <CurrencyProvider initialCurrency={(user as any)?.currency || "USD"}>
          {children}
        </CurrencyProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProviders>
          <Router />
          <Toaster />
        </AppProviders>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

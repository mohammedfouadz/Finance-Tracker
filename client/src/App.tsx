import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TransactionsPage from "@/pages/transactions";
import GoalsPage from "@/pages/goals";
import BudgetPage from "@/pages/budget";
import ReportsPage from "@/pages/reports";
import AICoachPage from "@/pages/ai-coach";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  return (
    <Switch>
      <Route path="/" component={user ? Dashboard : LandingPage} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/transactions">
        {() => <PrivateRoute component={TransactionsPage} />}
      </Route>
      <Route path="/goals">
        {() => <PrivateRoute component={GoalsPage} />}
      </Route>
      <Route path="/budget">
        {() => <PrivateRoute component={BudgetPage} />}
      </Route>
      <Route path="/reports">
        {() => <PrivateRoute component={ReportsPage} />}
      </Route>
      <Route path="/ai-coach">
        {() => <PrivateRoute component={AICoachPage} />}
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

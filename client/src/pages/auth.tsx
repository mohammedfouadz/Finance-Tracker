import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { LineChart, Eye, EyeOff } from "lucide-react";

const COUNTRIES = [
  "Saudi Arabia", "United Arab Emirates", "United States", "United Kingdom",
  "Egypt", "Jordan", "Kuwait", "Bahrain", "Qatar", "Oman", "Iraq",
  "Lebanon", "Morocco", "Tunisia", "Algeria", "Libya", "Sudan",
  "India", "Pakistan", "Bangladesh", "Turkey", "Germany", "France",
  "Canada", "Australia", "Japan", "South Korea", "China", "Brazil",
  "Mexico", "South Africa", "Nigeria", "Kenya", "Other"
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        toast({ title: data.message || "Login failed", variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/dashboard");
    } catch {
      toast({ title: "Login failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.phone || !signupForm.country || !signupForm.password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
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
        toast({ title: data.message || "Signup failed", variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/dashboard");
    } catch {
      toast({ title: "Signup failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <LineChart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">FinTrack</h1>
        </div>

        <Card className="border-none shadow-xl rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to manage your finances" : "Start tracking your finances today"}
            </p>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Email</label>
                  <Input
                    data-testid="input-login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Password</label>
                  <div className="relative">
                    <Input
                      data-testid="input-login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isSubmitting} data-testid="button-login">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">First Name</label>
                    <Input
                      data-testid="input-first-name"
                      placeholder="Mohammed"
                      value={signupForm.firstName}
                      onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Last Name</label>
                    <Input
                      data-testid="input-last-name"
                      placeholder="Fouad"
                      value={signupForm.lastName}
                      onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Email</label>
                  <Input
                    data-testid="input-signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Phone Number</label>
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    placeholder="+966 5XX XXX XXXX"
                    value={signupForm.phone}
                    onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Country</label>
                  <Select value={signupForm.country} onValueChange={v => setSignupForm({ ...signupForm, country: v })}>
                    <SelectTrigger data-testid="select-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Password</label>
                  <div className="relative">
                    <Input
                      data-testid="input-signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Confirm Password</label>
                  <Input
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Repeat your password"
                    value={signupForm.confirmPassword}
                    onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isSubmitting} data-testid="button-signup">
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button className="text-primary font-semibold hover:underline" onClick={() => setMode("signup")} data-testid="link-signup">
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button className="text-primary font-semibold hover:underline" onClick={() => setMode("login")} data-testid="link-login">
                    Sign In
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

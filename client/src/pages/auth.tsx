import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

const COUNTRIES = [
  "Saudi Arabia", "United Arab Emirates", "United States", "United Kingdom",
  "Egypt", "Jordan", "Kuwait", "Bahrain", "Qatar", "Oman", "Iraq",
  "Lebanon", "Morocco", "Tunisia", "Algeria", "Libya", "Sudan",
  "India", "Pakistan", "Bangladesh", "Turkey", "Germany", "France",
  "Canada", "Australia", "Japan", "South Korea", "China", "Brazil",
  "Mexico", "South Africa", "Nigeria", "Kenya", "Other"
];

function WealthlyLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1B4FE4" />
      <path
        d="M6 11L13 29L20 16L27 29L34 11"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 29L20 16L27 29"
        stroke="#00C896"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)" }}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 -z-10" style={{ background: "radial-gradient(circle, #4F8EF7 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 -z-10" style={{ background: "radial-gradient(circle, #00C896 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <WealthlyLogo size={44} />
          <div>
            <h1 className="text-3xl font-bold text-[#1B4FE4] tracking-tight leading-none">Wealthly</h1>
            <p className="text-[#64748B] text-xs mt-0.5">Your financial command center</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm" style={{ boxShadow: "0 20px 60px rgba(27, 79, 228, 0.12)" }}>
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl text-[#0F1729]">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-sm text-[#64748B] mt-1">
              {mode === "login" ? "Sign in to manage your finances" : "Start tracking your finances today"}
            </p>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Email</label>
                  <Input
                    data-testid="input-login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8] focus-visible:border-[#1B4FE4]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      data-testid="input-login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8] focus-visible:border-[#1B4FE4]"
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#64748B]" onClick={() => setShowPassword(!showPassword)}>
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
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">First Name</label>
                    <Input
                      data-testid="input-first-name"
                      placeholder="Mohammed"
                      value={signupForm.firstName}
                      onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Last Name</label>
                    <Input
                      data-testid="input-last-name"
                      placeholder="Fouad"
                      value={signupForm.lastName}
                      onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Email</label>
                  <Input
                    data-testid="input-signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Phone Number</label>
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    placeholder="+966 5XX XXX XXXX"
                    value={signupForm.phone}
                    onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                    className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Country</label>
                  <Select value={signupForm.country} onValueChange={v => setSignupForm({ ...signupForm, country: v })}>
                    <SelectTrigger data-testid="select-country" className="border-[#CBD5E1]"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      data-testid="input-signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="border-[#CBD5E1] placeholder:text-[#94A3B8]"
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-[#94A3B8]" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1729] mb-1.5 block">Confirm Password</label>
                  <Input
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Repeat your password"
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
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-[#64748B]">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button className="text-[#1B4FE4] font-semibold hover:text-[#1640C0] hover:underline transition-colors" onClick={() => setMode("signup")} data-testid="link-signup">
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button className="text-[#1B4FE4] font-semibold hover:text-[#1640C0] hover:underline transition-colors" onClick={() => setMode("login")} data-testid="link-login">
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

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, PieChart, Shield, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">FinTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </a>
            <a href="/api/login">
              <Button className="font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">New: AI Financial Coach Available</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Master Your Money <br /> With Confidence
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
            Track expenses, set smart budgets, and crush your financial goals with our AI-powered personal finance dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-200">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all">
                Start for Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-background/50 backdrop-blur-sm hover:bg-secondary/50">
              View Demo
            </Button>
          </div>

          {/* Hero Image Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border bg-card/50 backdrop-blur-sm p-2 shadow-2xl animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-secondary to-background overflow-hidden relative">
               {/* Decorative UI Mockup (CSS only for speed) */}
               <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 font-bold text-9xl select-none">
                 UI PREVIEW
               </div>
               <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: PieChart,
                title: "Smart Analytics",
                desc: "Visualize your spending habits with beautiful charts and actionable insights."
              },
              {
                icon: Shield,
                title: "Bank-Grade Security",
                desc: "Your financial data is encrypted and secure. We never sell your personal information."
              },
              {
                icon: Smartphone,
                title: "AI Assistant",
                desc: "Chat with your personal finance coach to get advice and answer questions 24/7."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

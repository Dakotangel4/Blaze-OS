import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Zap, BarChart3, Database } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden flex flex-col selection:bg-primary/30">
      <header className="px-6 md:px-12 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">BlazeOS</span>
        </div>
        <Link href="/sign-in">
          <Button variant="ghost" className="text-white hover:text-primary hover:bg-white/5">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center mt-[-4rem]">
        {/* Abstract dark glowing background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none opacity-30" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8 backdrop-blur-sm text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Institutional-Grade Command Center
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-4xl mx-auto leading-[1.1] mb-6">
          The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Elite Traders</span>.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          BlazeOS unifies your trade journal, risk management, CRM, and financial analytics into a single, high-performance terminal. Stop switching tabs. Start dominating.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-in">
            <Button size="lg" className="h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Initialize Terminal
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 max-w-5xl mx-auto text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-medium">Strict Risk Calc</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <span className="font-medium">Sub-ms Fast</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="font-medium">Deep Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <span className="font-medium">Unified CRM</span>
          </div>
        </div>
      </main>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
}

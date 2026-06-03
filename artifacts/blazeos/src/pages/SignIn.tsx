import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-[#0f0f12] rounded-xl border border-[#232328] overflow-hidden shadow-2xl">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <Flame className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl tracking-tight text-foreground">BlazeOS</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-1">Access System</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {error && (
                <div className="bg-destructive/20 border border-destructive rounded-md px-3 py-2 text-sm text-destructive-foreground">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </div>

          <div className="px-8 py-4 bg-white/[0.02] border-t border-[#232328] text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/sign-up" className="text-primary hover:text-primary/90 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

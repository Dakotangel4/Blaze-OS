import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="relative z-10 w-full max-w-[440px]">
          <div className="bg-[#0f0f12] rounded-xl border border-[#232328] overflow-hidden shadow-2xl p-8 text-center">
            <Flame className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.
            </p>
            <Link href="/sign-in" className="mt-6 inline-block text-primary hover:text-primary/90 text-sm font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
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
            <h1 className="text-2xl font-bold text-foreground text-center mb-1">Initialize System</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">Create a new authorization profile</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
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
                  autoComplete="new-password"
                  minLength={6}
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
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </div>

          <div className="px-8 py-4 bg-white/[0.02] border-t border-[#232328] text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/sign-in" className="text-primary hover:text-primary/90 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

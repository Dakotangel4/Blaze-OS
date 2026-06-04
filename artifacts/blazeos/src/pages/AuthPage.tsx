import { useEffect } from "react";

export interface AuthPageProps {
  initialView?: "sign-in" | "sign-up" | "forgot-password";
}

export default function AuthPage(_props: AuthPageProps) {
  useEffect(() => {
    window.location.href = "/api/login";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
          Redirecting to login…
        </p>
      </div>
    </div>
  );
}

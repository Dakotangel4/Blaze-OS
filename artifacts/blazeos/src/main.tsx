import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase, supabaseConfigured } from "./utils/supabase/client";

if (supabaseConfigured) {
  setAuthTokenGetter(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  });
}

createRoot(document.getElementById("root")!).render(<App />);

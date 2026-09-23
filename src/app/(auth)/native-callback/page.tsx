"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/integrations/supabase/client";

export default function NativeCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing Google sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      const supabase = createBrowserClient({ flowType: "implicit" });
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          if (!cancelled) setMessage(`Could not finish sign-in: ${error.message}`);
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setMessage("Google sign-in did not return a session. Try again.");
          return;
        }
      }

      if (!cancelled) router.replace("/");
    }

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 text-center text-sm text-zinc-400">
      {message}
    </main>
  );
}

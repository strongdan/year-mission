"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/integrations/supabase/client";

function clearCallbackFragment() {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, document.title, cleanUrl);
}

export default function NativeCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createBrowserClient({ flowType: "implicit" });
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      clearCallbackFragment();

      const result = accessToken && refreshToken
        ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : await supabase.auth.getSession();

      if (cancelled) return;

      if (result.error || !result.data.session) {
        setMessage(result.error?.message ?? "Sign-in did not produce a valid session. Try again.");
        return;
      }

      router.replace("/");
    }

    void establishSession().catch(() => {
      if (!cancelled) setMessage("Sign-in could not be completed. Try again.");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <p className="max-w-sm text-center text-sm text-zinc-400">{message}</p>
    </main>
  );
}

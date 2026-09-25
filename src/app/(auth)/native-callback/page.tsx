"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/integrations/supabase/client";

function clearCallbackFragment() {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, document.title, cleanUrl);
}

export function isNativeShellHandoff(value: string | null): boolean {
  return value === "native-shell";
}

export default function NativeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createBrowserClient({ flowType: "implicit" });
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const nativeShell = isNativeShellHandoff(searchParams.get("handoff"));
      clearCallbackFragment();

      const result = accessToken && refreshToken
        ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : await supabase.auth.getSession();

      if (cancelled) return;

      if (result.error || !result.data.session) {
        setMessage(result.error?.message ?? "Sign-in did not produce a valid session. Try again.");
        return;
      }

      // The corrected native flow intercepts the HTTPS callback in
      // ASWebAuthenticationSession, dismisses the auth browser, then loads this
      // same callback URL with ?handoff=native-shell inside the app's primary
      // full-screen web container. Only that full-screen handoff is intended to
      // become the normal application surface.
      if (nativeShell) {
        router.replace("/");
        return;
      }

      // Backward-compatible fallback for older native builds and normal web
      // recovery. The full-screen fix is delivered by the native callback
      // matcher; retaining this path avoids locking out an older installed app
      // before its binary is replaced.
      router.replace("/");
    }

    void establishSession().catch(() => {
      if (!cancelled) setMessage("Sign-in could not be completed. Try again.");
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <p className="max-w-sm text-center text-sm text-zinc-400">{message}</p>
    </main>
  );
}

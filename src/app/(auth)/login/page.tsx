"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createBrowserClient } from "@/integrations/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";

export function getAuthErrorMessage(error: string | null, message: string | null) {
  if (!error) return null;
  if (message) return message;
  if (error === "callback") return "Sign-in could not be completed. Try again.";
  return "Sign-in failed. Try again.";
}

type RecoveryProvider = Extract<Provider, "google" | "apple">;

function LoginContent() {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<RecoveryProvider | null>(null);
  const [message, setMessage] = useState<string | null>(
    getAuthErrorMessage(searchParams.get("error"), searchParams.get("message"))
  );

  if (!hasSupabaseConfig) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-2xl font-semibold">Year Mission</h1>
        <p className="max-w-sm text-center text-sm text-zinc-400">
          Supabase is not configured yet. Add <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">.env.local</code> to enable sign-in.
        </p>
      </main>
    );
  }

  async function signInWithProvider(provider: RecoveryProvider) {
    setLoadingProvider(provider);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${provider === "apple" ? "&recovery=apple" : ""}`,
        },
      });
      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in could not be started. Try again.");
    } finally {
      setLoadingProvider(null);
    }
  }

  const legacyAppleRecovery = searchParams.get("recovery") === "apple";
  const loading = loadingProvider !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Year Mission</h1>
        <p className="mt-1 text-sm text-zinc-400">A personal execution system.</p>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void signInWithProvider("google")}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loadingProvider === "google" ? "Signing in..." : "Continue with Google"}
          </button>
        </div>

        {legacyAppleRecovery && (
          <div className="mt-6 rounded-xl border border-amber-900/50 bg-amber-950/10 p-3">
            <p className="text-xs leading-relaxed text-amber-200/80">
              Legacy account recovery only. This path is temporary while the Google identity is verified.
            </p>
            <button
              type="button"
              onClick={() => void signInWithProvider("apple")}
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-amber-800/60 px-3 py-2 text-xs font-medium text-amber-100 disabled:opacity-50"
            >
              {loadingProvider === "apple" ? "Signing in..." : "Recover with Apple"}
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

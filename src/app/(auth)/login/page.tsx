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

type LoginProvider = Extract<Provider, "google" | "apple">;

function LoginContent() {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<LoginProvider | null>(null);
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

  async function signInWithProvider(provider: LoginProvider) {
    setLoadingProvider(provider);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in could not be started. Try again.");
    } finally {
      setLoadingProvider(null);
    }
  }

  const loading = loadingProvider !== null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Year Mission</h1>
        <p className="mt-1 text-sm text-zinc-400">A personal execution system.</p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void signInWithProvider("apple")}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {loadingProvider === "apple" ? "Signing in..." : "Continue with Apple"}
          </button>

          <button
            type="button"
            onClick={() => void signInWithProvider("google")}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loadingProvider === "google" ? "Signing in..." : "Continue with Google"}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">
          Apple may let you hide your email address. Year Mission only receives the account information Apple shares through sign-in.
        </p>

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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/integrations/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Year Mission</h1>
        <p className="mt-1 text-sm text-zinc-400">A personal execution system.</p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-8 w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
          <span className="h-px flex-1 bg-zinc-800" />
          or
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={signInWithPassword} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
      </div>
    </main>
  );
}
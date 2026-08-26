import { RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <WifiOff className="mx-auto h-9 w-9 text-zinc-500" />
        <h1 className="mt-4 text-xl font-semibold">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Year Mission will use previously opened screens when they are cached. Changes and syncs wait until you reconnect.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900">
            <RefreshCw className="h-4 w-4" /> Try cached Today
          </Link>
          <Link href="/tasks" className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300">
            Try cached Tasks
          </Link>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">Nothing is treated as completed or synced while offline unless the app explicitly confirms it.</p>
      </div>
    </div>
  );
}

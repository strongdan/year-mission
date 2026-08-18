import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-zinc-100">
      <WifiOff className="h-10 w-10 text-zinc-500" />
      <div>
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Reconnect to keep tracking your year. Your saved work is safe.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
      >
        Try again
      </Link>
    </div>
  );
}
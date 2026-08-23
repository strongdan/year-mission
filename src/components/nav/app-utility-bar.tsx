"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";

export function AppUtilityBar() {
  const pathname = usePathname();
  const inSettings = pathname.startsWith("/settings");

  return (
    <div className="mx-auto flex w-full max-w-md justify-end px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <Link
        href={inSettings ? "/" : "/settings"}
        aria-label={inSettings ? "Back to Today" : "Settings"}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
      >
        {inSettings ? <ArrowLeft className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
        {inSettings ? "Today" : "Settings"}
      </Link>
    </div>
  );
}

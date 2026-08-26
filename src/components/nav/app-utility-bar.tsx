"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Lightbulb, Settings2 } from "lucide-react";

const linkClass = "inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100";

export function AppUtilityBar() {
  const pathname = usePathname();
  const inSettings = pathname.startsWith("/settings");
  const inIdeas = pathname.startsWith("/ideas");

  return (
    <div className="mx-auto flex w-full max-w-md justify-end gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <Link
        href={inIdeas ? "/" : "/ideas"}
        aria-label={inIdeas ? "Back to Today" : "Brain dump"}
        className={linkClass}
      >
        {inIdeas ? <ArrowLeft className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
        {inIdeas ? "Today" : "Dump"}
      </Link>
      <Link
        href={inSettings ? "/" : "/settings"}
        aria-label={inSettings ? "Back to Today" : "Settings"}
        className={linkClass}
      >
        {inSettings ? <ArrowLeft className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
        {inSettings ? "Today" : "Settings"}
      </Link>
    </div>
  );
}

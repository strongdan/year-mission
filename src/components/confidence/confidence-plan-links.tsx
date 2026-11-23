import Link from "next/link";

export function ConfidencePlanLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/confidence#recover"
        className="inline-flex min-h-11 items-center rounded-xl border border-violet-900/60 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-violet-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        Recover from a mistake
      </Link>
      <Link
        href="/confidence#roadmap"
        className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        Full one-year plan
      </Link>
    </div>
  );
}

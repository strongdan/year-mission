"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div role="status" className="bg-amber-950/80 px-4 py-1.5 text-center text-xs text-amber-200">
      Offline · cached screens stay readable; reconnect before making changes.
    </div>
  );
}

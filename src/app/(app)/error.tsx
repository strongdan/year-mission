"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className="flex min-h-[65dvh] items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
        {online ? <RefreshCw className="mx-auto h-8 w-8 text-zinc-500" /> : <WifiOff className="mx-auto h-8 w-8 text-zinc-500" />}
        <h1 className="mt-3 text-lg font-semibold text-zinc-100">{online ? "This screen hit a problem" : "Connection dropped"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {online
            ? "Your saved data is unchanged. Try loading this screen again."
            : "Previously opened screens can still be available from cache. Reconnect before making changes."}
        </p>
        <Button className="mt-4" onClick={reset}><RefreshCw className="h-4 w-4" /> Try again</Button>
      </div>
    </div>
  );
}

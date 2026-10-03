"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/app/actions";
import { MissionGrowth } from "./mission-growth";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type BigFour = NonNullable<Awaited<ReturnType<typeof getDashboardAction>>["data"]>["bigFour"];

export function ProgressGrowthPanel() {
  const [bigFour, setBigFour] = useState<BigFour | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardAction(localToday(), Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC").then((result) => {
      if (!cancelled && result.ok && result.data) setBigFour(result.data.bigFour);
    });
    return () => { cancelled = true; };
  }, []);

  if (!bigFour) return null;
  return <div className="px-4 pb-4"><MissionGrowth bigFour={bigFour} /></div>;
}

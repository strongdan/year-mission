"use client";

import { useEffect } from "react";
import { getDashboardAction } from "@/app/actions";
import { normalizeSeasonThemeKey } from "@/domain/season-theme";

export function SeasonAmbience() {
  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((result) => {
      if (cancelled || !result.ok || !result.data) return;
      document.documentElement.dataset.season = normalizeSeasonThemeKey(result.data.season?.name);
    });
    return () => { cancelled = true; };
  }, []);
  return null;
}

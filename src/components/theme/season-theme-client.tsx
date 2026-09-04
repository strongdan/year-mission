"use client";

import { useEffect } from "react";

interface SeasonThemeInput {
  name: string;
  sequence: number;
  startDate: string;
  endDate: string;
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seasonSlot(sequence: number): number {
  const normalized = Number.isFinite(sequence) ? Math.max(1, Math.trunc(sequence)) : 1;
  return ((normalized - 1) % 4) + 1;
}

export function SeasonThemeClient({ seasons }: { seasons: SeasonThemeInput[] }) {
  useEffect(() => {
    const today = localDateKey();
    const current = seasons.find((season) => season.startDate <= today && season.endDate >= today) ?? null;
    const root = document.documentElement;

    if (!current) {
      delete root.dataset.season;
      delete root.dataset.seasonName;
      return;
    }

    root.dataset.season = String(seasonSlot(current.sequence));
    root.dataset.seasonName = current.name;

    return () => {
      delete root.dataset.season;
      delete root.dataset.seasonName;
    };
  }, [seasons]);

  return null;
}

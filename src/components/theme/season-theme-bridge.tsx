import { getActivePlan, listSeasons } from "@/repositories/supabase-repository";
import { requireUser } from "@/lib/auth";
import { SeasonThemeClient } from "./season-theme-client";

interface SeasonThemeData {
  name: string;
  sequence: number;
  startDate: string;
  endDate: string;
}

export async function SeasonThemeBridge() {
  let themeSeasons: SeasonThemeData[] | null = null;

  try {
    const { user } = await requireUser();
    if (!user) return null;

    const plan = await getActivePlan(user.id);
    if (!plan) return null;

    const seasons = await listSeasons(plan.id);
    themeSeasons = seasons.map((season) => ({
      name: season.name,
      sequence: season.sequence,
      startDate: season.start_date,
      endDate: season.end_date,
    }));
  } catch {
    // Seasonal identity is enhancement-only and must never make the app unusable.
    return null;
  }

  return <SeasonThemeClient seasons={themeSeasons} />;
}

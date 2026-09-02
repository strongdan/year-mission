import { getActivePlan, listSeasons } from "@/repositories/supabase-repository";
import { requireUser } from "@/lib/auth";
import { SeasonThemeClient } from "./season-theme-client";

export async function SeasonThemeBridge() {
  try {
    const { user } = await requireUser();
    if (!user) return null;

    const plan = await getActivePlan(user.id);
    if (!plan) return null;

    const seasons = await listSeasons(plan.id);
    return (
      <SeasonThemeClient
        seasons={seasons.map((season) => ({
          name: season.name,
          sequence: season.sequence,
          startDate: season.start_date,
          endDate: season.end_date,
        }))}
      />
    );
  } catch {
    // Seasonal theming is enhancement-only and must never make the app unusable.
    return null;
  }
}

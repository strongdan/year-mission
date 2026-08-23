"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { getActivePlan, listSeasons } from "@/repositories/supabase-repository";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const timelineInputSchema = z.object({
  starts: z.tuple([
    z.string().regex(ISO_DATE),
    z.string().regex(ISO_DATE),
    z.string().regex(ISO_DATE),
    z.string().regex(ISO_DATE),
  ]),
});

function parseDate(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function addOneCalendarYear(value: string): string {
  const { year, month, day } = parseDate(value);
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  return formatDate(year + 1, month, Math.min(day, lastDay));
}

function previousDay(value: string): string {
  const { year, month, day } = parseDate(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function revalidateTimelineConsumers() {
  for (const path of ["/", "/settings", "/progress", "/coach"]) revalidatePath(path);
}

export async function getTimelineSettingsAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const plan = await getActivePlan(user.id);
  if (!plan) return { ok: false as const, error: "No active Year Mission plan found." };

  const seasons = await listSeasons(plan.id);
  if (seasons.length !== 4) {
    return { ok: false as const, error: "Year Mission expects exactly four seasons." };
  }

  return {
    ok: true as const,
    data: {
      plan: {
        title: plan.title,
        startDate: plan.start_date,
        endDate: plan.end_date,
      },
      seasons: seasons
        .sort((a, b) => a.sequence - b.sequence)
        .map((season) => ({
          sequence: season.sequence,
          name: season.name,
          startDate: season.start_date,
          endDate: season.end_date,
        })),
    },
  };
}

export async function saveTimelineSettingsAction(rawInput: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const parsed = timelineInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, error: "Enter four valid start dates." };

  const starts = parsed.data.starts;
  for (let index = 1; index < starts.length; index += 1) {
    if (starts[index] <= starts[index - 1]) {
      return { ok: false as const, error: "Each season must start after the previous season." };
    }
  }

  const planEnd = addOneCalendarYear(starts[0]);
  if (starts[3] >= planEnd) {
    return { ok: false as const, error: "Convert must start before the end of the one-year mission." };
  }

  const plan = await getActivePlan(user.id);
  if (!plan) return { ok: false as const, error: "No active Year Mission plan found." };

  const seasons = (await listSeasons(plan.id)).sort((a, b) => a.sequence - b.sequence);
  if (seasons.length !== 4 || seasons.some((season, index) => season.sequence !== index + 1)) {
    return { ok: false as const, error: "Year Mission expects seasons 1 through 4." };
  }

  const nextSeasons = seasons.map((season, index) => ({
    id: season.id,
    plan_id: season.plan_id,
    name: season.name,
    sequence: season.sequence,
    start_date: starts[index],
    end_date: index < 3 ? previousDay(starts[index + 1]) : previousDay(planEnd),
    objective: season.objective,
  }));

  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const originalPlan = { start_date: plan.start_date, end_date: plan.end_date };

  const { error: planError } = await supabase
    .from("plans")
    .update({ start_date: starts[0], end_date: planEnd })
    .eq("id", plan.id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (planError) return { ok: false as const, error: planError.message };

  const { error: seasonError } = await supabase.from("seasons").upsert(nextSeasons, { onConflict: "id" });
  if (seasonError) {
    await supabase
      .from("plans")
      .update(originalPlan)
      .eq("id", plan.id)
      .eq("user_id", user.id);
    return { ok: false as const, error: seasonError.message };
  }

  revalidateTimelineConsumers();
  return {
    ok: true as const,
    data: {
      startDate: starts[0],
      endDate: planEnd,
      starts,
    },
  };
}

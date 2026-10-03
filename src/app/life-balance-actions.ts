"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/integrations/supabase/server";
import { getGoogleCalendarWeek } from "@/services/google/sync-service";
import { movementSignal, recoveryCopy, recoverySignal, LIFE_MENU, type HealthSummary } from "@/domain/life-balance";
import { addDaysToDateOnly, isValidDateOnly, mondayOfDateOnly } from "@/domain/local-calendar";

export async function getLifeBalanceAction(dateInput: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!isValidDateOnly(dateInput)) return { ok: false as const, error: "Invalid local date." };
  const weekStart = mondayOfDateOnly(dateInput);

  const supabaseServer = await createAdminClient();
  const [calendar, healthResult] = await Promise.all([
    getGoogleCalendarWeek(user.id, weekStart),
    supabaseServer
      ? supabaseServer
      .from("health_daily_summaries")
      .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes")
      .eq("user_id", user.id)
      .gte("date", addDaysToDateOnly(dateInput, -21))
      .order("date", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const health = (healthResult.data ?? []) as HealthSummary[];
  const todayKey = dateInput;
  const today = health.find((row) => row.date === todayKey) ?? null;
  const history = health.filter((row) => row.date !== todayKey);
  const recovery = recoverySignal(today, history);

  const eventsByDay = new Map<string, number>();
  for (const event of calendar.events ?? []) {
    const key = event.start.slice(0, 10);
    eventsByDay.set(key, (eventsByDay.get(key) ?? 0) + 1);
  }

  const calendarAvailable = calendar.outcome === "ok";
  const weekShape = calendarAvailable ? Array.from({ length: 7 }, (_, index) => {
    const key = addDaysToDateOnly(weekStart, index);
    const d = new Date(`${key}T12:00:00Z`);
    const eventCount = eventsByDay.get(key) ?? 0;
    return {
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      eventCount,
      load: eventCount >= 5 ? "busy" : eventCount >= 3 ? "moderate" : "open",
    } as const;
  }) : [];

  const openDays = weekShape.filter((d) => d.load === "open").map((d) => d.label);
  const balancePrompt = !calendarAvailable
    ? "Calendar availability is unavailable right now. The Life Menu is still here as a set of options, not commitments."
    : openDays.length
    ? `You have lighter calendar space on ${openDays.join(", ")}. Protect one of those openings for something you actually want to do.`
    : "This week is calendar-heavy. Look for one small reset that can fit around what is already there instead of adding another obligation.";

  return {
    ok: true as const,
    data: {
      isMonday: dateInput === weekStart,
      menu: LIFE_MENU,
      recovery,
      recoveryCopy: recoveryCopy(recovery),
      movementCopy: movementSignal(today),
      todayHealth: today,
      weekShape,
      balancePrompt,
      calendarAvailable,
      healthConnected: health.length > 0,
      calendarOutcome: calendar.outcome,
    },
  };
}

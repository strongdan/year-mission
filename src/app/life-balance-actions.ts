"use server";

import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { getGoogleCalendarWeek } from "@/services/google/sync-service";
import { movementSignal, recoveryCopy, recoverySignal, LIFE_MENU, type HealthSummary } from "@/domain/life-balance";

function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function dayKey(value: string): string {
  return value.slice(0, 10);
}

export async function getLifeBalanceAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const [calendar, healthResult] = await Promise.all([
    getGoogleCalendarWeek(user.id, mondayOf()),
    supabaseServer
      .from("health_daily_summaries")
      .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes")
      .eq("user_id", user.id)
      .gte("date", daysAgo(21))
      .order("date", { ascending: false }),
  ]);

  const health = (healthResult.data ?? []) as HealthSummary[];
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = health.find((row) => row.date === todayKey) ?? health[0] ?? null;
  const history = health.filter((row) => row !== today);
  const recovery = recoverySignal(today, history);

  const eventsByDay = new Map<string, number>();
  for (const event of calendar.events ?? []) {
    const key = dayKey(event.start);
    eventsByDay.set(key, (eventsByDay.get(key) ?? 0) + 1);
  }

  const monday = new Date(`${mondayOf()}T12:00:00`);
  const weekShape = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const key = d.toISOString().slice(0, 10);
    const eventCount = eventsByDay.get(key) ?? 0;
    return {
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      eventCount,
      load: eventCount >= 5 ? "busy" : eventCount >= 3 ? "moderate" : "open",
    } as const;
  });

  const openDays = weekShape.filter((d) => d.load === "open").map((d) => d.label);
  const balancePrompt = openDays.length
    ? `You have lighter calendar space on ${openDays.join(", ")}. Protect one of those openings for something you actually want to do.`
    : "This week is calendar-heavy. Look for one small reset that can fit around what is already there instead of adding another obligation.";

  return {
    ok: true as const,
    data: {
      isMonday: new Date().getDay() === 1,
      menu: LIFE_MENU,
      recovery,
      recoveryCopy: recoveryCopy(recovery),
      movementCopy: movementSignal(today),
      todayHealth: today,
      weekShape,
      balancePrompt,
      healthConnected: health.length > 0,
      calendarOutcome: calendar.outcome,
    },
  };
}

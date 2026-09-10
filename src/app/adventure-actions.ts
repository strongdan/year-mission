"use server";

import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { getActivePlan, getMonthlyFocus, listDailyCheckins, listTasks, listWorkouts } from "@/repositories/supabase-repository";
import { buildAdventureProgress, seasonForDate, type HealthDay } from "@/domain/adventure";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getAdventureAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const today = todayISO();
  const plan = await getActivePlan(user.id);
  if (!plan) return { ok: false as const, error: "No active mission." };

  const calendarSeason = seasonForDate(today);
  const [completedTasks, checkins, workouts, monthlyFocus] = await Promise.all([
    listTasks(user.id, { status: "completed", limit: 1000 }),
    listDailyCheckins(user.id, plan.start_date),
    listWorkouts(user.id, plan.start_date, 500),
    getMonthlyFocus(user.id, new Date().getFullYear(), new Date().getMonth() + 1),
  ]);

  const seasonStart = calendarSeason.startDate < plan.start_date ? plan.start_date : calendarSeason.startDate;

  const { data: healthRows, error: healthError } = await supabaseServer
    .from("health_daily_summaries")
    .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes")
    .eq("user_id", user.id)
    .gte("date", seasonStart)
    .lte("date", today)
    .order("date", { ascending: true });

  const health = healthError ? [] : ((healthRows ?? []) as HealthDay[]);
  const progress = buildAdventureProgress({
    today,
    seasonStart,
    completedTasks,
    checkins,
    workouts,
    health,
  });

  const todayHealth = health.find((row) => row.date === today) ?? null;
  const todayCheckin = checkins.find((row) => row.date === today) ?? null;
  const monthName = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { month: "long" });
  const weekOfMonth = Math.ceil(new Date(`${today}T12:00:00`).getDate() / 7);

  return {
    ok: true as const,
    data: {
      planTitle: plan.title,
      seasonName: calendarSeason.name,
      seasonObjective: calendarSeason.objective,
      seasonTheme: calendarSeason.theme,
      seasonStart: calendarSeason.startDate,
      seasonEnd: calendarSeason.endDate,
      seasonEmphasis: calendarSeason.emphasis,
      monthName,
      monthFocus: monthlyFocus?.title ?? null,
      weekLabel: `${monthName} · Adventure ${weekOfMonth}`,
      progress,
      todayHealth,
      morningCheckin: !!todayCheckin,
      eveningCheckin: todayCheckin?.evening_reset_completion === "target" || todayCheckin?.evening_reset_completion === "floor",
      nextRewards: [
        { at: 100, label: "Trail marker" },
        { at: 180, label: "Day camp unlocked" },
        { at: 260, label: "Perfect expedition" },
      ],
    },
  };
}

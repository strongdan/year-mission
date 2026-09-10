"use server";

import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { getActivePlan, getMonthlyFocus, listDailyCheckins, listTasks, listWorkouts } from "@/repositories/supabase-repository";
import { buildAdventureProgress, seasonForDate, type HealthDay } from "@/domain/adventure";
import { alaskaStateHolidays, holidayForDate } from "@/domain/holidays";

const GAME_TIME_ZONE = "America/Anchorage";

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: GAME_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

function mondayOf(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

export async function getAdventureAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const today = todayISO();
  const plan = await getActivePlan(user.id);
  if (!plan) return { ok: false as const, error: "No active mission." };

  const calendarSeason = seasonForDate(today);
  const currentDate = new Date(`${today}T12:00:00Z`);
  const currentYear = currentDate.getUTCFullYear();
  const currentMonth = currentDate.getUTCMonth() + 1;
  const [completedTasks, checkins, workouts, monthlyFocus] = await Promise.all([
    listTasks(user.id, { status: "completed", limit: 1000 }),
    listDailyCheckins(user.id, plan.start_date),
    listWorkouts(user.id, plan.start_date, 500),
    getMonthlyFocus(user.id, currentYear, currentMonth),
  ]);

  const seasonStart = calendarSeason.startDate < plan.start_date ? plan.start_date : calendarSeason.startDate;
  const { data: healthRows, error: healthError } = await supabaseServer
    .from("health_daily_summaries")
    .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes")
    .eq("user_id", user.id)
    .gte("date", plan.start_date)
    .lte("date", today)
    .order("date", { ascending: true });

  const health = healthError ? [] : ((healthRows ?? []) as HealthDay[]);
  const progress = buildAdventureProgress({ today, planStart: plan.start_date, seasonStart, completedTasks, checkins, workouts, health });
  const todayHealth = health.find((row) => row.date === today) ?? null;
  const todayCheckin = checkins.find((row) => row.date === today) ?? null;
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const monthDay = currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const weekStart = mondayOf(today);
  const weekEnd = addDays(weekStart, 6);
  const weekOfMonth = Math.ceil(currentDate.getUTCDate() / 7);
  const holiday = holidayForDate(today);
  const upcomingHoliday = alaskaStateHolidays(currentYear).find((item) => item.observedDate > today)
    ?? alaskaStateHolidays(currentYear + 1)[0]
    ?? null;

  return {
    ok: true as const,
    data: {
      planTitle: plan.title,
      today,
      dayName,
      monthDay,
      weekStart,
      weekEnd,
      gameTimeZone: GAME_TIME_ZONE,
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
      holiday,
      upcomingHoliday,
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

"use server";

import { requireUser } from "@/lib/auth";
import { getActivePlan, listEvidence, listMilestones, listTasks } from "@/repositories/supabase-repository";
import { metricsService } from "@/services/metrics-service";
import { buildAchievements, buildChargeState, chooseBonusMission, detectComeback } from "@/domain/game-loop";
import { dateInTimeZone, isValidDateOnly, mondayOfDateOnly } from "@/domain/local-calendar";

export async function getGameLoopAction(dateInput: string, timeZoneInput: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  if (!isValidDateOnly(dateInput)) return { ok: false, error: "Invalid local date." } as const;
  const timeZone = (() => {
    try {
      new Intl.DateTimeFormat("en-CA", { timeZone: timeZoneInput }).format(new Date());
      return timeZoneInput;
    } catch {
      return "UTC";
    }
  })();

  const today = dateInput;
  const [completed, bigFour] = await Promise.all([
    listTasks(user.id, { status: "completed", limit: 100 }),
    metricsService.bigFourProgressThisWeek(user.id, mondayOfDateOnly(today), timeZone),
  ]);

  const meaningful = completed.filter((task) => !task.meta_work && !!task.completed_at);
  const completedToday = meaningful.filter((task) => task.completed_at && dateInTimeZone(task.completed_at, timeZone) === today);
  const recentMeaningfulCompletionDates = Array.from(
    new Set(meaningful.map((task) => task.completed_at ? dateInTimeZone(task.completed_at, timeZone) : null).filter((date): date is string => !!date)),
  ).sort().reverse();

  const charge = buildChargeState({ completedToday, bigFour });
  const bonusMission = chooseBonusMission(bigFour);
  const comeback = detectComeback({
    today,
    meaningfulActionsToday: charge.meaningfulActions,
    recentMeaningfulCompletionDates,
  });

  return {
    ok: true,
    data: {
      today,
      charge,
      bonusMission,
      comeback,
    },
  } as const;
}

export async function getAchievementsAction(dateInput: string, timeZoneInput: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  if (!isValidDateOnly(dateInput)) return { ok: false, error: "Invalid local date." } as const;
  const timeZone = (() => {
    try {
      new Intl.DateTimeFormat("en-CA", { timeZone: timeZoneInput }).format(new Date());
      return timeZoneInput;
    } catch {
      return "UTC";
    }
  })();

  const [plan, completed, evidence, milestones] = await Promise.all([
    getActivePlan(user.id),
    listTasks(user.id, { status: "completed", limit: 500 }),
    listEvidence(user.id, 500),
    listMilestones(user.id),
  ]);
  const start = plan?.start_date ?? "1970-01-01";
  const meaningful = completed.filter((task) => {
    const completedDate = task.completed_at ? dateInTimeZone(task.completed_at, timeZone) : null;
    return !task.meta_work && completedDate !== null && completedDate >= start;
  });
  const missionEvidence = evidence.filter((item) => item.occurred_at >= start);
  const missionMilestones = milestones.filter((item) => item.achieved_at >= start);

  const achievements = buildAchievements({
    meaningfulActions: meaningful.length,
    courageActions: meaningful.filter((task) => task.courage_task).length,
    weeklyWins: meaningful.filter((task) => task.weekly_win).length,
    representedDomains: meaningful.flatMap((task) => task.domain ? [task.domain.slug] : []),
    comebacks: missionEvidence.filter((item) => item.type === "avoidance_overcome").length,
    milestones: missionMilestones.length,
  });

  return { ok: true, data: achievements } as const;
}

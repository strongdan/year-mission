"use server";

import { requireUser } from "@/lib/auth";
import { getActivePlan, listEvidence, listMilestones, listTasks } from "@/repositories/supabase-repository";
import { metricsService } from "@/services/metrics-service";
import { buildAchievements, buildChargeState, chooseBonusMission, detectComeback } from "@/domain/game-loop";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function getGameLoopAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;

  const today = todayISO();
  const [completed, bigFour] = await Promise.all([
    listTasks(user.id, { status: "completed", limit: 100 }),
    metricsService.bigFourProgressThisWeek(user.id, mondayOf()),
  ]);

  const meaningful = completed.filter((task) => !task.meta_work && !!task.completed_at);
  const completedToday = meaningful.filter((task) => task.completed_at?.slice(0, 10) === today);
  const recentMeaningfulCompletionDates = Array.from(
    new Set(meaningful.map((task) => task.completed_at?.slice(0, 10)).filter((date): date is string => !!date)),
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

export async function getAchievementsAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;

  const [plan, completed, evidence, milestones] = await Promise.all([
    getActivePlan(user.id),
    listTasks(user.id, { status: "completed", limit: 500 }),
    listEvidence(user.id, 500),
    listMilestones(user.id),
  ]);
  const start = plan?.start_date ?? "1970-01-01";
  const meaningful = completed.filter((task) => !task.meta_work && !!task.completed_at && task.completed_at.slice(0, 10) >= start);
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

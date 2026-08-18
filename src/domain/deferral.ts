import type { DeferralReason } from "./constants";

export interface DeferralIntervention {
  level: "none" | "watch" | "intervene";
  deferralCount: number;
  message?: string;
  actions: InterventionAction[];
}

export type InterventionAction =
  | "break_down"
  | "schedule_intentionally"
  | "reduce_scope"
  | "ask_coach"
  | "drop_it"
  | "start_10min"
  | "blocker_task"
  | "research_subtask"
  | "minimum_version";

export const INTERVENTION_THRESHOLD = 2;

export const DEFERRAL_ACTION_MAP: Record<DeferralReason, InterventionAction[]> = {
  too_big: ["break_down", "reduce_scope", "schedule_intentionally", "ask_coach", "drop_it"],
  dont_know_how: ["ask_coach", "research_subtask", "break_down"],
  no_energy: ["minimum_version", "start_10min", "schedule_intentionally"],
  not_important: ["drop_it", "reduce_scope"],
  blocked: ["blocker_task", "ask_coach"],
  just_avoiding: ["start_10min", "break_down", "ask_coach"],
};

export function deferralIntervention(deferralCount: number, reason?: DeferralReason): DeferralIntervention {
  if (deferralCount <= 0) return { level: "none", deferralCount, actions: [] };

  const level = deferralCount >= INTERVENTION_THRESHOLD ? "intervene" : "watch";
  const actions = reason ? DEFERRAL_ACTION_MAP[reason] : [];

  const message =
    level === "intervene"
      ? `You've deferred this ${deferralCount === 1 ? "task once" : `task ${deferralCount} times`}. Pick a way to resolve it.`
      : `Deferred once. Watch for patterns before it becomes a habit.`;

  return { level, deferralCount, message, actions };
}

export function avoidancePrompt(reason: DeferralReason): string {
  switch (reason) {
    case "too_big":
      return "Break it into a smaller next action";
    case "dont_know_how":
      return "Ask the Coach or define a research step";
    case "no_energy":
      return "Do a minimum version instead";
    case "not_important":
      return "Deprioritize or drop it";
    case "blocked":
      return "Record the blocker and create a blocker task";
    case "just_avoiding":
      return "Start a 10-minute session";
  }
}
import { parseStoredConversationPath } from "@/domain/conversation-confidence-storage";
import {
  CONFIDENCE_ANCHOR,
  CONFIDENCE_RECOVERY_STEPS,
  CONFIDENCE_ROADMAP,
} from "@/domain/confidence-roadmap";

export function buildConfidenceCoachContext(preferences: unknown) {
  const path = parseStoredConversationPath(preferences);
  if (!path.active || path.status === "stopped") return null;
  const month = CONFIDENCE_ROADMAP.find((item) => item.month === path.month)!;

  // Keep context bounded. Private reflection text and evidence lessons are not
  // needed to explain the current practice, and ephemeral resets never enter it.
  return {
    title: path.title,
    objective: path.objective,
    status: path.status,
    month: path.month,
    monthTheme: month.title,
    focus: month.focus,
    skill: month.skill,
    suggestedActions: path.status === "paused" ? [] : [...month.weeklyActions],
    anchor: CONFIDENCE_ANCHOR,
    recoverySteps: CONFIDENCE_RECOVERY_STEPS.map(({ title, prompt }) => ({ title, prompt })),
    roadmapPath: "/confidence",
  };
}

export type ConfidenceCoachContext = ReturnType<typeof buildConfidenceCoachContext>;

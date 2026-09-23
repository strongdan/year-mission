export const CONVERSATION_CONFIDENCE_TITLE = "Social Ease & Expression";
export const CONVERSATION_CONFIDENCE_OBJECTIVE =
  "Become more comfortable around people, express thoughts clearly, sustain conversations more naturally, and build closer relationships without feeling like I have to perform.";

export const CONVERSATION_MONTHS = [
  "Speak without performing",
  "Sustain an exchange",
  "Comfort with familiar people",
  "Tell stories",
  "Curiosity and depth",
  "Spontaneous expression",
  "Expand settings",
  "Assertiveness",
  "Relationship maintenance",
  "Higher-stakes speaking",
  "Less approval dependence",
  "Sustainable connection",
] as const;

export type ConversationPathStatus = "active" | "paused" | "stopped";
export type MonthChoice = "repeat" | "next" | "skip" | "pause";
export type SupportIntention = "grounding" | "confidence" | "social-ease" | "self-expression" | "resilience";

export const SPEAKING_WORKOUT = [
  "Describe an actual event",
  "Explain something you know",
  "Give an opinion and a reason",
  "Tell a short true story",
  "Speak freely",
] as const;

export function formatWorkoutCountdown(elapsedSeconds: number): string {
  const remaining = Math.max(0, Math.min(300, Math.trunc(elapsedSeconds)));
  const minutes = Math.floor((300 - remaining) / 60);
  const seconds = (300 - remaining) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const CONVERSATION_LOOP = [
  { label: "Notice", prompt: "Respond to something they said." },
  { label: "Ask", prompt: "Ask one natural follow-up." },
  { label: "Relate", prompt: "Tell them something about you." },
  { label: "Explore", prompt: "Follow whichever thread has energy." },
] as const;

export const RECOVERY_LANGUAGE = [
  "A pause does not mean the conversation failed.",
  "I can return to something they already said.",
  "I can end naturally when I am actually finished.",
] as const;

export const WEEKLY_SKILLS = [
  "Share one genuine thought or experience during a natural conversation.",
  "Ask one follow-up instead of rehearsing the next thing to say.",
  "Let a short pause exist without treating it as a problem.",
  "Offer one small detail about your own day.",
] as const;

export function getConversationMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > CONVERSATION_MONTHS.length) return null;
  return { number: month, theme: CONVERSATION_MONTHS[month - 1] };
}

export function currentConversationMonth(input: {
  month: number;
  status: ConversationPathStatus;
  monthChoice?: MonthChoice | null;
}) {
  const month = Math.min(CONVERSATION_MONTHS.length, Math.max(1, Math.trunc(input.month)));
  if (input.status === "paused" || input.monthChoice === "repeat") return month;
  if (input.monthChoice === "skip" || input.monthChoice === "next") return Math.min(CONVERSATION_MONTHS.length, month + 1);
  return month;
}

export function applyMonthChoice(month: number, choice: MonthChoice): { month: number; status: ConversationPathStatus } {
  if (choice === "pause") return { month, status: "paused" };
  if (choice === "repeat") return { month, status: "active" };
  return { month: Math.min(CONVERSATION_MONTHS.length, month + 1), status: "active" };
}

export function conversationFloor(weekCapacity: "normal" | "hard-week" | "recovery") {
  if (weekCapacity === "normal") return "One natural practice opportunity or a five-minute speaking workout is enough to keep this week light and useful.";
  return "One meaningful interaction or a few minutes of speaking practice is enough. There is no catch-up debt.";
}

export function mondayConversationPlan(month: number) {
  const current = getConversationMonth(month) ?? getConversationMonth(1)!;
  return {
    month: current,
    skill: WEEKLY_SKILLS[(current.number - 1) % WEEKLY_SKILLS.length],
    practice: "Offer one natural opportunity to participate; accept, edit, decline, or ignore it.",
  };
}

export function isConversationSkipNonPunitive() {
  return { momentumDelta: 0, xpDelta: 0, reliabilityDelta: 0, createsDebt: false } as const;
}

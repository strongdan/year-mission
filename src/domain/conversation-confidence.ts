import { CONFIDENCE_ROADMAP } from "./confidence-roadmap";

export const CONVERSATION_CONFIDENCE_TITLE = "Self-Trust & Confidence";
export const CONVERSATION_CONFIDENCE_OBJECTIVE =
  "Recover from mistakes without turning against myself: repair what needs repairing, return to participation, and build confidence, connection, and comfort with myself.";

export const CONVERSATION_MONTHS = CONFIDENCE_ROADMAP.map((month) => month.title);

export type ConversationPathStatus = "active" | "paused" | "stopped";
export type MonthChoice = "repeat" | "next" | "skip" | "pause";
export type SupportIntention = "grounding" | "confidence" | "social-ease" | "self-expression" | "resilience";
export type ConfidenceChallengeLevel = "normal" | "tiny";
export type ConfidenceCategory = "social" | "opinion" | "visibility" | "boundaries" | "competence" | "connection";
export type ConfidenceEvidenceOutcome =
  | "nothing-bad"
  | "awkward-handled"
  | "disapproval-handled"
  | "noticed-avoidance";

export type ConfidenceEvidence = {
  id: string;
  createdAt: string;
  repId: string;
  category: ConfidenceCategory;
  outcome: ConfidenceEvidenceOutcome;
  lesson?: string;
};

export const CONFIDENCE_PHASES = [
  {
    number: 1,
    title: "Recover & Participate",
    months: [1, 2, 3] as const,
    edge: "Notice the alarm after a small mistake, make any needed repair, and stay involved while discomfort settles in its own time.",
  },
  {
    number: 2,
    title: "Connect & Express",
    months: [4, 5, 6] as const,
    edge: "Respond fairly to myself, offer connection, and express preferences while respecting other people's choices.",
  },
  {
    number: 3,
    title: "Trust & Be Seen",
    months: [7, 8, 9] as const,
    edge: "Build ownership, make room for play, and take a meaningful visible step with permission to learn and recover.",
  },
  {
    number: 4,
    title: "Live & Maintain",
    months: [10, 11, 12] as const,
    edge: "Carry useful skills into ordinary life, return after setbacks, and keep only the practices that help.",
  },
] as const;

export const CONFIDENCE_REPS = [
  {
    id: "recover-and-rejoin",
    phase: 1,
    category: "social",
    prompt: "After a small mistake that happens naturally, name what happened, make any needed repair, and rejoin the moment. You can still feel embarrassed.",
    tiny: "Notice the shame response and offer yourself one fair sentence. No need to force laughter or feel better on a deadline.",
  },
  {
    id: "genuine-thought",
    phase: 1,
    category: "social",
    prompt: "Share one genuine thought or small detail without checking whether it landed perfectly.",
    tiny: "Say one thing you actually think instead of editing it for approval.",
  },
  {
    id: "stay-one-minute",
    phase: 1,
    category: "social",
    prompt: "When you feel the urge to leave a conversation, stay for one more natural exchange.",
    tiny: "Say hello instead of avoiding the interaction.",
  },
  {
    id: "allow-pause",
    phase: 1,
    category: "visibility",
    prompt: "Let one short pause or mildly awkward moment exist without immediately filling or fixing it.",
    tiny: "Let one pause last a few seconds before doing anything.",
  },
  {
    id: "admit-dont-know",
    phase: 1,
    category: "visibility",
    prompt: "Say I don't know, I'm not sure, or I need to check when that is the truthful answer.",
    tiny: "Notice one moment when you are tempted to fake certainty.",
  },
  {
    id: "listen-and-repair",
    phase: 1,
    category: "social",
    prompt: "Let someone finish their thought and respond to its last point. If you interrupt, say I jumped in—please finish, then give the floor back.",
    tiny: "Give one conversational turn a little more room.",
  },
  {
    id: "genuine-follow-up",
    phase: 1,
    category: "connection",
    prompt: "Ask one follow-up that interests you, listen to the answer, and share something related from your own experience.",
    tiny: "Ask about one thing a familiar person previously mentioned.",
  },
  {
    id: "fair-response",
    phase: 2,
    category: "competence",
    prompt: "After one awkward moment, identify any useful correction and return to an activity. You can acknowledge the memory without reopening the whole review.",
    tiny: "Say: That was uncomfortable. I can take the next useful step.",
  },
  {
    id: "gentle-humor",
    phase: 2,
    category: "social",
    prompt: "For a harmless stumble, allow a neutral Oops or warm humor if it feels natural. Repair any harm first; a joke is never required.",
    tiny: "Let a small imperfection receive a neutral response instead of a character judgment.",
  },
  {
    id: "state-preference",
    phase: 2,
    category: "opinion",
    prompt: "State one small preference without adding a long explanation for why it is acceptable.",
    tiny: "Choose between two ordinary options and say which one you prefer.",
  },
  {
    id: "mild-disagreement",
    phase: 2,
    category: "opinion",
    prompt: "Express one mild disagreement without immediately softening it into agreement.",
    tiny: "Say I see it differently once, calmly.",
  },
  {
    id: "clean-no",
    phase: 2,
    category: "boundaries",
    prompt: "Say no or not today once without building a case for why you are allowed to.",
    tiny: "Delay one automatic yes long enough to decide what you actually want.",
  },
  {
    id: "tolerate-annoyance",
    phase: 2,
    category: "boundaries",
    prompt: "If someone seems mildly annoyed, separate what happened from what you are guessing. Address a real problem; an uncertain reaction can remain uncertain.",
    tiny: "Ask whether a repair is actually needed before reacting to possible annoyance.",
  },
  {
    id: "attempt-before-ai",
    phase: 3,
    category: "competence",
    prompt: "Spend 20 minutes understanding or attempting one work problem before asking AI to solve it.",
    tiny: "Write down what you think the problem is before asking AI.",
  },
  {
    id: "show-unfinished",
    phase: 3,
    category: "visibility",
    prompt: "Show or discuss something before it feels perfectly polished when earlier feedback would actually help.",
    tiny: "Let one small imperfection remain visible instead of fixing it for appearance alone.",
  },
  {
    id: "admit-mistake",
    phase: 3,
    category: "competence",
    prompt: "Acknowledge one mistake or uncertainty directly, then move to the next useful action.",
    tiny: "Name one mistake to yourself without defending it.",
  },
  {
    id: "decide-without-polling",
    phase: 3,
    category: "competence",
    prompt: "Make one small reversible decision without polling other people or AI for reassurance.",
    tiny: "Make one trivial choice without checking whether someone else agrees.",
  },
  {
    id: "try-something-playful",
    phase: 3,
    category: "connection",
    prompt: "Take one small step into music, dancing, a class, or another shared activity because the experience interests you.",
    tiny: "Choose one activity you would enjoy exploring, or attend as an observer.",
  },
  {
    id: "meaningful-visible-step",
    phase: 3,
    category: "visibility",
    prompt: "Take one workable step toward a performance, presentation, gathering, or other visible activity that matters to you.",
    tiny: "Share a short practice with one trusted person, if that fits your chosen goal.",
  },
  {
    id: "initiate-plan",
    phase: 4,
    category: "connection",
    prompt: "Initiate one plan, invitation, or activity you genuinely want instead of waiting to be invited.",
    tiny: "Send one simple invitation or suggest one activity.",
  },
  {
    id: "values-over-reception",
    phase: 4,
    category: "opinion",
    prompt: "Make one small choice because it fits your values even though someone may not be impressed by it.",
    tiny: "Notice one choice where approval is competing with what matters to you.",
  },
  {
    id: "visible-imperfection",
    phase: 4,
    category: "visibility",
    prompt: "Do something useful where other people can see you learning, trying, or being imperfect.",
    tiny: "Ask one question you might normally keep to yourself.",
  },
  {
    id: "meaningful-boundary",
    phase: 4,
    category: "boundaries",
    prompt: "State one boundary or preference that protects time, energy, relationships, or priorities that matter.",
    tiny: "Name the boundary to yourself before deciding whether to say it aloud.",
  },
  {
    id: "another-setting",
    phase: 4,
    category: "social",
    prompt: "Try a familiar small participation step with a different person or in another setting. Reuse the recovery guide if you stumble.",
    tiny: "Greet someone in a setting where you usually stay quiet.",
  },
  {
    id: "return-with-one-step",
    phase: 4,
    category: "connection",
    prompt: "After noticing withdrawal, reconnect with one person or activity through a manageable step. There is no missed-practice debt.",
    tiny: "Choose one small return step from where you are today.",
  },
  {
    id: "keep-what-helps",
    phase: 4,
    category: "competence",
    prompt: "Keep one practice that helps everyday life and let go of tracking that no longer serves you.",
    tiny: "Name one useful practice worth keeping, with no new system to build.",
  },
] as const satisfies readonly {
  id: string;
  phase: number;
  category: ConfidenceCategory;
  prompt: string;
  tiny: string;
}[];

// Stable IDs preserve past evidence; month-specific choices keep today's rep aligned
// with the roadmap. Recovery remains available throughout the year.
export const CONFIDENCE_MONTH_REPS = {
  1: ["recover-and-rejoin", "stay-one-minute", "admit-dont-know"],
  2: ["genuine-thought", "allow-pause", "recover-and-rejoin"],
  3: ["listen-and-repair", "genuine-follow-up", "genuine-thought", "recover-and-rejoin"],
  4: ["fair-response", "gentle-humor", "recover-and-rejoin"],
  5: ["initiate-plan", "genuine-follow-up", "genuine-thought", "recover-and-rejoin"],
  6: ["state-preference", "mild-disagreement", "clean-no", "tolerate-annoyance", "recover-and-rejoin"],
  7: ["attempt-before-ai", "decide-without-polling", "admit-mistake", "recover-and-rejoin"],
  8: ["try-something-playful", "show-unfinished", "genuine-thought", "recover-and-rejoin"],
  9: ["meaningful-visible-step", "visible-imperfection", "admit-mistake", "recover-and-rejoin"],
  10: ["another-setting", "allow-pause", "recover-and-rejoin"],
  11: ["return-with-one-step", "fair-response", "recover-and-rejoin"],
  12: ["values-over-reception", "meaningful-boundary", "keep-what-helps", "recover-and-rejoin"],
} as const satisfies Record<number, readonly (typeof CONFIDENCE_REPS)[number]["id"][]>;

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
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

export const CONVERSATION_LOOP = [
  { label: "Notice", prompt: "Respond to something they said." },
  { label: "Ask", prompt: "Ask one natural follow-up." },
  { label: "Relate", prompt: "Tell them something about you." },
  { label: "Explore", prompt: "Follow whichever thread has energy." },
] as const;

export const RECOVERY_LANGUAGE = [
  "I can make a mistake and stay on my own side.",
  "I can repair what needs repairing and return while embarrassment is still present.",
  "A neutral Oops is enough. Laughter is optional, and recovery has no deadline.",
] as const;

export function getConversationMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > CONVERSATION_MONTHS.length) return null;
  return { number: month, theme: CONVERSATION_MONTHS[month - 1] };
}

export function confidencePhaseForMonth(month: number) {
  const normalized = Number.isFinite(month) ? Math.min(12, Math.max(1, Math.trunc(month))) : 1;
  const phaseIndex = Math.min(CONFIDENCE_PHASES.length - 1, Math.floor((normalized - 1) / 3));
  return CONFIDENCE_PHASES[phaseIndex];
}

export function currentConfidenceRep(input: {
  month: number;
  repIndex?: number;
  challengeLevel?: ConfidenceChallengeLevel;
}) {
  const month = (Number.isFinite(input.month) ? Math.min(12, Math.max(1, Math.trunc(input.month))) : 1) as keyof typeof CONFIDENCE_MONTH_REPS;
  const repIds = CONFIDENCE_MONTH_REPS[month];
  const rawIndex = input.repIndex ?? 0;
  const index = (Number.isFinite(rawIndex) ? Math.max(0, Math.trunc(rawIndex)) : 0) % repIds.length;
  const rep = CONFIDENCE_REPS.find((candidate) => candidate.id === repIds[index])!;
  const challengeLevel = input.challengeLevel ?? "normal";
  return {
    ...rep,
    challengeLevel,
    label: challengeLevel === "tiny" ? rep.tiny : rep.prompt,
  };
}

export function summarizeConfidenceEvidence(evidence: readonly ConfidenceEvidence[]) {
  return {
    total: evidence.length,
    fearedOutcomeDidNotHappen: evidence.filter((item) => item.outcome === "nothing-bad").length,
    awkwardAndHandled: evidence.filter((item) => item.outcome === "awkward-handled").length,
    disapprovalAndHandled: evidence.filter((item) => item.outcome === "disapproval-handled").length,
    noticedAvoidance: evidence.filter((item) => item.outcome === "noticed-avoidance").length,
  };
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
  if (weekCapacity === "normal") return "One small real-world step is enough. Returning counts even while embarrassment remains.";
  return "One tiny approach or one fair response to yourself is enough. There is no catch-up debt or recovery deadline.";
}

export function mondayConversationPlan(month: number) {
  const current = getConversationMonth(month) ?? getConversationMonth(1)!;
  const phase = confidencePhaseForMonth(current.number);
  const roadmap = CONFIDENCE_ROADMAP[current.number - 1];
  return {
    month: current,
    phase,
    skill: roadmap.skill,
    practice: "On Monday, choose two small real-world actions and one skill. Make room for recovery and ordinary enjoyment; missed practice creates no debt.",
    actions: roadmap.weeklyActions,
  };
}

export function isConversationSkipNonPunitive() {
  return { momentumDelta: 0, xpDelta: 0, reliabilityDelta: 0, createsDebt: false } as const;
}

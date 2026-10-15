export const CONVERSATION_CONFIDENCE_TITLE = "Self-Trust & Confidence";
export const CONVERSATION_CONFIDENCE_OBJECTIVE =
  "Build enough self-trust to act like myself even when I feel awkward, uncertain, imperfect, or disapproved of.";

export const CONVERSATION_MONTHS = [
  "Notice the approval reflex",
  "Be seen imperfectly",
  "Stay through awkwardness",
  "Express preferences",
  "Disagree without over-explaining",
  "Set small boundaries",
  "Attempt before outsourcing",
  "Show unfinished work and admit uncertainty",
  "Recover openly from mistakes",
  "Initiate what matters",
  "Choose by values, not reception",
  "Sustainable self-trust",
] as const;

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
    title: "Be Seen",
    months: [1, 2, 3] as const,
    edge: "Let people see a slightly imperfect version of me without rushing to repair their impression.",
  },
  {
    number: 2,
    title: "Take Up Space",
    months: [4, 5, 6] as const,
    edge: "Express preferences, disagreement, and boundaries without treating approval as permission.",
  },
  {
    number: 3,
    title: "Trust Yourself",
    months: [7, 8, 9] as const,
    edge: "Build competence by attempting, deciding, and recovering instead of hiding or immediately outsourcing uncertainty.",
  },
  {
    number: 4,
    title: "Choose Your Life",
    months: [10, 11, 12] as const,
    edge: "Initiate what matters and make more choices from values than from anticipated reactions.",
  },
] as const;

export const CONFIDENCE_REPS = [
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
    prompt: "If someone seems mildly annoyed, wait before apologizing, explaining, or trying to change their reaction.",
    tiny: "Wait 30 seconds before trying to repair someone's possible annoyance.",
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
] as const satisfies readonly {
  id: string;
  phase: number;
  category: ConfidenceCategory;
  prompt: string;
  tiny: string;
}[];

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
  "A pause does not mean the conversation failed.",
  "I can return to something they already said.",
  "I can end naturally when I am actually finished.",
] as const;

export function getConversationMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > CONVERSATION_MONTHS.length) return null;
  return { number: month, theme: CONVERSATION_MONTHS[month - 1] };
}

export function confidencePhaseForMonth(month: number) {
  const normalized = Math.min(12, Math.max(1, Math.trunc(month)));
  return CONFIDENCE_PHASES.find((phase) => phase.months.includes(normalized as never)) ?? CONFIDENCE_PHASES[0];
}

export function currentConfidenceRep(input: {
  month: number;
  repIndex?: number;
  challengeLevel?: ConfidenceChallengeLevel;
}) {
  const phase = confidencePhaseForMonth(input.month);
  const reps = CONFIDENCE_REPS.filter((rep) => rep.phase === phase.number);
  const index = Math.max(0, Math.trunc(input.repIndex ?? 0)) % reps.length;
  const rep = reps[index];
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
  if (weekCapacity === "normal") return "One small real-world rep is enough. The point is willingness, not performance.";
  return "One tiny rep or simply noticing the approval reflex is enough. There is no catch-up debt.";
}

export function mondayConversationPlan(month: number) {
  const current = getConversationMonth(month) ?? getConversationMonth(1)!;
  const phase = confidencePhaseForMonth(current.number);
  return {
    month: current,
    phase,
    skill: phase.edge,
    practice: "Choose about three small reps this week. A rep counts when you act with discomfort present; it does not need to feel confident.",
  };
}

export function isConversationSkipNonPunitive() {
  return { momentumDelta: 0, xpDelta: 0, reliabilityDelta: 0, createsDebt: false } as const;
}

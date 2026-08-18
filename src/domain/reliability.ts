export interface CommitmentOutcome {
  type: "promise" | "task";
  status: "kept" | "renegotiated" | "missed";
}

export const PROMISE_WEIGHT = 2;
export const TASK_WEIGHT = 1;
export const RENEGOTIATED_SCORE = 0.5;
export const KEPT_SCORE = 1;

export interface ReliabilityInput {
  outcomes: CommitmentOutcome[];
  maxOutcomes?: number;
}

export interface ReliabilityResult {
  score: number;
  kept: number;
  renegotiated: number;
  missed: number;
  weightedKept: number;
  weightedTotal: number;
}

export function computeReliability({ outcomes, maxOutcomes = 40 }: ReliabilityInput): ReliabilityResult {
  const windowed = outcomes.slice(-maxOutcomes);
  const weight = (o: CommitmentOutcome) => (o.type === "promise" ? PROMISE_WEIGHT : TASK_WEIGHT);
  const scoreOf = (o: CommitmentOutcome) =>
    o.status === "kept" ? KEPT_SCORE : o.status === "renegotiated" ? RENEGOTIATED_SCORE : 0;

  const weightedKept = windowed.reduce((sum, o) => sum + weight(o) * scoreOf(o), 0);
  const weightedTotal = windowed.reduce((sum, o) => sum + weight(o), 0);
  const kept = windowed.filter((o) => o.status === "kept").length;
  const renegotiated = windowed.filter((o) => o.status === "renegotiated").length;
  const missed = windowed.filter((o) => o.status === "missed").length;

  return {
    score: weightedTotal === 0 ? 0 : Math.round((weightedKept / weightedTotal) * 100),
    kept,
    renegotiated,
    missed,
    weightedKept,
    weightedTotal,
  };
}

export function reliabilityInterpretation(score: number): string {
  if (score >= 80) return "You're generally keeping the commitments you deliberately make.";
  if (score >= 60) return "You're following through most of the time.";
  if (score >= 40) return "Follow-through is inconsistent; volume may be the issue.";
  return "Commitments are often not being met — consider committing to less.";
}

export interface OvercommitmentSignal {
  isOvercommitted: boolean;
  recommendedCap: number;
  made: number;
  kept: number;
}

export function detectOvercommitment(outcomes: CommitmentOutcome[]): OvercommitmentSignal {
  const recent = outcomes.slice(-10);
  const made = recent.length;
  const kept = recent.filter((o) => o.status === "kept").length;
  const keptRate = made === 0 ? 1 : kept / made;
  const isOvercommitted = made >= 8 && keptRate < 0.65;
  const recommendedCap = isOvercommitted ? Math.max(5, Math.round(made * 0.6)) : 0;
  return { isOvercommitted, recommendedCap, made, kept };
}

export interface AgencyInput {
  courageTasksCompleted: number;
  deferredTasksCompleted: number;
  avoidedTasksStarted: number;
  blockersResolved: number;
}

export type AgencyLevel = "no_data" | "weak" | "moderate" | "strong";

/**
 * Conservative agency assessment. Prefer a strength label over false precision.
 */
export function agencyLevel(input: AgencyInput): AgencyLevel {
  const score =
    input.courageTasksCompleted * 2 +
    input.deferredTasksCompleted * 2 +
    input.avoidedTasksStarted * 1.5 +
    input.blockersResolved;

  if (score <= 0) return "no_data";
  if (score < 4) return "weak";
  if (score < 8) return "moderate";
  return "strong";
}

export function agencyLabel(level: AgencyLevel): string {
  switch (level) {
    case "no_data":
      return "Building a baseline";
    case "weak":
      return "Weak this month";
    case "moderate":
      return "Moderate this month";
    case "strong":
      return "Strong this month";
  }
}
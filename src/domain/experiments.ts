import type { ExperimentDecision, ExperimentStatus } from "./constants";

export const MAX_ACTIVE_EXPERIMENTS = 2;

export interface ExperimentLimitResult {
  allowed: boolean;
  message: string;
}

export function assertActiveExperimentLimit(activeCount: number): ExperimentLimitResult {
  if (activeCount >= MAX_ACTIVE_EXPERIMENTS) {
    return {
      allowed: false,
      message: "Two experiments are already active. Replace or defer one before starting another.",
    };
  }
  return { allowed: true, message: "" };
}

export const EXPERIMENT_STATUS_TRANSITIONS: Record<ExperimentStatus, ExperimentStatus[]> = {
  planned: ["active", "abandoned"],
  active: ["completed", "abandoned"],
  completed: ["abandoned"],
  abandoned: [],
};

export function canTransitionExperiment(from: ExperimentStatus, to: ExperimentStatus): boolean {
  return EXPERIMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function resolveExperimentStatus(status: ExperimentStatus, decision: ExperimentDecision): ExperimentStatus {
  if (decision === "abandon") return "abandoned";
  if (decision === "keep" || decision === "modify") return "completed";
  return status;
}

export interface ExperimentConclusion {
  decision: ExperimentDecision;
  conclusion: string;
  completedAt: string;
}
import { z } from "zod";

export const DOMAIN_SLUGS = ["money", "body", "home", "capability"] as const;
export const DOMAIN_SLUGS_Z = z.enum(DOMAIN_SLUGS);
export type DomainSlug = (typeof DOMAIN_SLUGS)[number];

export const TASK_STATUSES = [
  "inbox",
  "backlog",
  "this_week",
  "today",
  "in_progress",
  "completed",
  "dropped",
] as const;
export const TASK_STATUS_Z = z.enum(TASK_STATUSES);
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_SIZES = ["quick", "standard", "deep", "milestone"] as const;
export const TASK_SIZE_Z = z.enum(TASK_SIZES);
export type TaskSize = (typeof TASK_SIZES)[number];

export const SIZING_RANGE = {
  quick: [0, 15],
  standard: [15, 60],
  deep: [60, 180],
} as const;

export const WEEK_MODES = ["push", "normal", "maintenance", "recovery"] as const;
export const WEEK_MODE_Z = z.enum(WEEK_MODES);
export type WeekMode = (typeof WEEK_MODES)[number];

export const EXPERIMENT_STATUSES = ["planned", "active", "completed", "abandoned"] as const;
export const EXPERIMENT_STATUS_Z = z.enum(EXPERIMENT_STATUSES);
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const EXPERIMENT_DECISIONS = ["keep", "modify", "abandon"] as const;
export const EXPERIMENT_DECISION_Z = z.enum(EXPERIMENT_DECISIONS);
export type ExperimentDecision = (typeof EXPERIMENT_DECISIONS)[number];

export const PROMISE_STATUSES = [
  "active",
  "kept",
  "renegotiated",
  "missed",
  "cancelled",
] as const;
export const PROMISE_STATUS_Z = z.enum(PROMISE_STATUSES);
export type PromiseStatus = (typeof PROMISE_STATUSES)[number];

export const DEFERRAL_REASONS = [
  "too_big",
  "dont_know_how",
  "no_energy",
  "not_important",
  "blocked",
  "just_avoiding",
] as const;
export const DEFERRAL_REASON_Z = z.enum(DEFERRAL_REASONS);
export type DeferralReason = (typeof DEFERRAL_REASONS)[number];

export const FRICTION_REASONS = [
  "forgot",
  "too_tired",
  "did_not_feel_like_it",
  "too_big",
  "got_distracted",
  "competing_priority",
  "did_not_know_how",
  "blocked",
  "not_important",
  "just_avoiding",
  "other",
] as const;
export const FRICTION_REASON_Z = z.enum(FRICTION_REASONS);
export type FrictionReason = (typeof FRICTION_REASONS)[number];

export const EVIDENCE_TYPES = [
  "sobriety",
  "fitness",
  "debt",
  "home",
  "career",
  "reliability",
  "courage",
  "avoidance_overcome",
  "milestone",
  "personal_best",
] as const;
export const EVIDENCE_TYPE_Z = z.enum(EVIDENCE_TYPES);
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const CAPABILITY_EVIDENCE_TYPES = [
  "shipped_feature",
  "debugged_production",
  "designed_architecture",
  "wrote_migration",
  "interview_passed",
  "open_source",
  "explained_topic",
  "taught_other",
  "deployment",
  "technical_learning",
  "certification",
  "professional_relationship",
  "difficult_problem",
  "portfolio",
  "interview",
] as const;
export const CAPABILITY_EVIDENCE_TYPE_Z = z.enum(CAPABILITY_EVIDENCE_TYPES);
export type CapabilityEvidenceType = (typeof CAPABILITY_EVIDENCE_TYPES)[number];

export const COMPETENCY_LEVELS = ["exposure", "functional", "independent", "strong", "can_teach"] as const;
export const COMPETENCY_LEVEL_Z = z.enum(COMPETENCY_LEVELS);
export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

export const WELLNESS_OPTIONS = [
  "meditation",
  "breath_work",
  "cold_plunge",
  "hypnosis",
  "mobility",
  "swim",
  "run",
  "cycling",
  "sauna",
  "journaling",
  "cognitive_training",
] as const;
export const WELLNESS_OPTION_Z = z.enum(WELLNESS_OPTIONS);
export type WellnessOption = (typeof WELLNESS_OPTIONS)[number];

export const WEEKLY_MINIMUMS: Record<DomainSlug, { label: string; count: number }> = {
  body: { label: "Workouts", count: 2 },
  money: { label: "Financial review", count: 1 },
  home: { label: "Focused house block", count: 1 },
  capability: { label: "Career/learning block", count: 1 },
};

export const WEEKLY_MINIMUM_COUNTS: Record<DomainSlug, number> = {
  money: 1,
  body: 2,
  home: 1,
  capability: 1,
};

export const DOMAIN_LEVELS = ["foundation", "consistency", "momentum", "expansion", "transformation"] as const;
export const DOMAIN_LEVEL_Z = z.enum(DOMAIN_LEVELS);
export type DomainLevel = (typeof DOMAIN_LEVELS)[number];

export const SEASON_SEQUENCE = ["stabilize", "build", "transform", "convert"] as const;
export const SEASON_SEQUENCE_Z = z.enum(SEASON_SEQUENCE);
export type SeasonSequence = (typeof SEASON_SEQUENCE)[number];

export const TASK_EVENT_TYPES = [
  "created",
  "scheduled",
  "started",
  "deferred",
  "resized",
  "decomposed",
  "blocked",
  "avoidance_recorded",
  "completed",
  "dropped",
  "status_changed",
  "courage_completed",
  "meta_flagged",
] as const;
export const TASK_EVENT_TYPE_Z = z.enum(TASK_EVENT_TYPES);
export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

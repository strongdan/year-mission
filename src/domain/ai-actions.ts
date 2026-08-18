import { z } from "zod";
import { TASK_STATUS_Z } from "./constants";

export const AI_ACTION_TYPES = [
  "create_task",
  "reschedule_task",
  "change_task_status",
  "update_task",
  "decompose_task",
  "set_weekly_win",
  "promote_to_week",
  "promote_to_today",
  "set_week_mode",
  "update_weekly_review",
  "activate_experiment",
  "conclude_experiment",
] as const;
export const AI_ACTION_TYPE_Z = z.enum(AI_ACTION_TYPES);
export type AiActionType = (typeof AI_ACTION_TYPES)[number];

const taskShape = z.object({
  title: z.string().min(1).max(200),
  domain: z.enum(["money", "body", "home", "capability"]).optional(),
  notes: z.string().max(500).optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  scheduled_date: z.string().optional(),
  due_date: z.string().optional(),
  courage_task: z.boolean().optional(),
});

export const AI_ACTION_SCHEMA = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_task"), payload: taskShape, reason: z.string().optional() }),
  z.object({
    action: z.literal("reschedule_task"),
    task_id: z.string().min(1),
    new_date: z.string().min(1),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("change_task_status"),
    task_id: z.string().min(1),
    to_status: TASK_STATUS_Z,
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("update_task"),
    task_id: z.string().min(1),
    payload: z.object({
      title: z.string().min(1).max(200).optional(),
      notes: z.string().max(500).optional(),
      estimated_minutes: z.number().int().min(1).max(480).optional(),
      scheduled_date: z.string().nullable().optional(),
      due_date: z.string().nullable().optional(),
      impact: z.enum(["low", "medium", "high"]).optional(),
    }),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("decompose_task"),
    task_id: z.string().min(1),
    sub_tasks: z.array(z.object({ title: z.string().min(1).max(200), estimated_minutes: z.number().int().min(1).max(240).optional() })).min(2).max(6),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("set_weekly_win"),
    task_id: z.string().min(1),
    reason: z.string().optional(),
  }),
  z.object({ action: z.literal("promote_to_week"), task_id: z.string().min(1), reason: z.string().optional() }),
  z.object({ action: z.literal("promote_to_today"), task_id: z.string().min(1), reason: z.string().optional() }),
  z.object({ action: z.literal("set_week_mode"), mode: z.enum(["push", "normal", "maintenance", "recovery"]), reason: z.string().optional() }),
  z.object({
    action: z.literal("update_weekly_review"),
    week_start: z.string().min(1),
    payload: z.object({
      wins: z.array(z.string()).optional(),
      difficulties: z.array(z.string()).optional(),
      lessons: z.array(z.string()).optional(),
      next_week_focus: z.string().optional(),
    }),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("activate_experiment"),
    experiment_id: z.string().min(1),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("conclude_experiment"),
    experiment_id: z.string().min(1),
    decision: z.enum(["keep", "modify", "abandon"]),
    conclusion: z.string().optional(),
    reason: z.string().optional(),
  }),
]);

export type AiAction = z.infer<typeof AI_ACTION_SCHEMA>;

export function validateAiAction(input: unknown): { ok: true; action: AiAction } | { ok: false; error: string } {
  const result = AI_ACTION_SCHEMA.safeParse(input);
  if (result.success) return { ok: true, action: result.data };
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}

export const HIGH_RISK_ACTIONS: readonly AiActionType[] = [
  "change_task_status",
  "decompose_task",
  "set_weekly_win",
  "set_week_mode",
  "activate_experiment",
  "conclude_experiment",
  "update_weekly_review",
];

export function requiresApproval(action: AiActionType): boolean {
  return HIGH_RISK_ACTIONS.includes(action);
}
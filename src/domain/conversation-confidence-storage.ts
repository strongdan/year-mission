import { z } from "zod";
import { CONVERSATION_CONFIDENCE_OBJECTIVE, CONVERSATION_CONFIDENCE_TITLE } from "./conversation-confidence";

const REFLECTION_SCHEMA = z.object({
  month: z.number().int().min(1).max(12),
  willingness: z.number().int().min(1).max(5).nullable().optional(),
  expression: z.number().int().min(1).max(5).nullable().optional(),
  recovery: z.number().int().min(1).max(5).nullable().optional(),
  connection: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(500).optional().default(""),
});

const STORED_PATH_SCHEMA = z.object({
  active: z.boolean(),
  title: z.string().trim().min(1).max(120),
  objective: z.string().trim().min(1).max(500),
  month: z.number().int().min(1).max(12),
  status: z.enum(["active", "paused", "stopped"]),
  reflections: z.record(z.string(), REFLECTION_SCHEMA).optional(),
});

export type StoredConversationPath = z.infer<typeof STORED_PATH_SCHEMA>;

export function parseStoredConversationPath(preferences: unknown): StoredConversationPath {
  const raw = preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? (preferences as Record<string, unknown>).conversationConfidence
    : undefined;
  const parsed = STORED_PATH_SCHEMA.safeParse(raw);
  if (parsed.success) return parsed.data;
  return {
    active: false,
    title: CONVERSATION_CONFIDENCE_TITLE,
    objective: CONVERSATION_CONFIDENCE_OBJECTIVE,
    month: 1,
    status: "active",
    reflections: {},
  };
}

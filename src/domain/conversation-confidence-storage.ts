import { z } from "zod";
import {
  CONVERSATION_CONFIDENCE_OBJECTIVE,
  CONVERSATION_CONFIDENCE_TITLE,
  type ConfidenceCategory,
  type ConfidenceEvidenceOutcome,
} from "./conversation-confidence";

const LEGACY_TITLE = "Social Ease & Expression";
const LEGACY_OBJECTIVE =
  "Become more comfortable around people, express thoughts clearly, sustain conversations more naturally, and build closer relationships without feeling like I have to perform.";

const REFLECTION_SCHEMA = z.object({
  month: z.number().int().min(1).max(12),
  willingness: z.number().int().min(1).max(5).nullable().optional(),
  expression: z.number().int().min(1).max(5).nullable().optional(),
  recovery: z.number().int().min(1).max(5).nullable().optional(),
  connection: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(500).optional().default(""),
});

const CONFIDENCE_CATEGORY_SCHEMA = z.enum([
  "social",
  "opinion",
  "visibility",
  "boundaries",
  "competence",
  "connection",
] satisfies [ConfidenceCategory, ...ConfidenceCategory[]]);

const CONFIDENCE_OUTCOME_SCHEMA = z.enum([
  "nothing-bad",
  "awkward-handled",
  "disapproval-handled",
  "noticed-avoidance",
] satisfies [ConfidenceEvidenceOutcome, ...ConfidenceEvidenceOutcome[]]);

const EVIDENCE_SCHEMA = z.object({
  id: z.string().trim().min(1).max(100),
  createdAt: z.string().datetime(),
  repId: z.string().trim().min(1).max(100),
  category: CONFIDENCE_CATEGORY_SCHEMA,
  outcome: CONFIDENCE_OUTCOME_SCHEMA,
  lesson: z.string().trim().max(240).optional(),
});

const STORED_PATH_SCHEMA = z.object({
  active: z.boolean(),
  title: z.string().trim().min(1).max(120),
  objective: z.string().trim().min(1).max(500),
  month: z.number().int().min(1).max(12),
  status: z.enum(["active", "paused", "stopped"]),
  reflections: z.record(z.string(), REFLECTION_SCHEMA).optional().default({}),
  repIndex: z.number().int().min(0).max(100000).optional().default(0),
  challengeLevel: z.enum(["normal", "tiny"]).optional().default("normal"),
  evidence: z.array(EVIDENCE_SCHEMA).max(100).optional().default([]),
});

export type StoredConversationPath = z.infer<typeof STORED_PATH_SCHEMA>;

export function parseStoredConversationPath(preferences: unknown): StoredConversationPath {
  const raw = preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? (preferences as Record<string, unknown>).conversationConfidence
    : undefined;
  const parsed = STORED_PATH_SCHEMA.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      title: parsed.data.title === LEGACY_TITLE ? CONVERSATION_CONFIDENCE_TITLE : parsed.data.title,
      objective: parsed.data.objective === LEGACY_OBJECTIVE ? CONVERSATION_CONFIDENCE_OBJECTIVE : parsed.data.objective,
    };
  }
  return {
    active: false,
    title: CONVERSATION_CONFIDENCE_TITLE,
    objective: CONVERSATION_CONFIDENCE_OBJECTIVE,
    month: 1,
    status: "active",
    reflections: {},
    repIndex: 0,
    challengeLevel: "normal",
    evidence: [],
  };
}

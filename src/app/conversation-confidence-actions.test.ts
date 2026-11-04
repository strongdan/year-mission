import { beforeEach, expect, it, vi } from "vitest";
import { recordConfidenceEvidenceAction } from "./conversation-confidence-actions";

const db = vi.hoisted(() => ({
  preferences: {} as Record<string, unknown>,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ user: { id: "owner" } }) }));
vi.mock("@/repositories/supabase-repository", () => ({
  getProfile: async () => ({ preferences: structuredClone(db.preferences) }),
}));
vi.mock("@/integrations/supabase/server", () => ({
  createServerClientForApp: async () => ({
    from: () => ({
      update: (row: { preferences: Record<string, unknown> }) => {
        const compare = (field: string, expected: string | null) => ({
          select: () => ({
            maybeSingle: async () => {
              expect(field).toBe("preferences->conversationConfidence->>revision");
              const path = db.preferences.conversationConfidence as { revision?: string } | undefined;
              if ((path?.revision ?? null) !== expected) return { data: null, error: null };
              db.preferences = row.preferences;
              return { data: { id: "owner" }, error: null };
            },
          }),
        });
        return { eq: () => ({ eq: compare, is: compare }) };
      },
    }),
  }),
}));

const first = { month: 1, repIndex: 0, outcome: "nothing-bad" };
beforeEach(() => { db.preferences = { anotherSetting: "keep" }; });

it("accepts only one overlapping submission and rejects a later replay of the same rep", async () => {
  const results = await Promise.all([recordConfidenceEvidenceAction(first), recordConfidenceEvidenceAction(first)]);
  expect(results.filter((result) => result.ok)).toHaveLength(1);
  expect((await recordConfidenceEvidenceAction(first)).ok).toBe(false);
  expect((await recordConfidenceEvidenceAction({ ...first, repIndex: 1 })).ok).toBe(true);
  expect(db.preferences.anotherSetting).toBe("keep");
  expect(db.preferences.conversationConfidence).toMatchObject({
    repIndex: 2,
    evidence: [expect.objectContaining({ outcome: "nothing-bad" }), expect.objectContaining({ outcome: "nothing-bad" })],
  });
});

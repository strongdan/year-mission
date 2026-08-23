import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAiProviderForRequest } from "@/integrations/ai";
import type { CoachContextPacket } from "./context";
import { COACH_PROVIDER_UNAVAILABLE_MESSAGE, CoachService } from "./coach-service";

vi.mock("@/integrations/ai", () => ({
  getAiProviderForRequest: vi.fn(),
}));

const EMPTY_CONTEXT: CoachContextPacket = {
  plan: null,
  season: null,
  monthlyFocus: null,
  weekMode: "normal",
  goals: [],
  weeklyCommitments: [],
  todayTasks: [],
  backlogCount: 0,
  recentMetrics: {
    momentum: null,
    today: { alcoholFree: false, weight: null, steps: null },
    workoutsThisWeek: 0,
    consumerDebt: null,
    houseReadiness: null,
  },
  recentDeferrals: [],
  recentWins: [],
  weeklyReviews: [],
  milestones: [],
  evidence: [],
  experiments: [],
  promises: [],
  friction: [],
  conversations: [],
};

describe("CoachService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns provider output when the provider succeeds", async () => {
    vi.mocked(getAiProviderForRequest).mockResolvedValue({
      complete: vi.fn().mockResolvedValue({
        content: "Do the next useful thing.",
        model: "test-model",
        inputTokens: 10,
        outputTokens: 5,
        estimatedCost: 0,
        latencyMs: 12,
        provider: "test",
      }),
    } as unknown as Awaited<ReturnType<typeof getAiProviderForRequest>>);

    const result = await new CoachService().chat({ message: "What now?", context: EMPTY_CONTEXT, history: [] });
    expect(result.content).toBe("Do the next useful thing.");
    expect(result.provider).toBe("test");
  });

  it("does not turn an invalid/revoked provider key into an unhandled server error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(getAiProviderForRequest).mockResolvedValue({
      complete: vi.fn().mockRejectedValue(new Error("secret provider credential details")),
    } as unknown as Awaited<ReturnType<typeof getAiProviderForRequest>>);

    const result = await new CoachService().chat({ message: "Help", context: EMPTY_CONTEXT, history: [] });
    expect(result).toMatchObject({
      content: COACH_PROVIDER_UNAVAILABLE_MESSAGE,
      model: "unavailable",
      provider: "unavailable",
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(result.content).not.toContain("secret provider credential details");
  });
});

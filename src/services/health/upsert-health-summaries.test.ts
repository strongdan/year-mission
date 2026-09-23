import { describe, expect, it } from "vitest";
import { upsertHealthSummaries } from "./upsert-health-summaries";

describe("upsertHealthSummaries", () => {
  it("sends only supplied metrics so PostgreSQL can preserve omitted history", async () => {
    const calls: Array<{ values: Record<string, unknown>; date: string }> = [];
    const client = {
      rpc: (_name: string, args: { p_values: Record<string, unknown>; p_date: string }) => {
        calls.push({ values: args.p_values, date: args.p_date });
        return Promise.resolve({ data: null, error: null });
      },
    } as never;

    await upsertHealthSummaries(client, "user-1", [{ date: "2026-09-22", steps: 1200, hrvSdnnMs: null }]);

    expect(calls).toEqual([{ date: "2026-09-22", values: { steps: 1200 } }]);
  });

  it("keeps each date as its own idempotent database operation", async () => {
    const dates: string[] = [];
    const client = {
      rpc: (_name: string, args: { p_date: string }) => {
        dates.push(args.p_date);
        return Promise.resolve({ data: null, error: null });
      },
    } as never;

    await upsertHealthSummaries(client, "user-1", [
      { date: "2026-09-21", steps: 100 },
      { date: "2026-09-22", steps: 200 },
    ]);

    expect(dates.sort()).toEqual(["2026-09-21", "2026-09-22"]);
  });
});

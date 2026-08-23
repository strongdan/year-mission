import { beforeEach, describe, expect, it, vi } from "vitest";
import { createServerClientForApp } from "@/integrations/supabase/server";
import {
  insertMomentumHistory,
  upsertDailyCheckin,
  upsertFinancialSnapshot,
  upsertHouseProgress,
  upsertWeeklyMode,
  upsertWeeklyReview,
} from "./supabase-repository";

vi.mock("@/integrations/supabase/server", () => ({
  createServerClientForApp: vi.fn(),
}));

function installClient() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ upsert });
  vi.mocked(createServerClientForApp).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createServerClientForApp>>);
  return { from, upsert };
}

describe("repository natural-key upserts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses user_id,date for daily check-ins", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", date: "2026-08-23", alcohol_free: true };
    await upsertDailyCheckin(value);
    expect(from).toHaveBeenCalledWith("daily_checkins");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,date" });
  });

  it("uses user_id,date for financial snapshots", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", date: "2026-08-23", consumer_debt: 100 };
    await upsertFinancialSnapshot(value);
    expect(from).toHaveBeenCalledWith("financial_snapshots");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,date" });
  });

  it("uses user_id,date for house progress", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", date: "2026-08-23", readiness_score: 20 };
    await upsertHouseProgress(value);
    expect(from).toHaveBeenCalledWith("house_progress");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,date" });
  });

  it("uses user_id,week_start for weekly modes", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", week_start: "2026-08-17", mode: "normal" as const };
    await upsertWeeklyMode(value);
    expect(from).toHaveBeenCalledWith("weekly_modes");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,week_start" });
  });

  it("uses user_id,week_start for weekly reviews", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", week_start: "2026-08-17", wins: [] };
    await upsertWeeklyReview(value);
    expect(from).toHaveBeenCalledWith("weekly_reviews");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,week_start" });
  });

  it("uses user_id,date for momentum history", async () => {
    const { from, upsert } = installClient();
    const value = { user_id: "user-1", date: "2026-08-23", overall_score: 60 };
    await insertMomentumHistory(value);
    expect(from).toHaveBeenCalledWith("momentum_history");
    expect(upsert).toHaveBeenCalledWith(value, { onConflict: "user_id,date" });
  });
});

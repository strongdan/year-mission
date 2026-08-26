import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getHealthSummaryForUser } from "@/services/health-service";

export const externalProposalSchema = z.object({
  actionType: z.enum(["health_adjustment", "progress_note", "task_adjustment"]),
  payload: z.record(z.string(), z.unknown()),
  reasoning: z.string().min(1).max(2_000),
});

export async function getYearMissionExternalContext(
  admin: SupabaseClient,
  userId: string,
  asOf = new Date().toISOString().slice(0, 10)
) {
  const [health, domainsResult, tasksResult, weekModeResult] = await Promise.all([
    getHealthSummaryForUser(admin, userId, asOf),
    admin.from("domains").select("id, slug, title").eq("user_id", userId).order("created_at"),
    admin
      .from("tasks")
      .select("id, title, status, scheduled_date, due_date, impact, weekly_commitment, weekly_win")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    admin
      .from("weekly_modes")
      .select("week_start, mode, note")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (domainsResult.error) throw new Error(domainsResult.error.message);
  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (weekModeResult.error) throw new Error(weekModeResult.error.message);

  return {
    asOf,
    goals: domainsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    weekMode: weekModeResult.data ?? null,
    health,
    mutationPolicy:
      "Health-derived plan changes are recommendations only. Create a proposal for owner review; do not mutate mission data directly.",
  };
}

export async function createYearMissionExternalProposal(
  admin: SupabaseClient,
  userId: string,
  input: unknown
) {
  const parsed = externalProposalSchema.parse(input);
  const { data, error } = await admin
    .from("ai_proposals")
    .insert({
      user_id: userId,
      conversation_id: null,
      action_type: `chatgpt_${parsed.actionType}`,
      payload: parsed.payload,
      reasoning: parsed.reasoning,
      status: "pending",
    })
    .select("id, action_type, status, created_at")
    .single();
  if (error) throw new Error(error.message);

  return {
    ...data,
    applied: false,
    message: "Proposal recorded for owner review. No mission data was changed.",
  };
}

"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/integrations/supabase/server";
import { getAiProviderForRequest } from "@/integrations/ai";

const BODY_Z = z.string().trim().min(1).max(12_000);
const ID_Z = z.string().uuid();

export interface JournalEntryView {
  id: string;
  body: string;
  aiAnalysis: string | null;
  suggestedAction: string | null;
  promotedTaskId: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  createdAt: string;
}

async function context() {
  const { user } = await requireUser();
  if (!user) throw new Error("Not signed in.");
  const admin = await createAdminClient();
  if (!admin) throw new Error("Server database access is not configured.");
  return { user, admin };
}

function toView(row: Record<string, unknown>): JournalEntryView {
  return {
    id: String(row.id),
    body: String(row.body ?? ""),
    aiAnalysis: typeof row.ai_analysis === "string" ? row.ai_analysis : null,
    suggestedAction: typeof row.suggested_action === "string" ? row.suggested_action : null,
    promotedTaskId: typeof row.promoted_task_id === "string" ? row.promoted_task_id : null,
    aiProvider: typeof row.ai_provider === "string" ? row.ai_provider : null,
    aiModel: typeof row.ai_model === "string" ? row.ai_model : null,
    createdAt: String(row.created_at ?? ""),
  };
}

function parseAnalysis(content: string): { analysis: string; suggestedAction: string | null } {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned) as { analysis?: unknown; suggestedAction?: unknown };
    const analysis = typeof parsed.analysis === "string" ? parsed.analysis.trim().slice(0, 2400) : "";
    const suggestedAction = typeof parsed.suggestedAction === "string"
      ? parsed.suggestedAction.trim().slice(0, 240)
      : null;
    if (analysis) return { analysis, suggestedAction: suggestedAction || null };
  } catch {
    // Providers are allowed to fail structured formatting; preserve useful prose.
  }
  return { analysis: cleaned.slice(0, 2400), suggestedAction: null };
}

export async function listJournalEntriesAction(limit = 5) {
  try {
    const { user, admin } = await context();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10);
    const { data, error } = await admin
      .from("journal_entries")
      .select("id,body,ai_analysis,suggested_action,promoted_task_id,ai_provider,ai_model,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(safeLimit);
    if (error) throw error;
    return { ok: true as const, data: (data ?? []).map((row) => toView(row as Record<string, unknown>)) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Journal could not be loaded." };
  }
}

export async function saveJournalEntryAction(body: string) {
  const parsed = BODY_Z.safeParse(body);
  if (!parsed.success) return { ok: false as const, error: "Write between 1 and 12,000 characters." };

  try {
    const { user, admin } = await context();
    const { data, error } = await admin
      .from("journal_entries")
      .insert({ user_id: user.id, body: parsed.data })
      .select("id,body,ai_analysis,suggested_action,promoted_task_id,ai_provider,ai_model,created_at")
      .single();
    if (error) throw error;
    return { ok: true as const, data: toView(data as Record<string, unknown>) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Journal entry could not be saved." };
  }
}

export async function analyzeJournalEntryAction(entryId: string) {
  const id = ID_Z.safeParse(entryId);
  if (!id.success) return { ok: false as const, error: "Invalid journal entry." };

  try {
    const { user, admin } = await context();
    const { data: row, error: readError } = await admin
      .from("journal_entries")
      .select("id,body")
      .eq("id", id.data)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { ok: false as const, error: "Journal entry not found." };

    const provider = await getAiProviderForRequest();
    const reply = await provider.complete({
      modelKind: "coach",
      maxTokens: 650,
      messages: [
        {
          role: "system",
          content: [
            "Analyze a private Year Mission journal entry for execution-relevant insight.",
            "Be concise, grounded only in what the writer actually said, and avoid diagnosis or pseudo-clinical claims.",
            "Prioritize patterns, blockers, tradeoffs, useful observations, and one concrete next action only when warranted.",
            "Do not mutate plans or tasks. Return strict JSON with exactly two keys:",
            '{"analysis":"2-5 concise sentences","suggestedAction":"one concrete action or null"}',
          ].join(" "),
        },
        { role: "user", content: String(row.body) },
      ],
    });

    const parsed = parseAnalysis(reply.content);
    const { data, error: updateError } = await admin
      .from("journal_entries")
      .update({
        ai_analysis: parsed.analysis,
        suggested_action: parsed.suggestedAction,
        ai_provider: reply.provider,
        ai_model: reply.model,
        ai_input_tokens: reply.inputTokens,
        ai_output_tokens: reply.outputTokens,
        ai_estimated_cost: reply.estimatedCost,
        ai_latency_ms: reply.latencyMs,
      })
      .eq("id", id.data)
      .eq("user_id", user.id)
      .select("id,body,ai_analysis,suggested_action,promoted_task_id,ai_provider,ai_model,created_at")
      .single();
    if (updateError) throw updateError;
    return { ok: true as const, data: toView(data as Record<string, unknown>) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "AI analysis is unavailable right now." };
  }
}

export async function promoteJournalSuggestionAction(entryId: string) {
  const id = ID_Z.safeParse(entryId);
  if (!id.success) return { ok: false as const, error: "Invalid journal entry." };

  try {
    const { user, admin } = await context();
    const { data: row, error: readError } = await admin
      .from("journal_entries")
      .select("suggested_action,promoted_task_id")
      .eq("id", id.data)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { ok: false as const, error: "Journal entry not found." };
    if (row.promoted_task_id) return { ok: true as const, data: { taskId: String(row.promoted_task_id), alreadyPromoted: true } };

    const title = typeof row.suggested_action === "string" ? row.suggested_action.trim().slice(0, 240) : "";
    if (!title) return { ok: false as const, error: "This analysis did not suggest a concrete action." };

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .insert({ user_id: user.id, title, status: "inbox", source: "journal" })
      .select("id")
      .single();
    if (taskError) throw taskError;

    const { error: eventError } = await admin.from("task_events").insert({
      user_id: user.id,
      task_id: task.id,
      event_type: "created",
      event_data: { source: "journal", journal_entry_id: id.data },
    });
    if (eventError) throw eventError;

    const { error: updateError } = await admin
      .from("journal_entries")
      .update({ promoted_task_id: task.id })
      .eq("id", id.data)
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    return { ok: true as const, data: { taskId: String(task.id), alreadyPromoted: false } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Suggested action could not be added." };
  }
}

export async function deleteJournalEntryAction(entryId: string) {
  const id = ID_Z.safeParse(entryId);
  if (!id.success) return { ok: false as const, error: "Invalid journal entry." };

  try {
    const { user, admin } = await context();
    const { error } = await admin.from("journal_entries").delete().eq("id", id.data).eq("user_id", user.id);
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Journal entry could not be deleted." };
  }
}

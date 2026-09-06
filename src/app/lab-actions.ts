"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { labScanDraftSchema, type LabScanDraft } from "@/domain/labs";
import { analyzeLabImage } from "@/services/health/lab-scan";

const SCAN_META_Z = z.object({
  sourceFilename: z.string().trim().max(255).nullable().optional(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  aiProvider: z.string().trim().max(40).nullable().optional(),
  aiModel: z.string().trim().max(120).nullable().optional(),
  aiInputTokens: z.number().int().nonnegative().max(5_000_000).nullable().optional(),
  aiOutputTokens: z.number().int().nonnegative().max(5_000_000).nullable().optional(),
  aiEstimatedCost: z.number().nonnegative().max(1000).nullable().optional(),
  aiLatencyMs: z.number().int().nonnegative().max(300_000).nullable().optional(),
});

export type ConfirmedLabScan = LabScanDraft & z.infer<typeof SCAN_META_Z>;

function safeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.slice(0, 300) : fallback;
}

export async function scanLabImageAction(formData: FormData) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const value = formData.get("image");
  if (!(value instanceof File)) return { ok: false as const, error: "Choose a lab-result image." };

  try {
    const analysis = await analyzeLabImage(value);
    return {
      ok: true as const,
      data: {
        ...analysis.draft,
        sourceFilename: value.name || null,
        sourceSha256: analysis.sourceSha256,
        aiProvider: analysis.provider,
        aiModel: analysis.model,
        aiInputTokens: analysis.inputTokens,
        aiOutputTokens: analysis.outputTokens,
        aiEstimatedCost: analysis.estimatedCost,
        aiLatencyMs: analysis.latencyMs,
      } satisfies ConfirmedLabScan,
    };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "The lab image could not be analyzed.") };
  }
}

export async function saveConfirmedLabScanAction(input: ConfirmedLabScan) {
  const parsedDraft = labScanDraftSchema.safeParse(input);
  const parsedMeta = SCAN_META_Z.safeParse(input);
  if (!parsedDraft.success || !parsedMeta.success) return { ok: false as const, error: "Review the extracted lab values before saving." };

  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  try {
    const draft = parsedDraft.data;
    const meta = parsedMeta.data;
    const { data: panel, error: panelError } = await supabase
      .from("lab_panels")
      .insert({
        user_id: user.id,
        collected_at: draft.collectedAt ?? null,
        source_name: draft.sourceName ?? null,
        source_filename: meta.sourceFilename ?? null,
        source_sha256: meta.sourceSha256 ?? null,
        ai_interpretation: draft.interpretation ?? null,
        ai_provider: meta.aiProvider ?? null,
        ai_model: meta.aiModel ?? null,
        ai_input_tokens: meta.aiInputTokens ?? null,
        ai_output_tokens: meta.aiOutputTokens ?? null,
        ai_estimated_cost: meta.aiEstimatedCost ?? null,
        ai_latency_ms: meta.aiLatencyMs ?? null,
      })
      .select("id")
      .single();
    if (panelError) throw panelError;

    const rows = draft.results.map((result) => ({
      user_id: user.id,
      panel_id: panel.id,
      test_name: result.testName,
      loinc_code: result.loincCode ?? null,
      value_numeric: result.valueNumeric ?? null,
      value_text: result.valueText ?? null,
      unit: result.unit ?? null,
      reference_low: result.referenceLow ?? null,
      reference_high: result.referenceHigh ?? null,
      reference_text: result.referenceText ?? null,
      abnormal_flag: result.abnormalFlag ?? "unknown",
      confirmed_by_user: true,
    }));

    const { error: resultError } = await supabase.from("lab_results").insert(rows);
    if (resultError) {
      await supabase.from("lab_panels").delete().eq("id", panel.id).eq("user_id", user.id);
      throw resultError;
    }

    revalidatePath("/progress");
    return { ok: true as const, data: { panelId: panel.id, resultCount: rows.length } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "The confirmed lab results could not be saved.") };
  }
}

export async function listLabProgressAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  try {
    const { data: panels, error: panelError } = await supabase
      .from("lab_panels")
      .select("id,collected_at,source_name,ai_interpretation,created_at")
      .eq("user_id", user.id)
      .order("collected_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8);
    if (panelError) throw panelError;

    const ids = (panels ?? []).map((panel) => String(panel.id));
    const results = ids.length
      ? await supabase
          .from("lab_results")
          .select("id,panel_id,test_name,loinc_code,value_numeric,value_text,unit,reference_low,reference_high,reference_text,abnormal_flag,created_at")
          .eq("user_id", user.id)
          .in("panel_id", ids)
          .eq("confirmed_by_user", true)
      : { data: [], error: null };
    if (results.error) throw results.error;

    return { ok: true as const, data: { panels: panels ?? [], results: results.data ?? [] } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Lab progress could not be loaded.") };
  }
}

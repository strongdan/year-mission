export interface JournalAnalysis {
  analysis: string;
  suggestedAction: string | null;
}

const MAX_ANALYSIS_CHARS = 2_400;
const MAX_ACTION_CHARS = 240;

function cleanFence(content: string): string {
  return content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

/**
 * Provider output is intentionally treated as untrusted text. Prefer the
 * requested JSON shape, but preserve useful prose when a provider ignores it.
 */
export function parseJournalAnalysis(content: string): JournalAnalysis {
  const cleaned = cleanFence(content);

  try {
    const parsed = JSON.parse(cleaned) as { analysis?: unknown; suggestedAction?: unknown };
    const analysis = typeof parsed.analysis === "string"
      ? parsed.analysis.trim().slice(0, MAX_ANALYSIS_CHARS)
      : "";
    const suggestedAction = typeof parsed.suggestedAction === "string"
      ? parsed.suggestedAction.trim().slice(0, MAX_ACTION_CHARS)
      : null;

    if (analysis) {
      return { analysis, suggestedAction: suggestedAction || null };
    }
  } catch {
    // Plain prose is a supported degradation path.
  }

  return { analysis: cleaned.slice(0, MAX_ANALYSIS_CHARS), suggestedAction: null };
}

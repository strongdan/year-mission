import "server-only";

import { env } from "@/lib/env";
import { parseLabScanJson, type LabScanDraft } from "@/domain/labs";

const MODEL = "gemini-3.6-flash";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export interface LabImageAnalysis {
  draft: LabScanDraft;
  provider: "gemini";
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function analyzeLabImage(file: File): Promise<LabImageAnalysis & { sourceSha256: string }> {
  if (!env.GEMINI_API_KEY) throw new Error("Lab scanning requires the deployment Gemini API key.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Use a JPEG, PNG, WebP, HEIC, or HEIF image.");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Lab image must be between 1 byte and 8 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sourceSha256 = await sha256Hex(bytes);
  const started = Date.now();

  const prompt = [
    "Extract laboratory test results from this image for the person who uploaded it.",
    "Return only JSON with keys collectedAt, sourceName, interpretation, results.",
    "results must be an array of objects with testName, loincCode, valueNumeric, valueText, unit, referenceLow, referenceHigh, referenceText, abnormalFlag.",
    "Use null when a field is not explicitly present. Do not invent reference ranges, units, dates, LOINC codes, or values.",
    "Set abnormalFlag to low/high/normal/abnormal only when the report itself clearly marks it or an explicit printed reference range makes the classification unambiguous; otherwise use unknown.",
    "Interpretation should be a concise, non-diagnostic summary of what the report itself shows. Distinguish clearly between in-range and flagged results. Do not recommend medication changes. Do not claim a disease or diagnosis. If an important result is clearly flagged, suggest discussing it with a qualified healthcare professional.",
    "When a numeric result is present, put it in valueNumeric and leave valueText null unless the result is intrinsically non-numeric.",
    "collectedAt must be an ISO 8601 datetime with offset when the report gives a collection date/time, otherwise null.",
  ].join(" ");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type, data: bytesToBase64(bytes) } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    error?: { message?: string };
  };
  if (!response.ok) throw new Error((payload.error?.message || `Lab scan failed (${response.status}).`).slice(0, 300));

  const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  if (!raw) throw new Error("The lab image did not produce structured results.");

  return {
    draft: parseLabScanJson(raw),
    provider: "gemini",
    model: MODEL,
    inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    estimatedCost: 0,
    latencyMs: Date.now() - started,
    sourceSha256,
  };
}

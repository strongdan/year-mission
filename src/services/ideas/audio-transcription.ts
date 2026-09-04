import "server-only";

import { OpenAI } from "openai";
import { env } from "@/lib/env";
import { GEMINI_MODELS } from "@/integrations/ai/provider";
import { getPreferredAiProvider, getStoredApiKey } from "@/services/integrations/api-key-store";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
type TranscriptionProvider = "gemini" | "openai";

export interface AudioTranscriptionResult {
  text: string;
  provider: TranscriptionProvider;
}

interface AudioTranscriptionOptions {
  includeStoredKeys?: boolean;
}

async function resolveKeys(includeStoredKeys: boolean) {
  let preferred: TranscriptionProvider | null = null;
  let storedGemini: string | null = null;
  let storedOpenAi: string | null = null;

  if (includeStoredKeys) {
    try {
      const [preferredAi, gemini, openai] = await Promise.all([
        getPreferredAiProvider(),
        getStoredApiKey("gemini"),
        getStoredApiKey("openai"),
      ]);
      preferred = preferredAi === "gemini" || preferredAi === "openai" ? preferredAi : null;
      storedGemini = gemini;
      storedOpenAi = openai;
    } catch {
      // Deployment-level keys remain available if per-device key storage is unavailable.
    }
  }

  return {
    preferred,
    gemini: storedGemini ?? env.GEMINI_API_KEY ?? null,
    openai: storedOpenAi ?? env.OPENAI_API_KEY ?? null,
  };
}

async function transcribeWithGemini(file: File, apiKey: string): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODELS.coach)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: "Transcribe this spoken brain dump faithfully. Return only the transcript, preserving the speaker's wording. Do not summarize, organize, or add commentary." },
            { inlineData: { mimeType: file.type || "audio/mp4", data: bytes.toString("base64") } },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 4096 },
      }),
      cache: "no-store",
    },
  );
  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || `Gemini transcription failed (${response.status}).`);
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  if (!text) throw new Error("Gemini returned an empty transcript.");
  return text;
}

async function transcribeWithOpenAi(file: File, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey });
  const result = await client.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    response_format: "text",
  });
  const text = typeof result === "string" ? result.trim() : String(result).trim();
  if (!text) throw new Error("OpenAI returned an empty transcript.");
  return text;
}

export async function transcribeIdeaAudio(
  file: File,
  options: AudioTranscriptionOptions = {},
): Promise<AudioTranscriptionResult> {
  if (file.size <= 0) throw new Error("The recording was empty.");
  if (file.size > MAX_AUDIO_BYTES) throw new Error("Recording is too large. Keep a narration under about five minutes and try again.");
  if (!file.type.startsWith("audio/")) throw new Error("Unsupported recording format.");

  const keys = await resolveKeys(options.includeStoredKeys !== false);
  const order: TranscriptionProvider[] = keys.preferred === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
  let lastError: unknown = null;

  for (const provider of order) {
    try {
      if (provider === "gemini" && keys.gemini) {
        return { text: await transcribeWithGemini(file, keys.gemini), provider };
      }
      if (provider === "openai" && keys.openai) {
        return { text: await transcribeWithOpenAi(file, keys.openai), provider };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(options.includeStoredKeys === false
    ? "Native audio transcription needs a Gemini or OpenAI key configured in the deployment environment."
    : "Audio transcription is not configured. Add a Gemini or OpenAI key in Settings.");
}

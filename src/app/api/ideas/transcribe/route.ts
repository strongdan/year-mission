import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { transcribeIdeaAudio } from "@/services/ideas/audio-transcription";

export const runtime = "nodejs";

const SAFE_TRANSCRIPTION_ERRORS = [
  "The recording was empty.",
  "Recording is too large. Keep a narration under about five minutes and try again.",
  "Unsupported recording format.",
  "Audio transcription is not configured. Add a Gemini or OpenAI key in Settings.",
];

export async function POST(request: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ ok: false, error: "No recording was received." }, { status: 400 });
    }

    const result = await transcribeIdeaAudio(audio);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (SAFE_TRANSCRIPTION_ERRORS.includes(message)) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    console.error("[idea-transcription] provider request failed");
    return NextResponse.json(
      {
        ok: false,
        error: "Audio transcription is unavailable right now. Check your AI connection in Settings and try again.",
      },
      { status: 503 },
    );
  }
}

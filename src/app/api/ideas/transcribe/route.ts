import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { transcribeIdeaAudio } from "@/services/ideas/audio-transcription";
import { safeTranscriptionError } from "@/domain/transcription-errors";

export const runtime = "nodejs";

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
    const safe = safeTranscriptionError(error);
    if (safe.status === 503) console.error("[idea-transcription] provider request failed");
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}

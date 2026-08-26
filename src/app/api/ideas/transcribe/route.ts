import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { transcribeIdeaAudio } from "@/services/ideas/audio-transcription";

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
    const message = error instanceof Error ? error.message : "Could not transcribe the recording.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

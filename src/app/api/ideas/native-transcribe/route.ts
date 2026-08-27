import { NextResponse } from "next/server";
import { transcribeIdeaAudio } from "@/services/ideas/audio-transcription";
import { verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

export const runtime = "nodejs";

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "Missing native capture ticket." }, { status: 401 });

  try {
    verifyNativeCaptureTicket(token);
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ ok: false, error: "No recording was received." }, { status: 400 });
    }

    const result = await transcribeIdeaAudio(audio, { includeStoredKeys: false });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not transcribe the recording.";
    const status = /ticket|expired/i.test(message) ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

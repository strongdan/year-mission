const SAFE_TRANSCRIPTION_ERRORS = new Set([
  "The recording was empty.",
  "Recording is too large. Keep a narration under about five minutes and try again.",
  "Unsupported recording format.",
  "Audio transcription is not configured. Add a Gemini or OpenAI key in Settings.",
]);

export function safeTranscriptionError(error: unknown): { status: number; message: string } {
  const message = error instanceof Error ? error.message : "";
  if (SAFE_TRANSCRIPTION_ERRORS.has(message)) return { status: 400, message };
  return {
    status: 503,
    message: "Audio transcription is unavailable right now. Check your AI connection in Settings and try again.",
  };
}

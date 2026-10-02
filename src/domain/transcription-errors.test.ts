import { describe, expect, it } from "vitest";
import { safeTranscriptionError } from "./transcription-errors";

describe("safeTranscriptionError", () => {
  it("passes through known user-actionable recording errors", () => {
    expect(safeTranscriptionError(new Error("The recording was empty."))).toEqual({
      status: 400,
      message: "The recording was empty.",
    });
  });

  it("does not expose unexpected provider errors", () => {
    const result = safeTranscriptionError(new Error("provider secret or raw upstream failure"));
    expect(result.status).toBe(503);
    expect(result.message).toBe(
      "Audio transcription is unavailable right now. Check your AI connection in Settings and try again."
    );
    expect(result.message).not.toMatch(/provider secret|upstream/i);
  });
  it("turns empty transcripts into a re-record prompt", () => {
    expect(safeTranscriptionError(new Error("Gemini returned an empty transcript."))).toEqual({
      status: 400,
      message: "No speech could be transcribed from that recording. Try recording again.",
    });
  });
});

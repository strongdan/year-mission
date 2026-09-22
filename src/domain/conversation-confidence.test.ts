import { describe, expect, it } from "vitest";
import { speakingWorkoutState } from "@/domain/conversation-confidence";

describe("speakingWorkoutState", () => {
  it("uses a real five-minute countdown at minute boundaries", () => {
    expect(speakingWorkoutState(0)).toMatchObject({ remainingSeconds: 300, step: 0 });
    expect(speakingWorkoutState(59)).toMatchObject({ remainingSeconds: 241, step: 0 });
    expect(speakingWorkoutState(60)).toMatchObject({ remainingSeconds: 240, step: 1 });
    expect(speakingWorkoutState(299)).toMatchObject({ remainingSeconds: 1, step: 4 });
    expect(speakingWorkoutState(300)).toMatchObject({ remainingSeconds: 0, step: null });
  });
});

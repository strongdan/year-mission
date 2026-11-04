import { describe, expect, it } from "vitest";
import { AWAKE_AT_NIGHT_STEPS, SLEEP_ANCHORS, sleepCueForHour } from "./sleep-support";

describe("sleep support", () => {
  it("keeps the protocol focused on a small set of behavioral anchors", () => {
    expect(SLEEP_ANCHORS.length).toBeGreaterThanOrEqual(6);
    expect(SLEEP_ANCHORS.some((item) => item.id === "fixed-wake")).toBe(true);
    expect(SLEEP_ANCHORS.some((item) => item.id === "morning-light")).toBe(true);
    expect(SLEEP_ANCHORS.some((item) => item.id === "cool-dark")).toBe(true);
    expect(SLEEP_ANCHORS.some((item) => item.id === "bed-is-for-sleep")).toBe(true);
  });

  it("uses stimulus control rather than clock watching during night awakenings", () => {
    expect(AWAKE_AT_NIGHT_STEPS.some((item) => item.id === "dont-clock-watch")).toBe(true);
    expect(AWAKE_AT_NIGHT_STEPS.some((item) => item.id === "leave-bed")).toBe(true);
    expect(AWAKE_AT_NIGHT_STEPS.some((item) => item.id === "return-sleepy")).toBe(true);
  });

  it("gives morning, daytime, and evening cues without creating a sleep score", () => {
    expect(sleepCueForHour(7).href).toBe("/execute/morning-outdoor-light");
    expect(sleepCueForHour(14).href).toBe("/execute/post-meal-walk");
    expect(sleepCueForHour(22).href).toBe("/execute/sleep-wind-down");
  });
});

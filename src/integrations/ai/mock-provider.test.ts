import { describe, it, expect } from "vitest";
import { mockCoachReply } from "./mock-provider";

describe("mock provider coaching", () => {
  it("redirects planning toward execution", () => {
    const reply = mockCoachReply("can we optimize this task more");
    expect(reply).toMatch(/15 minutes|next physical action/i);
  });

  it("advises against adding unrelated goals", () => {
    const reply = mockCoachReply("add Spanish, piano, fasting, 5am routine");
    expect(reply).toMatch(/experiment|two experiments|target metric/i);
  });

  it("handles deferral questions constructively without shame", () => {
    const reply = mockCoachReply("why do I keep avoiding house projects");
    expect(reply).not.toMatch(/shame|guilt|streak/i);
    expect(reply).toMatch(/10-minute|smallest|break it down/i);
  });
});
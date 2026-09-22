import { describe, expect, it } from "vitest";
import { buildMovementSnapshot, daysBetweenDates, movementRecencyLabel } from "./movement-variety";

describe("movement variety", () => {
  it("calculates calendar-day gaps deterministically", () => {
    expect(daysBetweenDates("2026-09-06", "2026-09-08")).toBe(2);
    expect(daysBetweenDates("2026-08-31", "2026-09-01")).toBe(1);
  });

  it("nudges after the configured quiet period", () => {
    const snapshot = buildMovementSnapshot(
      [{ activity: "walk", happenedOn: "2026-09-06" }],
      "2026-09-08",
      2
    );
    expect(snapshot.overdue).toBe(true);
    expect(snapshot.daysSinceAny).toBe(2);
  });

  it("does not treat a recent outing as exercise debt", () => {
    const snapshot = buildMovementSnapshot(
      [{ activity: "bike", happenedOn: "2026-09-07" }],
      "2026-09-08",
      2
    );
    expect(snapshot.overdue).toBe(false);
    expect(snapshot.daysSinceAny).toBe(1);
  });

  it("favors variety by recommending an option not done recently", () => {
    const snapshot = buildMovementSnapshot(
      [
        { activity: "walk", happenedOn: "2026-09-08" },
        { activity: "run", happenedOn: "2026-09-07" },
        { activity: "swim", happenedOn: "2026-08-20" },
      ],
      "2026-09-08",
      2
    );
    expect(snapshot.recommendation.id).toBe("skate");
  });

  it("formats recency without shame language", () => {
    expect(movementRecencyLabel(null)).toBe("not lately");
    expect(movementRecencyLabel(0)).toBe("today");
    expect(movementRecencyLabel(1)).toBe("yesterday");
    expect(movementRecencyLabel(4)).toBe("4d ago");
  });
});

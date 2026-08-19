import { describe, expect, it } from "vitest";
import {
  toGoogleTask,
  fromGoogleTask,
  withMarker,
  stripMarker,
  isMarked,
  localDateToGoogleDue,
  googleDueToLocalDate,
  resolveSyncConflict,
  summarize,
  NOTES_MARKER,
} from "./google-sync";

const task = {
  id: "t1",
  title: "Pay credit card",
  notes: "Call bank first",
  scheduled_date: "2026-08-20",
  status: "today",
  domain: { slug: "money", title: "Money" },
  project: { title: "Debt payoff" },
  updated_at: "2026-08-19T10:00:00.000Z",
};

describe("marker handling", () => {
  it("prepends the marker to notes", () => {
    expect(withMarker(task.notes)).toBe(`${NOTES_MARKER} Call bank first`);
  });

  it("returns just the marker when notes are empty", () => {
    expect(withMarker(null)).toBe(NOTES_MARKER);
    expect(withMarker("  ")).toBe(NOTES_MARKER);
  });

  it("strips the marker when parsing back", () => {
    expect(stripMarker(`${NOTES_MARKER} Call bank first`)).toBe("Call bank first");
  });

  it("detects marked notes case-insensitively", () => {
    expect(isMarked("[year mission] hi")).toBe(true);
    expect(isMarked("plain")).toBe(false);
    expect(isMarked(null)).toBe(false);
  });
});

describe("date conversion", () => {
  it("converts a local date to an RFC3339 due", () => {
    expect(localDateToGoogleDue("2026-08-20")).toBe("2026-08-20T00:00:00.000Z");
  });

  it("returns null for empty local dates", () => {
    expect(localDateToGoogleDue(null)).toBeNull();
    expect(localDateToGoogleDue("")).toBeNull();
  });

  it("converts a Google due back to a local date", () => {
    expect(googleDueToLocalDate("2026-08-20T00:00:00.000Z")).toBe("2026-08-20");
    expect(googleDueToLocalDate("2026-08-20")).toBe("2026-08-20");
  });

  it("returns null for malformed due dates", () => {
    expect(googleDueToLocalDate("nope")).toBeNull();
  });
});

describe("task mapping", () => {
  it("maps a local task to a simplified Google task", () => {
    const gt = toGoogleTask(task);
    expect(gt.title).toBe("Pay credit card");
    expect(gt.notes).toContain("Money");
    expect(gt.notes).toContain("Project: Debt payoff");
    expect(gt.notes).toContain("Call bank first");
    expect(gt.due).toBe("2026-08-20T00:00:00.000Z");
    expect(gt.status).toBe("needsAction");
  });

  it("marks completed tasks as completed", () => {
    expect(toGoogleTask({ ...task, status: "completed" }).status).toBe("completed");
  });

  it("maps a Google task back to local fields without the marker", () => {
    const local = fromGoogleTask({
      id: "g1",
      title: "Pay credit card",
      notes: `${NOTES_MARKER} Money · Project: Debt payoff\n\nCall bank first`,
      due: "2026-08-20T00:00:00.000Z",
      status: "completed",
      updated: "2026-08-21T00:00:00.000Z",
    });
    expect(local.title).toBe("Pay credit card");
    expect(local.notes).toBe("Money · Project: Debt payoff\n\nCall bank first");
    expect(local.scheduled_date).toBe("2026-08-20");
    expect(local.completed).toBe(true);
  });

  it("uses due_date when scheduled_date is missing", () => {
    const gt = toGoogleTask({ ...task, scheduled_date: null, due_date: "2026-09-01" });
    expect(gt.due).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("conflict resolution", () => {
  it("prefers the newer side", () => {
    expect(resolveSyncConflict("2026-08-19T10:00:00.000Z", "2026-08-20T10:00:00.000Z")).toBe("google");
    expect(resolveSyncConflict("2026-08-20T10:00:00.000Z", "2026-08-19T10:00:00.000Z")).toBe("local");
  });

  it("prefers local on a tie by default", () => {
    expect(resolveSyncConflict("2026-08-20T10:00:00.000Z", "2026-08-20T10:00:00.000Z")).toBe("local");
  });

  it("can prefer google on a tie when configured", () => {
    expect(resolveSyncConflict("2026-08-20T10:00:00.000Z", "2026-08-20T10:00:00.000Z", false)).toBe("google");
  });

  it("treats missing timestamps as zero", () => {
    expect(resolveSyncConflict(null, "2026-08-20T10:00:00.000Z")).toBe("google");
    expect(resolveSyncConflict("2026-08-20T10:00:00.000Z", null)).toBe("local");
    expect(resolveSyncConflict(null, null)).toBe("local");
  });
});

describe("summary", () => {
  it("counts actions by type", () => {
    const summary = summarize([
      { action: "pull" },
      { action: "push" },
      { action: "update" },
      { action: "conflict" },
      { action: "update" },
    ]);
    expect(summary).toEqual({ pulled: 1, pushed: 1, updated: 2, conflicts: 1 });
  });
});
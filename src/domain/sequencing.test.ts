import { describe, it, expect } from "vitest";
import { sequenceTasks, daysUntil } from "./sequencing";
import type { Task } from "@/types/models";
import type { EnergyLevel } from "./sequencing";

const now = new Date("2026-08-19T12:00:00Z");

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    user_id: "u1",
    project_id: null,
    domain_id: null,
    title: "Some task",
    notes: null,
    status: "this_week",
    estimated_minutes: 30,
    impact: "medium",
    priority: "medium",
    scheduled_date: null,
    due_date: null,
    weekly_commitment: false,
    weekly_win: false,
    defer_count: 0,
    courage_task: false,
    meta_work: false,
    source: "manual",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    completed_at: null,
    domain: null,
    ...overrides,
  };
}

describe("daysUntil", () => {
  it("computes whole-day deltas against a reference date", () => {
    expect(daysUntil("2026-08-20", new Date("2026-08-19T12:00:00Z"))).toBe(1);
    expect(daysUntil("2026-08-16", new Date("2026-08-19T12:00:00Z"))).toBe(-3);
    expect(daysUntil(null, now)).toBeNull();
  });
});

describe("Weekly Win priority", () => {
  it("ranks the Weekly Win above all other active tasks", () => {
    const win = task({ id: "win", title: "Clear garage workbench", weekly_win: true });
    const other = task({ id: "other", title: "Normal task", impact: "high", estimated_minutes: 90 });
    const result = sequenceTasks({ candidates: [other, win], now });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("win");
      expect(result.task.reasons.some((r) => r.code === "weekly_win")).toBe(true);
    }
  });

  it("explains the Weekly Win reason in Why This", () => {
    const win = task({ id: "win", weekly_win: true });
    const result = sequenceTasks({ candidates: [win], now });
    if (result.kind === "task") {
      expect(result.task.reasons.map((r) => r.code)).toContain("weekly_win");
    }
  });
});

describe("time-sensitive obligations", () => {
  it("prefers a task due soon over monthly-focus work", () => {
    const due = task({ id: "due", title: "Pay bill", due_date: "2026-08-20" });
    const focus = task({ id: "focus", domain_id: "d-home" });
    const result = sequenceTasks({
      candidates: [focus, due],
      now,
      monthlyFocusDomainIds: ["d-home"],
    });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("due");
  });

  it("flags overdue tasks as overdue", () => {
    const overdue = task({ id: "o", title: "Call creditor", due_date: "2026-08-10" });
    const result = sequenceTasks({ candidates: [overdue], now });
    if (result.kind === "task") {
      expect(result.task.reasons.some((r) => r.code === "overdue")).toBe(true);
    }
  });

  it("ignores due dates far in the future for prioritization", () => {
    const far = task({ id: "far", due_date: "2026-12-01" });
    const other = task({ id: "other", title: "Other work", impact: "high" });
    const result = sequenceTasks({ candidates: [far, other], now });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("other");
  });
});

describe("monthly focus", () => {
  it("prioritizes tasks aligned with the current focus", () => {
    const focus = task({ id: "focus", domain_id: "d-home", title: "Sort garage" });
    const other = task({ id: "other", title: "Random task", impact: "high" });
    const result = sequenceTasks({
      candidates: [other, focus],
      now,
      monthlyFocusDomainIds: ["d-home"],
      monthlyFocusTitle: "House / Decluttering",
    });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("focus");
      expect(result.task.reasons.some((r) => r.code === "monthly_focus")).toBe(true);
    }
  });

  it("matches the focus by domain id only", () => {
    const focus = task({ id: "focus", domain_id: "d-body", title: "Gym session" });
    const result = sequenceTasks({ candidates: [focus], now, monthlyFocusDomainIds: ["d-money"] });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("focus");
  });
});

describe("Big Four gaps", () => {
  it("fills an open Big Four commitment before other work", () => {
    const gap = task({ id: "gap", domain_id: "d-body", domain: { slug: "body", title: "Body" }, title: "Workout" });
    const other = task({ id: "other", title: "Random", impact: "high" });
    const result = sequenceTasks({
      candidates: [other, gap],
      now,
      bigFourOpenSlugs: ["body"],
    });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("gap");
      expect(result.task.reasons.some((r) => r.code === "big_four")).toBe(true);
    }
  });

  it("does not fill a Big Four slot that is already met", () => {
    const bodyTask = task({ id: "b", domain_id: "d-body", domain: { slug: "body", title: "Body" } });
    const other = task({ id: "other", title: "Other", impact: "high" });
    const result = sequenceTasks({ candidates: [bodyTask, other], now, bigFourOpenSlugs: [] });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("other");
  });
});

describe("repeatedly deferred tasks", () => {
  it("promotes a task deferred twice above other work", () => {
    const deferred = task({ id: "d", title: "Fill donation box", defer_count: 2 });
    const other = task({ id: "other", title: "Normal", impact: "high" });
    const result = sequenceTasks({ candidates: [other, deferred], now });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("d");
      expect(result.task.reasons.some((r) => r.code === "deferred")).toBe(true);
    }
  });

  it("does not reorder by a single deferral alone", () => {
    const deferredOnce = task({ id: "d", defer_count: 1, impact: "high", estimated_minutes: 90 });
    const other = task({ id: "other", impact: "medium", estimated_minutes: 20 });
    const result = sequenceTasks({ candidates: [deferredOnce, other], now });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("d");
      expect(result.task.tier).toBe(6);
    }
  });
});

describe("blocker exclusion", () => {
  it("excludes a task with an active blocker", () => {
    const blocked = task({ id: "blocked", weekly_win: true });
    const other = task({ id: "other" });
    const result = sequenceTasks({ candidates: [blocked, other], now, blockedTaskIds: ["blocked"] });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("other");
  });

  it("does not claim a task is blocked when it is not", () => {
    const fine = task({ id: "fine" });
    const result = sequenceTasks({ candidates: [fine], now });
    if (result.kind === "task") {
      expect(result.task.reasons.some((r) => r.code === "no_blocker")).toBe(true);
    }
  });
});

describe("available-time filtering", () => {
  it("excludes tasks that exceed available time", () => {
    const big = task({ id: "big", title: "Two-hour project", estimated_minutes: 120 });
    const small = task({ id: "small", title: "Quick task", estimated_minutes: 15 });
    const result = sequenceTasks({ candidates: [big, small], now, availableMinutes: 20 });
    expect(result.kind).toBe("task");
    if (result.kind === "task") {
      expect(result.task.task.id).toBe("small");
      expect(result.task.reasons.some((r) => r.code === "fits_time")).toBe(true);
    }
  });

  it("falls back to a floor when nothing fits", () => {
    const big = task({ id: "big", estimated_minutes: 120 });
    const result = sequenceTasks({ candidates: [big], now, availableMinutes: 10, bigFourOpenSlugs: ["body"] });
    expect(result.kind).toBe("floor");
    if (result.kind === "floor") expect(result.label).toMatch(/10-minute walk/);
  });
});

describe("energy filtering", () => {
  it("skips deep tasks when energy is low", () => {
    const deep = task({ id: "deep", weekly_win: true, estimated_minutes: 90 });
    const light = task({ id: "light", estimated_minutes: 20 });
    const result = sequenceTasks({ candidates: [deep, light], now, energy: "low" as EnergyLevel });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("light");
  });

  it("reports when a task suits current energy", () => {
    const fine = task({ id: "fine", estimated_minutes: 20 });
    const result = sequenceTasks({ candidates: [fine], now, energy: "medium" as EnergyLevel });
    if (result.kind === "task") {
      expect(result.task.reasons.some((r) => r.code === "good_energy")).toBe(true);
    }
  });
});

describe("week modes", () => {
  it("recovery mode avoids deep tasks", () => {
    const deep = task({ id: "deep", estimated_minutes: 90 });
    const light = task({ id: "light", estimated_minutes: 10 });
    const result = sequenceTasks({ candidates: [deep, light], now, weekMode: "recovery" });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("light");
  });

  it("maintenance mode protects only the core system", () => {
    const core = task({ id: "core", weekly_win: true, title: "Weekly Win" });
    const extra = task({ id: "extra", title: "New idea" });
    const result = sequenceTasks({ candidates: [extra, core], now, weekMode: "maintenance" });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("core");
  });
});

describe("floor fallback", () => {
  it("suggests a domain floor based on the open Big Four gap", () => {
    const result = sequenceTasks({ candidates: [], now, bigFourOpenSlugs: ["home"] });
    expect(result.kind).toBe("floor");
    if (result.kind === "floor") expect(result.label).toMatch(/Home/);
  });

  it("suggests the minimum day when no domain gap is open", () => {
    const result = sequenceTasks({ candidates: [], now, bigFourOpenSlugs: [] });
    expect(result.kind).toBe("floor");
    if (result.kind === "floor") expect(result.label).toMatch(/10-minute walk/);
  });
});

describe("exclude task", () => {
  it("returns a different recommendation when asked", () => {
    const a = task({ id: "a", title: "First" });
    const b = task({ id: "b", title: "Second" });
    const result = sequenceTasks({ candidates: [a, b], now, excludeTaskId: "a" });
    expect(result.kind).toBe("task");
    if (result.kind === "task") expect(result.task.task.id).toBe("b");
  });
});

import { describe, it, expect } from "vitest";
import { validateAiAction, requiresApproval } from "./ai-actions";

describe("AI action validation", () => {
  it("accepts a valid create_task", () => {
    const result = validateAiAction({
      action: "create_task",
      payload: { title: "Call Citi about lowering APR", domain: "money" },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a task with an empty title", () => {
    const result = validateAiAction({ action: "create_task", payload: { title: "" } });
    expect(result.ok).toBe(false);
  });

  it("rejects unknown action types", () => {
    const result = validateAiAction({ action: "drop_all_tasks", payload: {} });
    expect(result.ok).toBe(false);
  });

  it("requires task_id on reschedule", () => {
    const result = validateAiAction({ action: "reschedule_task", new_date: "2026-08-21" });
    expect(result.ok).toBe(false);
  });

  it("marks destructive/meaningful actions as requiring approval", () => {
    expect(requiresApproval("change_task_status")).toBe(true);
    expect(requiresApproval("decompose_task")).toBe(true);
    expect(requiresApproval("create_task")).toBe(false);
    expect(requiresApproval("reschedule_task")).toBe(false);
  });

  it("validates decompose produces 2-6 sub-tasks", () => {
    const result = validateAiAction({
      action: "decompose_task",
      task_id: "abc",
      sub_tasks: [{ title: "one" }],
    });
    expect(result.ok).toBe(false);
  });
});
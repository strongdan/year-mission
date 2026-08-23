import { describe, expect, it } from "vitest";
import {
  DEFAULT_EQUIPMENT,
  MOBILITY_PROTOCOLS,
  WORKOUT_PROTOCOLS,
  chooseExercise,
  equipmentFits,
  executionLaunchForTask,
} from "./execution-protocols";

describe("execution protocols", () => {
  it("requires every listed piece of equipment", () => {
    expect(equipmentFits(["dumbbells", "bench"], ["dumbbells", "bench", "bands"])).toBe(true);
    expect(equipmentFits(["dumbbells", "bench"], ["dumbbells"])).toBe(false);
  });

  it("keeps the preferred exercise when its equipment is available", () => {
    const exercise = WORKOUT_PROTOCOLS["strength-a"].exercises[1];
    expect(chooseExercise(exercise, ["dumbbells", "bench"])).toMatchObject({
      title: "Dumbbell bench press",
      reps: "8–12",
      substituted: false,
    });
  });

  it("chooses the first compatible alternative and its rep target", () => {
    const exercise = WORKOUT_PROTOCOLS["strength-a"].exercises[1];
    expect(chooseExercise(exercise, ["bodyweight"])).toMatchObject({
      title: "Push-up",
      reps: "6–15",
      substituted: true,
    });
  });

  it("does not silently pretend an incompatible movement is runnable", () => {
    const exercise = WORKOUT_PROTOCOLS["strength-a"].exercises[0];
    const result = chooseExercise(exercise, []);
    expect(result.substituted).toBe(false);
    expect(result.note).toContain("No compatible alternative");
  });

  it("keeps every default workout runnable with the default equipment profile", () => {
    for (const workout of Object.values(WORKOUT_PROTOCOLS)) {
      for (const exercise of workout.exercises) {
        expect(chooseExercise(exercise, DEFAULT_EQUIPMENT).note).not.toContain("No compatible alternative");
      }
    }
  });

  it("keeps protocol identifiers unique and timing values positive", () => {
    for (const workout of Object.values(WORKOUT_PROTOCOLS)) {
      expect(workout.slug).toBeTruthy();
      expect(workout.estimatedMinutes).toBeGreaterThan(0);
      expect(new Set(workout.exercises.map((exercise) => exercise.id)).size).toBe(workout.exercises.length);
      for (const exercise of workout.exercises) {
        expect(exercise.sets).toBeGreaterThan(0);
        expect(exercise.restSeconds).toBeGreaterThan(0);
      }
    }
    for (const mobility of Object.values(MOBILITY_PROTOCOLS)) {
      expect(new Set(mobility.steps.map((step) => step.id)).size).toBe(mobility.steps.length);
      expect(mobility.steps.every((step) => step.durationSeconds > 0)).toBe(true);
    }
  });

  it("routes runnable task language to the correct launcher", () => {
    expect(executionLaunchForTask({ id: "task 1", title: "Evening reset" })?.href).toBe("/execute/evening-reset?taskId=task%201");
    expect(executionLaunchForTask({ id: "2", title: "Stretch tonight" })?.href).toBe("/execute/evening-mobility?taskId=2");
    expect(executionLaunchForTask({ id: "3", title: "Meditate" })?.href).toBe("/execute/meditation?minutes=5&taskId=3");
    expect(executionLaunchForTask({ id: "4", title: "Listen to self-hypnosis" })?.href).toBe("/execute/hypnosis?taskId=4");
    expect(executionLaunchForTask({ id: "5", title: "Lift weights" })?.href).toBe("/execute/strength-a?taskId=5");
  });

  it("only treats generic workout language as strength when it belongs to Body", () => {
    expect(executionLaunchForTask({ id: "1", title: "Workout", domain: { slug: "body" } })?.label).toBe("Start workout");
    expect(executionLaunchForTask({ id: "2", title: "Workout budget", domain: { slug: "money" } })).toBeNull();
  });
});

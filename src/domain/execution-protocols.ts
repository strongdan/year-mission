export type EquipmentId =
  | "bodyweight"
  | "dumbbells"
  | "bench"
  | "bands"
  | "pull_up_bar"
  | "barbell"
  | "rack"
  | "cable_machine";

export interface ExerciseAlternative {
  title: string;
  equipment: EquipmentId[];
  reps?: string;
  note?: string;
}

export interface ExerciseStep {
  id: string;
  title: string;
  sets: number;
  reps: string;
  restSeconds: number;
  equipment: EquipmentId[];
  cue: string;
  alternatives: ExerciseAlternative[];
}

export interface WorkoutProtocol {
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  exercises: ExerciseStep[];
}

export interface MobilityStep {
  id: string;
  title: string;
  durationSeconds: number;
  cue: string;
}

export interface MobilityProtocol {
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: MobilityStep[];
}

export const EQUIPMENT_OPTIONS: { id: EquipmentId; label: string }[] = [
  { id: "bodyweight", label: "Bodyweight / floor space" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "bench", label: "Bench" },
  { id: "bands", label: "Resistance bands" },
  { id: "pull_up_bar", label: "Pull-up bar" },
  { id: "barbell", label: "Barbell" },
  { id: "rack", label: "Rack" },
  { id: "cable_machine", label: "Cable machine" },
];

export const DEFAULT_EQUIPMENT: EquipmentId[] = ["bodyweight", "dumbbells", "bench", "bands"];

export const WORKOUT_PROTOCOLS: Record<string, WorkoutProtocol> = {
  "strength-a": {
    slug: "strength-a",
    title: "Strength A",
    description: "Simple full-body strength session with automatic substitutions.",
    estimatedMinutes: 32,
    exercises: [
      {
        id: "goblet-squat",
        title: "Goblet squat",
        sets: 3,
        reps: "8–10",
        restSeconds: 90,
        equipment: ["dumbbells"],
        cue: "Brace, sit between the hips, and finish each rep tall.",
        alternatives: [
          { title: "Bodyweight squat", equipment: ["bodyweight"], reps: "12–15" },
          { title: "Split squat", equipment: ["bodyweight"], reps: "8–10 / side" },
        ],
      },
      {
        id: "db-bench",
        title: "Dumbbell bench press",
        sets: 3,
        reps: "8–12",
        restSeconds: 90,
        equipment: ["dumbbells", "bench"],
        cue: "Shoulder blades back, steady descent, press without bouncing.",
        alternatives: [
          { title: "Dumbbell floor press", equipment: ["dumbbells"], reps: "8–12" },
          { title: "Push-up", equipment: ["bodyweight"], reps: "6–15" },
        ],
      },
      {
        id: "one-arm-row",
        title: "One-arm dumbbell row",
        sets: 3,
        reps: "10 / side",
        restSeconds: 75,
        equipment: ["dumbbells"],
        cue: "Keep the torso quiet and pull the elbow toward the back pocket.",
        alternatives: [
          { title: "Band row", equipment: ["bands"], reps: "12–15" },
          { title: "Prone Y-T-W", equipment: ["bodyweight"], reps: "8 each" },
        ],
      },
      {
        id: "rdl",
        title: "Dumbbell Romanian deadlift",
        sets: 3,
        reps: "8–12",
        restSeconds: 90,
        equipment: ["dumbbells"],
        cue: "Push hips back, keep the load close, stop when the hamstrings limit you.",
        alternatives: [
          { title: "Glute bridge", equipment: ["bodyweight"], reps: "12–15" },
          { title: "Band good morning", equipment: ["bands"], reps: "12–15" },
        ],
      },
      {
        id: "overhead-press",
        title: "Dumbbell overhead press",
        sets: 2,
        reps: "8–12",
        restSeconds: 75,
        equipment: ["dumbbells"],
        cue: "Ribs down, press smoothly, finish with the arms beside the ears.",
        alternatives: [
          { title: "Band overhead press", equipment: ["bands"], reps: "10–15" },
          { title: "Pike push-up", equipment: ["bodyweight"], reps: "5–10" },
        ],
      },
    ],
  },
  "strength-b": {
    slug: "strength-b",
    title: "Strength B",
    description: "Second full-body session so two weekly lifts do not feel identical.",
    estimatedMinutes: 31,
    exercises: [
      {
        id: "reverse-lunge",
        title: "Dumbbell reverse lunge",
        sets: 3,
        reps: "8 / side",
        restSeconds: 90,
        equipment: ["dumbbells"],
        cue: "Step back quietly, keep the front foot planted, drive through the whole foot.",
        alternatives: [
          { title: "Bodyweight reverse lunge", equipment: ["bodyweight"], reps: "10 / side" },
          { title: "Supported split squat", equipment: ["bodyweight"], reps: "8–10 / side" },
        ],
      },
      {
        id: "push-up",
        title: "Push-up",
        sets: 3,
        reps: "6–15",
        restSeconds: 75,
        equipment: ["bodyweight"],
        cue: "Move as one piece; elevate hands if clean reps are difficult.",
        alternatives: [
          { title: "Dumbbell floor press", equipment: ["dumbbells"], reps: "8–12" },
          { title: "Dumbbell bench press", equipment: ["dumbbells", "bench"], reps: "8–12" },
        ],
      },
      {
        id: "band-pulldown",
        title: "Band pulldown",
        sets: 3,
        reps: "10–15",
        restSeconds: 75,
        equipment: ["bands"],
        cue: "Pull elbows toward the ribs without shrugging.",
        alternatives: [
          { title: "Assisted pull-up", equipment: ["pull_up_bar", "bands"], reps: "4–8" },
          { title: "One-arm dumbbell row", equipment: ["dumbbells"], reps: "10 / side" },
        ],
      },
      {
        id: "hip-thrust",
        title: "Dumbbell hip thrust",
        sets: 3,
        reps: "10–15",
        restSeconds: 75,
        equipment: ["dumbbells", "bench"],
        cue: "Finish with glutes, not a low-back arch.",
        alternatives: [
          { title: "Glute bridge", equipment: ["bodyweight"], reps: "15" },
          { title: "Band glute bridge", equipment: ["bands"], reps: "12–15" },
        ],
      },
      {
        id: "carry",
        title: "Suitcase carry",
        sets: 2,
        reps: "40–60 sec / side",
        restSeconds: 60,
        equipment: ["dumbbells"],
        cue: "Stand tall and resist leaning toward the weight.",
        alternatives: [
          { title: "Side plank", equipment: ["bodyweight"], reps: "20–40 sec / side" },
          { title: "Dead bug", equipment: ["bodyweight"], reps: "8 / side" },
        ],
      },
    ],
  },
  "strength-quick": {
    slug: "strength-quick",
    title: "Quick Strength",
    description: "A minimum viable lift for a crowded day.",
    estimatedMinutes: 15,
    exercises: [
      {
        id: "quick-squat",
        title: "Goblet squat",
        sets: 2,
        reps: "10",
        restSeconds: 60,
        equipment: ["dumbbells"],
        cue: "Smooth reps. Stop with one or two good reps left.",
        alternatives: [{ title: "Bodyweight squat", equipment: ["bodyweight"], reps: "15" }],
      },
      {
        id: "quick-push",
        title: "Push-up",
        sets: 2,
        reps: "6–15",
        restSeconds: 60,
        equipment: ["bodyweight"],
        cue: "Use an incline if needed to keep every rep clean.",
        alternatives: [{ title: "Dumbbell floor press", equipment: ["dumbbells"], reps: "10" }],
      },
      {
        id: "quick-row",
        title: "One-arm dumbbell row",
        sets: 2,
        reps: "10 / side",
        restSeconds: 60,
        equipment: ["dumbbells"],
        cue: "Pull with the back; keep the torso quiet.",
        alternatives: [{ title: "Band row", equipment: ["bands"], reps: "15" }],
      },
    ],
  },
};

export const MOBILITY_PROTOCOLS: Record<string, MobilityProtocol> = {
  "evening-mobility": {
    slug: "evening-mobility",
    title: "Evening Mobility",
    description: "A guided sequence. No deciding what to stretch and no separate timer.",
    estimatedMinutes: 8,
    steps: [
      { id: "hips-90-90", title: "90/90 hip switches", durationSeconds: 60, cue: "Move slowly and stay in an easy range." },
      { id: "hip-flexor-left", title: "Hip flexor · left", durationSeconds: 45, cue: "Tuck the pelvis slightly; do not chase a huge stretch." },
      { id: "hip-flexor-right", title: "Hip flexor · right", durationSeconds: 45, cue: "Breathe out and let the front of the hip soften." },
      { id: "hamstring-left", title: "Hamstring · left", durationSeconds: 45, cue: "Hinge forward with a long spine." },
      { id: "hamstring-right", title: "Hamstring · right", durationSeconds: 45, cue: "Keep the sensation mild enough to breathe normally." },
      { id: "open-book-left", title: "Open book · left", durationSeconds: 45, cue: "Let the upper back rotate; keep the knees stacked." },
      { id: "open-book-right", title: "Open book · right", durationSeconds: 45, cue: "Follow the hand with the eyes without forcing range." },
      { id: "doorway-chest", title: "Doorway chest stretch", durationSeconds: 60, cue: "Keep the shoulder down and turn away gently." },
      { id: "childs-pose", title: "Child's pose", durationSeconds: 60, cue: "Relax the jaw and let the breath widen the back ribs." },
      { id: "slow-breathing", title: "Slow breathing", durationSeconds: 60, cue: "Easy inhale. Slightly longer exhale. Nothing to force." },
    ],
  },
};

export function equipmentFits(required: EquipmentId[], available: EquipmentId[]): boolean {
  return required.every((item) => available.includes(item));
}

export function chooseExercise(
  exercise: ExerciseStep,
  available: EquipmentId[]
): { title: string; reps: string; note?: string; substituted: boolean } {
  if (equipmentFits(exercise.equipment, available)) {
    return { title: exercise.title, reps: exercise.reps, substituted: false };
  }
  const alternative = exercise.alternatives.find((item) => equipmentFits(item.equipment, available));
  if (alternative) {
    return {
      title: alternative.title,
      reps: alternative.reps ?? exercise.reps,
      note: alternative.note,
      substituted: true,
    };
  }
  return { title: exercise.title, reps: exercise.reps, note: "No compatible alternative is configured yet.", substituted: false };
}

export interface ExecutionLaunch {
  href: string;
  label: string;
  detail: string;
}

export function executionLaunchForTask(task: { id: string; title: string; domain?: { slug: string } | null }): ExecutionLaunch | null {
  const title = task.title.toLowerCase();
  const withTask = (path: string) => `${path}${path.includes("?") ? "&" : "?"}taskId=${encodeURIComponent(task.id)}`;

  if (/evening reset|night routine|wind.?down/.test(title)) {
    return { href: withTask("/execute/evening-reset"), label: "Start evening routine", detail: "Stretch → meditate → hypnosis" };
  }
  if (/stretch|mobility/.test(title)) {
    return { href: withTask("/execute/evening-mobility"), label: "Start mobility", detail: "8 min guided sequence" };
  }
  if (/meditat|mindful|breath/.test(title)) {
    return { href: withTask("/execute/meditation?minutes=5"), label: "Start meditation", detail: "5 min · timer included" };
  }
  if (/hypno|self.?hypnosis/.test(title)) {
    return { href: withTask("/execute/hypnosis"), label: "Open hypnosis", detail: "Play or resume a saved track" };
  }
  if (/lift|strength|weights|weight training|resistance training/.test(title) || (task.domain?.slug === "body" && /workout/.test(title))) {
    return { href: withTask("/execute/strength-a"), label: "Start workout", detail: "Strength A · ~32 min" };
  }
  return null;
}

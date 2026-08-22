export type EveningResetCompletion = "target" | "floor" | "skipped";

export interface EveningResetVariant {
  name: string;
  theme: string;
  targetDuration: string;
  floorDuration: string;
  sequence?: string[];
  focus?: string[];
  characteristics?: string[];
}

export function getEveningResetForDate(date: Date): EveningResetVariant {
  return getEveningResetForWeekday(date.getDay());
}

export function getEveningResetForWeekday(weekdayIndex: number): EveningResetVariant {
  // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  switch (weekdayIndex) {
    case 1: // Monday
    case 3: // Wednesday
    case 5: // Friday
      return {
        name: "Down-Regulation",
        theme: "Down-Regulation",
        targetDuration: "20–30 minutes",
        floorDuration: "5 minutes",
        sequence: ["Slow breathing (5–10 min)", "Meditation (5–10 min)", "Hypnosis (10–20 min)"]
      };
    case 2: // Tuesday
      return {
        name: "Lower Body Reset",
        theme: "Lower Body Reset",
        targetDuration: "15–25 minutes",
        floorDuration: "5 minutes",
        focus: ["hip flexors", "hamstrings", "glutes", "adductors", "calves", "ankle mobility"]
      };
    case 4: // Thursday
      return {
        name: "Upper Body + Spine",
        theme: "Upper Body + Spine",
        targetDuration: "15–25 minutes",
        floorDuration: "5 minutes",
        focus: ["shoulders", "pecs", "lats", "thoracic rotation", "thoracic extension", "neck", "upper back"]
      };
    case 6: // Saturday
      return {
        name: "Yoga Flow",
        theme: "Yoga Flow",
        targetDuration: "20–40 minutes",
        floorDuration: "5 minutes",
        characteristics: ["gentle", "full body", "varied", "fluid", "may include balance"]
      };
    case 0: // Sunday
      return {
        name: "Restore",
        theme: "Restore",
        targetDuration: "10–30 minutes",
        floorDuration: "5 minutes",
        characteristics: [
          "slower",
          "restorative",
          "longer comfortable holds",
          "gentle spinal rotation",
          "hips/back",
          "hamstrings",
          "child's pose",
          "figure-four",
          "legs-up-the-wall if desired"
        ]
      };
    default:
      throw new Error(`Invalid weekday index: ${weekdayIndex}`);
  }
}

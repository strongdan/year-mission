export interface SleepAnchor {
  id: string;
  period: "morning" | "day" | "evening" | "bedroom";
  title: string;
  detail: string;
  priority: "core" | "optional";
}

export const SLEEP_ANCHORS: SleepAnchor[] = [
  {
    id: "fixed-wake",
    period: "morning",
    title: "Protect the wake time",
    detail: "Keep your wake time reasonably consistent, including after a rough night. The morning anchor matters more than chasing a perfect bedtime.",
    priority: "core",
  },
  {
    id: "morning-light",
    period: "morning",
    title: "Get outdoor daylight",
    detail: "Use outdoor daylight after waking when practical. If it is still dark, use the first practical daylight later rather than staring into bright light or the sun.",
    priority: "core",
  },
  {
    id: "caffeine-buffer",
    period: "day",
    title: "Keep caffeine well away from bedtime",
    detail: "A practical default is to stop roughly 8 hours before intended sleep. Earlier may be useful if you are sensitive; do not turn the exact cutoff into a purity test.",
    priority: "core",
  },
  {
    id: "substances",
    period: "day",
    title: "Do not use substances as sleep tools",
    detail: "Alcohol can fragment sleep, and nicotine is stimulating. Avoid relying on alcohol, cannabis, or nicotine to make sleep happen.",
    priority: "core",
  },
  {
    id: "dim-evening",
    period: "evening",
    title: "Dim the evening",
    detail: "Lower overhead and screen brightness during the last hour or two before bed. The goal is a calmer light environment, not zero technology.",
    priority: "core",
  },
  {
    id: "hot-bath",
    period: "evening",
    title: "Warm up before cooling down",
    detail: "A warm shower or bath before bed can be a useful wind-down cue and may help the body cool afterward.",
    priority: "optional",
  },
  {
    id: "cool-dark",
    period: "bedroom",
    title: "Make the room cool, dark, and quiet",
    detail: "Use a comfortably cool room, blackout curtains or an eye mask if needed, and cover distracting LEDs. Do not chase an exact thermostat number if it makes you uncomfortable.",
    priority: "core",
  },
  {
    id: "bed-is-for-sleep",
    period: "bedroom",
    title: "Keep the bed associated with sleep",
    detail: "Avoid long stretches of scrolling, work, or frustrated wakefulness in bed. Strengthen the bed = sleep association.",
    priority: "core",
  },
];

export const AWAKE_AT_NIGHT_STEPS = [
  {
    id: "dont-clock-watch",
    title: "Stop checking the time",
    detail: "Estimate rather than clock-watch. Watching the minutes pass usually adds arousal instead of useful information.",
  },
  {
    id: "leave-bed",
    title: "If you feel awake for about 20 minutes, leave the bed",
    detail: "Move somewhere dim and comfortable. Return only when you feel sleepy again.",
  },
  {
    id: "quiet-activity",
    title: "Do something boring and low-light",
    detail: "Read a dull paper book, sit quietly, or use a gentle relaxation practice. Avoid work, news, stimulating video, and bright light.",
  },
  {
    id: "relaxation",
    title: "Use a body-based downshift if useful",
    detail: "Try slow comfortable breathing, NSDR/yoga-nidra-style relaxation, or a familiar meditation. The aim is rest, not forcing unconsciousness.",
  },
  {
    id: "return-sleepy",
    title: "Return when sleepy",
    detail: "Repeat the cycle if needed. Keep the normal wake time the next morning rather than turning one bad night into a shifted schedule.",
  },
] as const;

export function sleepCueForHour(hour: number) {
  const normalized = Math.min(23, Math.max(0, Math.trunc(hour)));
  if (normalized < 11) {
    return {
      title: "Sleep starts with the morning",
      detail: "Protect wake time and get outdoor daylight when practical.",
      href: "/execute/morning-outdoor-light",
      action: "Morning light",
    };
  }
  if (normalized < 17) {
    return {
      title: "Protect tonight from the afternoon",
      detail: "Keep caffeine well away from bedtime and get some ordinary movement.",
      href: "/execute/post-meal-walk",
      action: "Take a walk",
    };
  }
  return {
    title: "Start the descent",
    detail: "Dim the environment, reduce stimulation, and let the existing evening reset carry you toward sleep.",
    href: "/execute/sleep-wind-down",
    action: "Sleep wind-down",
  };
}


export interface OptionalSleepTool {
  id: "warm-bath" | "exercise-timing" | "nsdr" | "temperature-minimum" | "supplements";
  title: string;
  detail: string;
  evidence: "supported" | "promising" | "mixed" | "advanced";
  actionLabel?: string;
  href?: string;
}

export const OPTIONAL_SLEEP_TOOLS: OptionalSleepTool[] = [
  {
    id: "warm-bath",
    title: "Warm shower or bath",
    detail: "Try it roughly 1–2 hours before bed if it feels relaxing. Passive warming can support the later drop in body temperature, but it is optional rather than a nightly requirement.",
    evidence: "supported",
  },
  {
    id: "exercise-timing",
    title: "Exercise timing",
    detail: "Keep regular exercise wherever it is easiest to sustain. If hard late workouts reliably disturb your sleep, finish them earlier or make late sessions lighter; there is no universal rule that evening exercise is bad.",
    evidence: "supported",
  },
  {
    id: "nsdr",
    title: "NSDR / yoga nidra-style rest",
    detail: "Use guided deep relaxation as a rest or downshift tool when useful. It may help sleep and stress, but current insomnia evidence is still preliminary and it does not replace adequate sleep.",
    evidence: "promising",
    actionLabel: "Try 10-minute body scan",
    href: "/execute/meditation?minutes=10",
  },
  {
    id: "temperature-minimum",
    title: "Temperature-minimum timing",
    detail: "Treat this as an advanced circadian-shifting concept for travel or schedule changes, not a daily optimization target. Year Mission should not ask you to calculate it during ordinary weeks.",
    evidence: "advanced",
  },
  {
    id: "supplements",
    title: "Sleep supplements",
    detail: "Not part of the default protocol. Evidence for commonly promoted sleep supplements varies, interactions matter, and the app should not turn a supplement stack into a nightly checklist. Magnesium evidence for insomnia remains mixed and low-certainty.",
    evidence: "mixed",
  },
];

export function sleepToolEvidenceLabel(value: OptionalSleepTool["evidence"]): string {
  switch (value) {
    case "supported": return "Useful option";
    case "promising": return "Promising, limited evidence";
    case "mixed": return "Mixed evidence";
    case "advanced": return "Advanced / situational";
  }
}

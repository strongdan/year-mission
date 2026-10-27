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

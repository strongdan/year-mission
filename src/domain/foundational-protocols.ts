export type FoundationProtocolSlug =
  | "morning-outdoor-light"
  | "calm-breathing"
  | "post-meal-walk";

export interface FoundationStep {
  id: string;
  title: string;
  durationSeconds: number;
  cue: string;
}

export interface FoundationProtocol {
  slug: FoundationProtocolSlug;
  title: string;
  detail: string;
  purpose: string;
  estimatedMinutes: number;
  evidenceLabel: "well-supported" | "promising";
  sourceLabel: string;
  sourceUrl: string;
  safetyNote?: string;
  steps: FoundationStep[];
}

export const FOUNDATION_PROTOCOLS: Record<FoundationProtocolSlug, FoundationProtocol> = {
  "morning-outdoor-light": {
    slug: "morning-outdoor-light",
    title: "Morning outdoor light",
    detail: "10 min default · outside, not through a window",
    purpose: "Use outdoor daylight as a simple circadian cue and pair it with a little movement when convenient.",
    estimatedMinutes: 10,
    evidenceLabel: "well-supported",
    sourceLabel: "Huberman Lab · Protocols / Daily Blueprint",
    sourceUrl: "https://www.hubermanlab.com/daily-blueprint",
    safetyNote: "Do not stare at the sun. If it is still dark, use the first practical outdoor daylight later rather than forcing a bright-light workaround.",
    steps: [
      {
        id: "outside",
        title: "Go outside",
        durationSeconds: 10 * 60,
        cue: "Let normal outdoor daylight reach your eyes while you walk, stand, or drink something outside. The timer is a default, not a dose to chase.",
      },
    ],
  },
  "calm-breathing": {
    slug: "calm-breathing",
    title: "Exhale-focused breathing",
    detail: "5 min · two-part inhale, long easy exhale",
    purpose: "Use a short body-based downshift when stress is high and thinking harder is not helping.",
    estimatedMinutes: 5,
    evidenceLabel: "promising",
    sourceLabel: "Cell Reports Medicine · Balban et al. 2023",
    sourceUrl: "https://doi.org/10.1016/j.xcrm.2022.100895",
    safetyNote: "Keep it comfortable. Stop if you feel dizzy or unwell, and do not practice breathwork while driving, swimming, or in water.",
    steps: [
      {
        id: "cyclic-sigh",
        title: "Two-part inhale, long exhale",
        durationSeconds: 5 * 60,
        cue: "Inhale gently through the nose, take a second smaller inhale, then exhale slowly and fully. Repeat at an easy pace; no breath holds are required.",
      },
    ],
  },
  "post-meal-walk": {
    slug: "post-meal-walk",
    title: "Post-meal walk",
    detail: "10 min · easy pace",
    purpose: "Attach a little movement to lunch or dinner instead of relying on a separate motivation window later.",
    estimatedMinutes: 10,
    evidenceLabel: "well-supported",
    sourceLabel: "Sports Medicine · post-meal exercise meta-analysis",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/36715875/",
    safetyNote: "Keep the pace easy enough to feel like ordinary walking. This is an optional movement cue, not a requirement to compensate for food.",
    steps: [
      {
        id: "walk",
        title: "Walk after the meal",
        durationSeconds: 10 * 60,
        cue: "Start reasonably soon after eating when it fits. Walk at an easy pace and stop when the timer ends unless you genuinely want to continue.",
      },
    ],
  },
};

export type FoundationCue = {
  id: "morning-light" | "day-walk" | "evening-downshift";
  title: string;
  detail: string;
  href: string;
};

export function foundationCueForHour(hour: number): FoundationCue {
  const normalized = Math.min(23, Math.max(0, Math.trunc(hour)));
  if (normalized < 11) {
    return {
      id: "morning-light",
      title: "Get some outdoor daylight",
      detail: "A short outside block is a useful morning anchor. If it is still dark, use the first practical daylight later.",
      href: "/execute/morning-outdoor-light",
    };
  }
  if (normalized < 19) {
    return {
      id: "day-walk",
      title: "Borrow 10 minutes after a meal",
      detail: "Lunch or dinner can cue an easy walk without creating another workout obligation.",
      href: "/execute/post-meal-walk",
    };
  }
  return {
    id: "evening-downshift",
    title: "Lower the lights and start winding down",
    detail: "Use the evening reset as a transition out of stimulation rather than trying to force sleep at the last minute.",
    href: "/execute/evening-reset",
  };
}

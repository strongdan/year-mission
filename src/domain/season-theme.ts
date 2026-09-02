export type SeasonThemeKey = "stabilize" | "build" | "transform" | "convert" | "year";

export interface SeasonTheme {
  key: SeasonThemeKey;
  number: number | null;
  label: string;
  metaphor: string;
  cue: string;
  accent: string;
  soft: string;
  border: string;
  text: string;
  dot: string;
  gradient: string;
}

const THEMES: Record<SeasonThemeKey, SeasonTheme> = {
  stabilize: {
    key: "stabilize",
    number: 1,
    label: "Stabilize",
    metaphor: "Winter · roots before reach",
    cue: "Protect the basics. Build steadiness and self-trust.",
    accent: "sky",
    soft: "bg-sky-950/25",
    border: "border-sky-900/60",
    text: "text-sky-300",
    dot: "bg-sky-400",
    gradient: "from-sky-950/55 via-zinc-950/15 to-cyan-950/25",
  },
  build: {
    key: "build",
    number: 2,
    label: "Build",
    metaphor: "Spring · repeated growth",
    cue: "Add capacity through practice and useful repetition.",
    accent: "emerald",
    soft: "bg-emerald-950/25",
    border: "border-emerald-900/60",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    gradient: "from-emerald-950/55 via-zinc-950/15 to-lime-950/20",
  },
  transform: {
    key: "transform",
    number: 3,
    label: "Transform",
    metaphor: "Summer · intensity into change",
    cue: "Use stronger capacity to replace old patterns with better defaults.",
    accent: "violet",
    soft: "bg-violet-950/25",
    border: "border-violet-900/60",
    text: "text-violet-300",
    dot: "bg-violet-400",
    gradient: "from-violet-950/55 via-zinc-950/15 to-fuchsia-950/25",
  },
  convert: {
    key: "convert",
    number: 4,
    label: "Convert",
    metaphor: "Autumn · harvest and carry forward",
    cue: "Turn progress into durable systems, identity, and next-stage choices.",
    accent: "amber",
    soft: "bg-amber-950/25",
    border: "border-amber-900/60",
    text: "text-amber-300",
    dot: "bg-amber-400",
    gradient: "from-amber-950/55 via-zinc-950/15 to-orange-950/25",
  },
  year: {
    key: "year",
    number: null,
    label: "Year Mission",
    metaphor: "A year with seasons",
    cue: "Work the season you are in instead of expecting every week to feel the same.",
    accent: "zinc",
    soft: "bg-zinc-900/50",
    border: "border-zinc-800",
    text: "text-zinc-300",
    dot: "bg-zinc-400",
    gradient: "from-zinc-900/70 via-zinc-950/20 to-zinc-900/30",
  },
};

export function normalizeSeasonThemeKey(name?: string | null): SeasonThemeKey {
  if (!name) return "year";
  const key = name.trim().toLowerCase();
  if (key === "stabilize" || key === "build" || key === "transform" || key === "convert") return key;
  return "year";
}

export function seasonTheme(name?: string | null): SeasonTheme {
  return THEMES[normalizeSeasonThemeKey(name)];
}

export const SEASON_THEMES = THEMES;

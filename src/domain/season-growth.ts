export interface SeasonGrowthFrame {
  label: string;
  purpose: string;
  reflection: string;
}

const SEASON_GROWTH: Record<string, SeasonGrowthFrame> = {
  stabilize: {
    label: "Stabilize",
    purpose: "Build safety, consistency, and trust in your own follow-through.",
    reflection: "What would make you trust yourself more by the end of this season?",
  },
  build: {
    label: "Build",
    purpose: "Increase capacity through repeated practice, not intensity for its own sake.",
    reflection: "What capability are you deliberately becoming more confident in?",
  },
  transform: {
    label: "Transform",
    purpose: "Replace old patterns with stronger defaults and a more accurate view of yourself.",
    reflection: "What old story about yourself are your actions starting to disprove?",
  },
  convert: {
    label: "Convert",
    purpose: "Turn the year's progress into durable identity, systems, and next-stage choices.",
    reflection: "What evidence proves that you are not the same person who started this year?",
  },
};

export function seasonGrowthFrame(name?: string | null): SeasonGrowthFrame {
  if (!name) {
    return {
      label: "Year Mission",
      purpose: "Use the year to become more capable, self-trusting, and awake.",
      reflection: "What would make this period feel like real personal growth?",
    };
  }

  const key = name.trim().toLowerCase();
  return SEASON_GROWTH[key] ?? {
    label: name,
    purpose: "Give this season one clear job and use it to create evidence of growth.",
    reflection: "Who are you trying to become during this season?",
  };
}

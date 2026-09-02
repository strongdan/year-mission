export type MomentumCategoryKey = "body" | "money" | "self" | "capability";

export interface MomentumHistoryPoint {
  date: string;
  body_score: number | null;
  money_score: number | null;
  home_score: number | null;
  capability_score: number | null;
}

export interface CategoryMomentumSeries {
  key: MomentumCategoryKey;
  label: string;
  values: Array<{ date: string; score: number }>;
  current: number | null;
  change: number | null;
  direction: "growing" | "holding" | "rebuilding" | "gathering";
}

const CATEGORY_CONFIG: Array<{
  key: MomentumCategoryKey;
  label: string;
  field: keyof Pick<MomentumHistoryPoint, "body_score" | "money_score" | "home_score" | "capability_score">;
}> = [
  { key: "body", label: "Body", field: "body_score" },
  { key: "money", label: "Money", field: "money_score" },
  { key: "self", label: "Self", field: "home_score" },
  { key: "capability", label: "Capability", field: "capability_score" },
];

function directionFor(values: number[], change: number | null): CategoryMomentumSeries["direction"] {
  if (values.length < 2 || change === null) return "gathering";
  if (change >= 5) return "growing";
  if (change <= -5) return "rebuilding";
  return "holding";
}

export function buildCategoryMomentum(history: MomentumHistoryPoint[], windowDays = 14): CategoryMomentumSeries[] {
  const chronological = [...history].reverse().slice(-windowDays);
  return CATEGORY_CONFIG.map(({ key, label, field }) => {
    const values = chronological.flatMap((point) => {
      const score = point[field];
      return typeof score === "number" ? [{ date: point.date, score }] : [];
    });
    const current = values.length ? values[values.length - 1].score : null;
    const change = values.length >= 2 ? current! - values[0].score : null;
    return {
      key,
      label,
      values,
      current,
      change,
      direction: directionFor(values.map((value) => value.score), change),
    };
  });
}

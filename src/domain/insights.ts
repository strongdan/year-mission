export const INSIGHT_MIN_SAMPLES: Record<string, number> = {
  task_size: 8,
  time_of_day: 10,
  domain_attention: 10,
  deferral_pattern: 5,
  commitment_capacity: 8,
  experiment_outcome: 3,
};

export interface SampleCheck {
  sufficient: boolean;
  sampleCount: number;
  minimum: number;
  message?: string;
}

export function hasSufficientSample(sampleCount: number, kind: keyof typeof INSIGHT_MIN_SAMPLES): SampleCheck {
  const minimum = INSIGHT_MIN_SAMPLES[kind];
  const sufficient = sampleCount >= minimum;
  return {
    sufficient,
    sampleCount,
    minimum,
    message: sufficient ? undefined : `Not enough data yet (${sampleCount}/${minimum}).`,
  };
}

export interface RateCheckInput {
  sampleCount: number;
  successCount: number;
  kind: keyof typeof INSIGHT_MIN_SAMPLES;
  minSuccessRate?: number;
}

export function supportsRateInsight({ sampleCount, successCount, kind, minSuccessRate = 0.6 }: RateCheckInput): SampleCheck & { rate?: number } {
  const base = hasSufficientSample(sampleCount, kind);
  const rate = sampleCount === 0 ? 0 : successCount / sampleCount;
  return {
    ...base,
    rate,
    sufficient: base.sufficient && rate >= minSuccessRate,
  };
}

/**
 * Cautious language layer for behavioral findings. Correlations must not be
 * presented as causation.
 */
export function cautiousPhrase(rate: number, direction: "positive" | "negative"): string {
  if (direction === "positive") {
    if (rate >= 0.75) return "Your history suggests you tend to";
    if (rate >= 0.6) return "Your history suggests you sometimes";
    return "There is a weak pattern that you may";
  }
  if (rate >= 0.75) return "Your history suggests you tend to avoid";
  if (rate >= 0.6) return "Your history suggests you sometimes avoid";
  return "There is a weak pattern that you may avoid";
}
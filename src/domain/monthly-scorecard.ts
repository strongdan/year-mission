export type ScorecardDomain = "money" | "body" | "home" | "capability";

export interface MonthlyActivityInput {
  completedTasks: Array<{
    domainSlug?: string | null;
    metaWork?: boolean;
    weeklyWin?: boolean;
    courageTask?: boolean;
  }>;
  workouts: number;
  evidenceByDomain?: Partial<Record<ScorecardDomain, number>>;
}

export interface MonthlyScorecardSummary {
  meaningfulTasks: number;
  weeklyWins: number;
  courageTasks: number;
  workouts: number;
  domainCounts: Record<ScorecardDomain, number>;
  strongestDomain: ScorecardDomain;
  neglectedDomain: ScorecardDomain;
  recommendation: string;
}

const DOMAINS: ScorecardDomain[] = ["money", "body", "home", "capability"];
const LABELS: Record<ScorecardDomain, string> = {
  money: "Money",
  body: "Body",
  home: "Self",
  capability: "Career",
};

export function summarizeMonthlyActivity(input: MonthlyActivityInput): MonthlyScorecardSummary {
  const domainCounts: Record<ScorecardDomain, number> = { money: 0, body: 0, home: 0, capability: 0 };
  let meaningfulTasks = 0;
  let weeklyWins = 0;
  let courageTasks = 0;

  for (const task of input.completedTasks) {
    if (task.metaWork) continue;
    meaningfulTasks += 1;
    if (task.weeklyWin) weeklyWins += 1;
    if (task.courageTask) courageTasks += 1;
    if (task.domainSlug && DOMAINS.includes(task.domainSlug as ScorecardDomain)) {
      domainCounts[task.domainSlug as ScorecardDomain] += 1;
    }
  }

  domainCounts.body += input.workouts;
  for (const domain of DOMAINS) domainCounts[domain] += input.evidenceByDomain?.[domain] ?? 0;

  const strongestDomain = [...DOMAINS].sort((a, b) => domainCounts[b] - domainCounts[a])[0];
  const neglectedDomain = [...DOMAINS].sort((a, b) => domainCounts[a] - domainCounts[b])[0];
  const recommendation = domainCounts[neglectedDomain] === 0
    ? `Protect one ${LABELS[neglectedDomain]} action before the month ends.`
    : `Keep ${LABELS[strongestDomain]} moving without letting ${LABELS[neglectedDomain]} disappear.`;

  return {
    meaningfulTasks,
    weeklyWins,
    courageTasks,
    workouts: input.workouts,
    domainCounts,
    strongestDomain,
    neglectedDomain,
    recommendation,
  };
}

export function scorecardDomainLabel(domain: ScorecardDomain): string {
  return LABELS[domain];
}

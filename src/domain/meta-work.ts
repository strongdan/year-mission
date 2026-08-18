export const META_WORK_PATTERNS = [
  /reorgani[sz]e (task|project|categor)/i,
  /tweak.*(setting|preference|config)/i,
  /edit.*(scoring|model|rule)/i,
  /restructur(e|ing).*plan/i,
  /(plan|research).*productivity (method|system)/i,
  /customi[sz]e.*dashboard/i,
];

export interface MetaWorkCheck {
  isMetaWork: boolean;
  matches: RegExp[];
}

export function isMetaWork(title: string): MetaWorkCheck {
  const matches = META_WORK_PATTERNS.filter((re) => re.test(title));
  return { isMetaWork: matches.length > 0, matches };
}

export function metaWorkExcludedFromMomentum(metaWork: boolean): boolean {
  return metaWork;
}
export type AnticipationKind = "birthday" | "anniversary" | "deadline" | "holiday" | "travel" | "calendar" | "other";

export interface AnticipationItem {
  key: string;
  title: string;
  date: string;
  kind: AnticipationKind;
  source: "manual" | "holiday" | "task" | "google_calendar";
  leadDays: number;
  prepDate: string;
  daysAway: number;
  planningNow: boolean;
  plannedTaskId: string | null;
  notes?: string | null;
  personName?: string | null;
  location?: string | null;
  url?: string | null;
}

export const DEFAULT_LEAD_DAYS: Record<Exclude<AnticipationKind, "calendar">, number> = {
  birthday: 21,
  anniversary: 21,
  deadline: 7,
  holiday: 14,
  travel: 21,
  other: 7,
};

function ymd(date: Date): string {
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join("-");
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return ymd(date);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function nextOccurrence(eventDate: string, recurrence: "none" | "yearly", today: string): string {
  if (recurrence === "none") return eventDate;
  const [, month, day] = eventDate.split("-");
  let year = Number(today.slice(0, 4));
  let candidate = `${year}-${month}-${day}`;
  if (candidate < today) candidate = `${year + 1}-${month}-${day}`;
  return candidate;
}

function nthWeekday(year: number, monthZero: number, weekday: number, n: number): string {
  const d = new Date(Date.UTC(year, monthZero, 1, 12));
  const delta = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(1 + delta + (n - 1) * 7);
  return ymd(d);
}

function lastWeekday(year: number, monthZero: number, weekday: number): string {
  const d = new Date(Date.UTC(year, monthZero + 1, 0, 12));
  const delta = (d.getUTCDay() - weekday + 7) % 7;
  d.setUTCDate(d.getUTCDate() - delta);
  return ymd(d);
}

function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function planningHolidays(year: number): Array<{ title: string; date: string; leadDays: number }> {
  return [
    { title: "New Year's Day", date: `${year}-01-01`, leadDays: 7 },
    { title: "Valentine's Day", date: `${year}-02-14`, leadDays: 14 },
    { title: "Easter", date: easterSunday(year), leadDays: 14 },
    { title: "Mother's Day", date: nthWeekday(year, 4, 0, 2), leadDays: 21 },
    { title: "Memorial Day", date: lastWeekday(year, 4, 1), leadDays: 7 },
    { title: "Father's Day", date: nthWeekday(year, 5, 0, 3), leadDays: 21 },
    { title: "Independence Day", date: `${year}-07-04`, leadDays: 7 },
    { title: "Labor Day", date: nthWeekday(year, 8, 1, 1), leadDays: 7 },
    { title: "Halloween", date: `${year}-10-31`, leadDays: 14 },
    { title: "Veterans Day", date: `${year}-11-11`, leadDays: 3 },
    { title: "Thanksgiving", date: nthWeekday(year, 10, 4, 4), leadDays: 21 },
    { title: "Christmas", date: `${year}-12-25`, leadDays: 30 },
  ];
}

export function planningTaskTitle(item: Pick<AnticipationItem, "kind" | "title" | "personName">): string {
  if (item.kind === "birthday") return `Plan ${item.personName ?? item.title}'s birthday`;
  if (item.kind === "anniversary") return `Plan for ${item.title}`;
  if (item.kind === "holiday") return `Plan for ${item.title}`;
  if (item.kind === "travel") return `Prepare for ${item.title}`;
  if (item.kind === "deadline") return `Prepare for deadline: ${item.title}`;
  return `Prepare for ${item.title}`;
}

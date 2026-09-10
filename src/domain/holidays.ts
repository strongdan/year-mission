export type GameHoliday = {
  id: string;
  name: string;
  date: string;
  observedDate: string;
  kind: "state" | "special";
  xpMultiplier: number;
  bonusCapXp: number;
  scene: "fireworks" | "snow" | "campfire" | "flags" | "alaska" | "memorial" | "spring" | "winter";
  restMessage: string;
};

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nthWeekday(year: number, month: number, weekday: number, nth: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return iso(year, month, 1 + offset + (nth - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number): string {
  const last = new Date(Date.UTC(year, month, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return iso(year, month, last.getUTCDate() - offset);
}

function observed(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDay();
  if (day === 6) d.setUTCDate(d.getUTCDate() - 1);
  if (day === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function holiday(id: string, name: string, date: string, scene: GameHoliday["scene"], observedDate = observed(date), kind: GameHoliday["kind"] = "state"): GameHoliday {
  return {
    id,
    name,
    date,
    observedDate,
    kind,
    xpMultiplier: 1.5,
    bonusCapXp: 90,
    scene,
    restMessage: "Rest day honored — there is no level debt today.",
  };
}

/** State of Alaska employee holiday calendar used by the game.
 * Recurring rules follow the State calendar; one-off executive holidays are explicit.
 */
export function alaskaStateHolidays(year: number): GameHoliday[] {
  const holidays: GameHoliday[] = [
    holiday("new-years", "New Year's Day", iso(year, 1, 1), "winter"),
    holiday("mlk", "Martin Luther King, Jr.'s Birthday", nthWeekday(year, 1, 1, 3), "flags"),
    holiday("presidents", "Presidents' Day", nthWeekday(year, 2, 1, 3), "flags"),
    holiday("sewards", "Seward's Day", lastWeekday(year, 3, 1), "alaska"),
    holiday("memorial", "Memorial Day", lastWeekday(year, 5, 1), "memorial"),
    holiday("juneteenth", "Juneteenth Day", iso(year, 6, 19), "flags"),
    holiday("independence", "Independence Day", iso(year, 7, 4), "fireworks"),
    holiday("labor", "Labor Day", nthWeekday(year, 9, 1, 1), "spring"),
    holiday("alaska-day", "Alaska Day", iso(year, 10, 18), "alaska"),
    holiday("veterans", "Veterans' Day", iso(year, 11, 11), "flags"),
    holiday("thanksgiving", "Thanksgiving Day", nthWeekday(year, 11, 4, 4), "campfire"),
    holiday("christmas", "Christmas Day", iso(year, 12, 25), "snow"),
  ];

  if (year === 2026) {
    holidays.push(holiday("america-250", "America 250 State Holiday", "2026-07-06", "fireworks", "2026-07-06", "special"));
  }

  return holidays.sort((a, b) => a.observedDate.localeCompare(b.observedDate));
}

export function holidayForDate(date: string): GameHoliday | null {
  const year = Number(date.slice(0, 4));
  return alaskaStateHolidays(year).find((item) => item.observedDate === date) ?? null;
}

export function holidayAdjustedXp(baseXp: number, holiday: GameHoliday | null): { totalXp: number; bonusXp: number } {
  if (!holiday || baseXp <= 0) return { totalXp: baseXp, bonusXp: 0 };
  const rawBonus = Math.round(baseXp * (holiday.xpMultiplier - 1));
  const bonusXp = Math.min(holiday.bonusCapXp, rawBonus);
  return { totalXp: baseXp + bonusXp, bonusXp };
}

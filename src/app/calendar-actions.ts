"use server";

import { requireUser } from "@/lib/auth";
import { getGoogleCalendarWeek } from "@/services/google/sync-service";
import { isValidDateOnly, mondayOfDateOnly } from "@/domain/local-calendar";

export async function getCalendarWeekAction(dateInput: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!isValidDateOnly(dateInput)) return { ok: false as const, error: "Invalid local date." };

  const data = await getGoogleCalendarWeek(user.id, mondayOfDateOnly(dateInput));
  return { ok: true as const, data };
}

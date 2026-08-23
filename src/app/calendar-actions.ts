"use server";

import { requireUser } from "@/lib/auth";
import { getGoogleCalendarWeek } from "@/services/google/sync-service";

function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function getCalendarWeekAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const data = await getGoogleCalendarWeek(user.id, mondayOf());
  return { ok: true as const, data };
}

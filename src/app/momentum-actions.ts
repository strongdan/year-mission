"use server";

import { requireUser } from "@/lib/auth";
import { metricsService } from "@/services/metrics-service";
import { isValidDateOnly, validTimeZone } from "@/domain/local-calendar";

export async function getCategoryMomentumAction(dateInput: string, timeZoneInput: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!isValidDateOnly(dateInput)) return { ok: false as const, error: "Invalid local date." };

  const momentum = await metricsService.categoryMomentum(user.id, dateInput, validTimeZone(timeZoneInput));
  return { ok: true as const, data: momentum };
}

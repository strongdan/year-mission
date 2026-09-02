"use server";

import { requireUser } from "@/lib/auth";
import { metricsService } from "@/services/metrics-service";

export async function getCategoryMomentumAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const momentum = await metricsService.categoryMomentum(user.id);
  return { ok: true as const, data: momentum };
}

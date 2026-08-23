"use server";

import { requireUser } from "@/lib/auth";
import { getAiProvider, getModelConfig, isMockMode } from "@/integrations/ai";

export async function getAiStatusAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const provider = getAiProvider();
  const model = getModelConfig().coach;
  return {
    ok: true as const,
    data: {
      provider: provider.name,
      model,
      mock: isMockMode(),
      freeTier: provider.name === "gemini",
    },
  };
}

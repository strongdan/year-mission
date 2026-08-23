import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/integrations/supabase/server";

export type ExternalOwnerChannel = "healthkit" | "chatgpt";

type ExternalOwnerAuthResult =
  | { ok: true; userId: string; admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>> }
  | { ok: false; status: number; message: string };

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenFor(channel: ExternalOwnerChannel): string | undefined {
  return channel === "healthkit"
    ? process.env.YEAR_MISSION_HEALTH_SYNC_TOKEN
    : process.env.YEAR_MISSION_CHATGPT_TOKEN;
}

export async function authenticateExternalOwner(
  request: Request,
  channel: ExternalOwnerChannel
): Promise<ExternalOwnerAuthResult> {
  const expected = tokenFor(channel);
  const userId = process.env.YEAR_MISSION_OWNER_USER_ID;
  if (!expected || !userId) {
    return { ok: false, status: 503, message: `External ${channel} integration is not configured.` };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!provided || !safeEqual(provided, expected)) {
    return { ok: false, status: 401, message: "Unauthorized." };
  }

  const admin = await createAdminClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Supabase admin access is not configured." };
  }

  return { ok: true, userId, admin };
}

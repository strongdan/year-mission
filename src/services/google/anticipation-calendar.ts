import "server-only";

import { GOOGLE_CALENDAR_SCOPE } from "@/domain/google-sync";
import { getGoogleConnection } from "@/repositories/supabase-repository";
import { decryptToken } from "./encryption";
import { refreshAccessToken } from "./oauth";
import { listPrimaryCalendarEvents, type GoogleCalendarEvent } from "./calendar-api";

export async function listUpcomingPrimaryCalendarEvents(
  userId: string,
  start: Date,
  end: Date
): Promise<GoogleCalendarEvent[]> {
  try {
    const connection = await getGoogleConnection(userId);
    if (!connection?.refresh_token) return [];
    if (!connection.scope?.includes(GOOGLE_CALENDAR_SCOPE)) return [];

    const accessToken = await refreshAccessToken(decryptToken(connection.refresh_token));
    return await listPrimaryCalendarEvents(accessToken, start.toISOString(), end.toISOString());
  } catch {
    // Anticipation should remain useful even when Google is disconnected.
    return [];
  }
}

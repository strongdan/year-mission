import "server-only";

import { GOOGLE_CALENDAR_SCOPE } from "@/domain/google-sync";
import { getGoogleConnection } from "@/repositories/supabase-repository";
import { decryptToken } from "./encryption";
import { refreshAccessToken } from "./oauth";
import { listPrimaryCalendarEvents, type GoogleCalendarEvent } from "./calendar-api";

export type UpcomingCalendarOutcome = "ok" | "not_connected" | "error";

export interface UpcomingCalendarResult {
  events: GoogleCalendarEvent[];
  outcome: UpcomingCalendarOutcome;
  error?: string;
}

export async function listUpcomingPrimaryCalendarEvents(
  userId: string,
  start: Date,
  end: Date
): Promise<UpcomingCalendarResult> {
  try {
    const connection = await getGoogleConnection(userId);
    if (!connection?.refresh_token || !connection.scope?.includes(GOOGLE_CALENDAR_SCOPE)) {
      return { events: [], outcome: "not_connected" };
    }

    const accessToken = await refreshAccessToken(decryptToken(connection.refresh_token));
    const events = await listPrimaryCalendarEvents(accessToken, start.toISOString(), end.toISOString());
    return { events, outcome: "ok" };
  } catch (error) {
    return {
      events: [],
      outcome: "error",
      error: error instanceof Error ? error.message : "Google Calendar could not be loaded.",
    };
  }
}

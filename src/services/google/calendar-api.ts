import "server-only";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
}

interface GoogleEventResource {
  id?: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

export async function listPrimaryCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
    fields: "items(id,summary,start,end,location,status,htmlLink)",
  });

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Google Calendar permission is missing or expired. Reconnect Google.");
    }
    throw new Error(`Google Calendar request failed (${res.status}).`);
  }

  const data = (await res.json()) as { items?: GoogleEventResource[] };
  return (data.items ?? [])
    .filter((event) => event.status !== "cancelled" && event.id && event.start && event.end)
    .map((event) => {
      const start = event.start?.dateTime ?? event.start?.date ?? "";
      const end = event.end?.dateTime ?? event.end?.date ?? "";
      return {
        id: event.id!,
        title: event.summary?.trim() || "Busy",
        start,
        end,
        allDay: !!event.start?.date && !event.start?.dateTime,
        location: event.location?.trim() || null,
        htmlLink: event.htmlLink ?? null,
      };
    })
    .filter((event) => event.start && event.end);
}

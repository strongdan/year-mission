"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/integrations/supabase/server";
import { taskService } from "@/services/task-service";
import { listUpcomingPrimaryCalendarEvents } from "@/services/google/anticipation-calendar";
import {
  DEFAULT_LEAD_DAYS,
  addDays,
  daysBetween,
  nextOccurrence,
  planningHolidays,
  planningTaskTitle,
  type AnticipationItem,
  type AnticipationKind,
} from "@/domain/anticipation";

const DATE_Z = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const KIND_Z = z.enum(["birthday", "anniversary", "deadline", "holiday", "travel", "other"]);
const UUID_Z = z.string().uuid();

function serverToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function classifyCalendarTitle(title: string): { kind: AnticipationKind; leadDays: number } {
  const normalized = title.toLowerCase();
  if (normalized.includes("birthday") || normalized.includes("bday")) return { kind: "birthday", leadDays: 21 };
  if (normalized.includes("anniversary")) return { kind: "anniversary", leadDays: 21 };
  if (normalized.includes("deadline") || normalized.includes(" due")) return { kind: "deadline", leadDays: 7 };
  if (normalized.includes("flight") || normalized.includes("trip") || normalized.includes("travel")) return { kind: "travel", leadDays: 14 };
  return { kind: "calendar", leadDays: 3 };
}

function enrich(
  item: Omit<AnticipationItem, "prepDate" | "daysAway" | "planningNow" | "plannedTaskId">,
  today: string,
  plannedTaskId: string | null
): AnticipationItem {
  const prepDate = addDays(item.date, -item.leadDays);
  return {
    ...item,
    prepDate,
    daysAway: daysBetween(today, item.date),
    planningNow: today >= prepDate && today <= item.date,
    plannedTaskId,
  };
}

async function context() {
  const { user } = await requireUser();
  if (!user) throw new Error("Not signed in.");
  const admin = await createAdminClient();
  if (!admin) throw new Error("Server database access is not configured.");
  return { user, admin };
}

export async function getAnticipationAction(todayInput?: string, horizonDays = 120) {
  try {
    const { user, admin } = await context();
    const today = DATE_Z.safeParse(todayInput).success ? todayInput! : serverToday();
    const safeHorizon = Math.min(Math.max(Math.trunc(horizonDays), 14), 365);
    const through = addDays(today, safeHorizon);

    const [{ data: importantDates, error: importantError }, { data: taskRows, error: taskError }, { data: plans, error: plansError }] = await Promise.all([
      admin.from("important_dates").select("id,title,kind,event_date,recurrence,lead_days,person_name,notes").eq("user_id", user.id).limit(500),
      admin.from("tasks").select("id,title,due_date,notes,status").eq("user_id", user.id).not("due_date", "is", null).not("status", "in", '(completed,dropped)').limit(500),
      admin.from("anticipation_plans").select("event_key,task_id").eq("user_id", user.id).limit(1000),
    ]);
    if (importantError) throw importantError;
    if (taskError) throw taskError;
    if (plansError) throw plansError;

    const start = new Date(`${today}T00:00:00Z`);
    const end = new Date(`${through}T23:59:59Z`);
    const calendarEvents = await listUpcomingPrimaryCalendarEvents(user.id, start, end);
    const plannedByKey = new Map((plans ?? []).map((row) => [String(row.event_key), typeof row.task_id === "string" ? row.task_id : null]));

    const raw: Array<Omit<AnticipationItem, "prepDate" | "daysAway" | "planningNow" | "plannedTaskId">> = [];

    for (const row of importantDates ?? []) {
      const recurrence = row.recurrence === "yearly" ? "yearly" : "none";
      const date = nextOccurrence(String(row.event_date), recurrence, today);
      if (date < today || date > through) continue;
      const kind = KIND_Z.parse(row.kind);
      raw.push({
        key: `important:${row.id}:${date}`,
        title: String(row.title),
        date,
        kind,
        source: "manual",
        leadDays: Number(row.lead_days ?? DEFAULT_LEAD_DAYS[kind]),
        notes: typeof row.notes === "string" ? row.notes : null,
        personName: typeof row.person_name === "string" ? row.person_name : null,
      });
    }

    for (const row of taskRows ?? []) {
      const date = String(row.due_date ?? "");
      if (!DATE_Z.safeParse(date).success || date < today || date > through) continue;
      raw.push({
        key: `task:${row.id}:${date}`,
        title: String(row.title),
        date,
        kind: "deadline",
        source: "task",
        leadDays: 7,
        notes: typeof row.notes === "string" ? row.notes : null,
      });
    }

    for (const event of calendarEvents) {
      const date = event.start.slice(0, 10);
      if (!DATE_Z.safeParse(date).success || date < today || date > through) continue;
      const classified = classifyCalendarTitle(event.title);
      raw.push({
        key: `gcal:${event.id}:${date}`,
        title: event.title,
        date,
        kind: classified.kind,
        source: "google_calendar",
        leadDays: classified.leadDays,
        location: event.location,
        url: event.htmlLink,
      });
    }

    const firstYear = Number(today.slice(0, 4));
    const lastYear = Number(through.slice(0, 4));
    for (let year = firstYear; year <= lastYear; year += 1) {
      for (const holiday of planningHolidays(year)) {
        if (holiday.date < today || holiday.date > through) continue;
        raw.push({
          key: `holiday:${holiday.date}:${holiday.title}`,
          title: holiday.title,
          date: holiday.date,
          kind: "holiday",
          source: "holiday",
          leadDays: holiday.leadDays,
        });
      }
    }

    const deduped = new Map<string, (typeof raw)[number]>();
    for (const item of raw) if (!deduped.has(item.key)) deduped.set(item.key, item);
    const items = [...deduped.values()]
      .map((item) => enrich(item, today, plannedByKey.get(item.key) ?? null))
      .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

    return {
      ok: true as const,
      data: {
        today,
        through,
        items,
        planningNow: items.filter((item) => item.planningNow && !item.plannedTaskId),
      },
    };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Coming dates could not be loaded." };
  }
}

export async function addImportantDateAction(input: {
  title: string;
  kind: z.infer<typeof KIND_Z>;
  eventDate: string;
  recurrence?: "none" | "yearly";
  leadDays?: number;
  personName?: string | null;
  notes?: string | null;
}) {
  const parsed = z.object({
    title: z.string().trim().min(1).max(200),
    kind: KIND_Z,
    eventDate: DATE_Z,
    recurrence: z.enum(["none", "yearly"]).default("none"),
    leadDays: z.number().int().min(0).max(120).optional(),
    personName: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the important-date fields." };

  try {
    const { user, admin } = await context();
    const leadDays = parsed.data.leadDays ?? DEFAULT_LEAD_DAYS[parsed.data.kind];
    const { data, error } = await admin.from("important_dates").insert({
      user_id: user.id,
      title: parsed.data.title,
      kind: parsed.data.kind,
      event_date: parsed.data.eventDate,
      recurrence: parsed.data.recurrence,
      lead_days: leadDays,
      person_name: parsed.data.personName ?? null,
      notes: parsed.data.notes ?? null,
      source: "manual",
    }).select("id").single();
    if (error) throw error;
    revalidatePath("/upcoming");
    revalidatePath("/");
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Important date could not be saved." };
  }
}

export async function deleteImportantDateAction(idInput: string) {
  const id = UUID_Z.safeParse(idInput);
  if (!id.success) return { ok: false as const, error: "Invalid important date." };
  try {
    const { user, admin } = await context();
    const { error } = await admin.from("important_dates").delete().eq("id", id.data).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/upcoming");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Important date could not be deleted." };
  }
}

export async function planAnticipationItemAction(input: {
  key: string;
  title: string;
  date: string;
  kind: AnticipationKind;
  leadDays: number;
  personName?: string | null;
}) {
  const parsed = z.object({
    key: z.string().min(3).max(500),
    title: z.string().trim().min(1).max(200),
    date: DATE_Z,
    kind: z.enum(["birthday", "anniversary", "deadline", "holiday", "travel", "calendar", "other"]),
    leadDays: z.number().int().min(0).max(120),
    personName: z.string().trim().max(120).nullable().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Could not create a plan for this date." };

  try {
    const { user, admin } = await context();
    const { data: existing, error: existingError } = await admin
      .from("anticipation_plans")
      .select("task_id")
      .eq("user_id", user.id)
      .eq("event_key", parsed.data.key)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.task_id) return { ok: true as const, data: { taskId: existing.task_id, alreadyPlanned: true } };

    const prepDate = addDays(parsed.data.date, -parsed.data.leadDays);
    const taskResult = await taskService.create(user.id, {
      title: planningTaskTitle({ kind: parsed.data.kind, title: parsed.data.title, personName: parsed.data.personName }),
      notes: `Upcoming: ${parsed.data.title} on ${parsed.data.date}. Created by Coming Up so there is time to prepare.`,
      scheduledDate: prepDate,
      dueDate: prepDate,
      impact: parsed.data.kind === "deadline" ? "high" : "medium",
      source: "anticipation",
    });
    if (!taskResult.ok || !taskResult.data || typeof taskResult.data !== "object" || !("id" in taskResult.data)) {
      throw new Error(taskResult.error ?? "Planning task could not be created.");
    }
    const taskId = String((taskResult.data as { id: string }).id);
    const { error: planError } = await admin.from("anticipation_plans").upsert({
      user_id: user.id,
      event_key: parsed.data.key,
      task_id: taskId,
    }, { onConflict: "user_id,event_key" });
    if (planError) throw planError;

    revalidatePath("/upcoming");
    revalidatePath("/");
    revalidatePath("/tasks");
    return { ok: true as const, data: { taskId, alreadyPlanned: false } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Planning task could not be created." };
  }
}

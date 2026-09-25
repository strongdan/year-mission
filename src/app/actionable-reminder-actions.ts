"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { nextDateAfterCompletion, rescheduleDate } from "@/domain/actionable-reminders";

const DATE_Z = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const URL_Z = z.string().trim().url().max(2000).nullable().optional();
const CREATE_Z = z.object({
  title: z.string().trim().min(1).max(240),
  launchStep: z.string().trim().min(1).max(500),
  launchUrl: URL_Z,
  nextDueDate: DATE_Z,
  recurrenceDays: z.number().int().min(1).max(3650).nullable().optional(),
  defaultRescheduleDays: z.number().int().min(1).max(365).default(7),
});
const ID_Z = z.string().uuid();
const RESCHEDULE_Z = z.object({ id: ID_Z, date: DATE_Z.nullable().optional(), today: DATE_Z });
const COMPLETE_Z = z.object({ id: ID_Z, completedOn: DATE_Z });

export interface ActionableReminderRecord {
  id: string;
  user_id: string;
  title: string;
  launch_step: string;
  launch_url: string | null;
  next_due_date: string;
  recurrence_days: number | null;
  default_reschedule_days: number;
  active: boolean;
  last_launched_at: string | null;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function missingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "42P01" || Boolean(error?.message?.includes("actionable_reminders"));
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/reminders");
}

export async function listActionableRemindersAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { data, error } = await supabase
    .from("actionable_reminders")
    .select("id,user_id,title,launch_step,launch_url,next_due_date,recurrence_days,default_reschedule_days,active,last_launched_at,last_completed_at,created_at,updated_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("next_due_date", { ascending: true })
    .limit(100);

  if (error) {
    if (missingTable(error)) return { ok: true as const, data: [] as ActionableReminderRecord[], migrationReady: false };
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, data: (data ?? []) as ActionableReminderRecord[], migrationReady: true };
}

export async function createActionableReminderAction(input: unknown) {
  const parsed = CREATE_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the reminder fields." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const value = parsed.data;
  const { error } = await supabase.from("actionable_reminders").insert({
    user_id: user.id,
    title: value.title,
    launch_step: value.launchStep,
    launch_url: value.launchUrl || null,
    next_due_date: value.nextDueDate,
    recurrence_days: value.recurrenceDays ?? null,
    default_reschedule_days: value.defaultRescheduleDays,
  });
  if (error) return { ok: false as const, error: missingTable(error) ? "Apply migration 0019_actionable_reminders.sql first." : error.message };
  revalidate();
  return { ok: true as const };
}

export async function markActionableReminderLaunchedAction(id: string) {
  const parsed = ID_Z.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Invalid reminder." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };
  const { error } = await supabase
    .from("actionable_reminders")
    .update({ last_launched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidate();
  return { ok: true as const };
}

export async function rescheduleActionableReminderAction(input: unknown) {
  const parsed = RESCHEDULE_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose a valid date." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { data, error: readError } = await supabase
    .from("actionable_reminders")
    .select("id,default_reschedule_days")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !data) return { ok: false as const, error: readError?.message ?? "Reminder not found." };

  const next = parsed.data.date ?? rescheduleDate({ default_reschedule_days: data.default_reschedule_days }, parsed.data.today);
  const { error } = await supabase
    .from("actionable_reminders")
    .update({ next_due_date: next, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidate();
  return { ok: true as const, data: { nextDueDate: next } };
}

export async function completeActionableReminderAction(input: unknown) {
  const parsed = COMPLETE_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid completion." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { data, error: readError } = await supabase
    .from("actionable_reminders")
    .select("id,next_due_date,recurrence_days,default_reschedule_days")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !data) return { ok: false as const, error: readError?.message ?? "Reminder not found." };

  const next = nextDateAfterCompletion(data, parsed.data.completedOn);
  const patch = next
    ? { next_due_date: next, last_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { active: false, last_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("actionable_reminders")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidate();
  return { ok: true as const, data: { nextDueDate: next } };
}

export async function deleteActionableReminderAction(id: string) {
  const parsed = ID_Z.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Invalid reminder." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };
  const { error } = await supabase.from("actionable_reminders").delete().eq("id", parsed.data).eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidate();
  return { ok: true as const };
}

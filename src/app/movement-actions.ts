"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/integrations/supabase/server";
import {
  buildMovementSnapshot,
  type MovementActivity,
  type MovementSnapshot,
} from "@/domain/movement-variety";

const DATE_Z = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ACTIVITY_Z = z.enum(["swim", "run", "skate", "hike", "walk", "bike", "other"]);
const LOG_Z = z.object({ activity: ACTIVITY_Z, happenedOn: DATE_Z });
const PREFERENCES_Z = z.object({ enabled: z.boolean(), nudgeAfterDays: z.number().int().min(1).max(7) });

export interface MovementVarietyView {
  ready: boolean;
  enabled: boolean;
  nudgeAfterDays: number;
  snapshot: MovementSnapshot | null;
}

function tableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "42P01" || Boolean(error?.message?.includes("movement_"));
}

async function context() {
  const { user } = await requireUser();
  if (!user) throw new Error("Not signed in.");
  const admin = await createAdminClient();
  if (!admin) throw new Error("Server database access is not configured.");
  return { user, admin };
}

async function loadMovementView(userId: string, today: string): Promise<MovementVarietyView> {
  const admin = await createAdminClient();
  if (!admin) throw new Error("Server database access is not configured.");

  const [{ data: preferences, error: preferenceError }, { data: logs, error: logError }] = await Promise.all([
    admin
      .from("movement_preferences")
      .select("enabled,nudge_after_days")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("movement_activity_log")
      .select("activity,happened_on")
      .eq("user_id", userId)
      .lte("happened_on", today)
      .order("happened_on", { ascending: false })
      .limit(250),
  ]);

  if (tableMissing(preferenceError) || tableMissing(logError)) {
    return { ready: false, enabled: true, nudgeAfterDays: 2, snapshot: null };
  }
  if (preferenceError) throw preferenceError;
  if (logError) throw logError;

  const enabled = preferences?.enabled ?? true;
  const nudgeAfterDays = preferences?.nudge_after_days ?? 2;
  const snapshot = buildMovementSnapshot(
    (logs ?? []).map((row) => ({
      activity: row.activity as MovementActivity,
      happenedOn: String(row.happened_on),
    })),
    today,
    nudgeAfterDays
  );

  return { ready: true, enabled, nudgeAfterDays, snapshot };
}

export async function getMovementVarietyAction(todayInput: string) {
  const today = DATE_Z.safeParse(todayInput);
  if (!today.success) return { ok: false as const, error: "Invalid local date." };

  try {
    const { user } = await context();
    return { ok: true as const, data: await loadMovementView(user.id, today.data) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Movement options could not be loaded." };
  }
}

export async function logMovementActivityAction(input: unknown) {
  const parsed = LOG_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose a movement option and valid date." };

  try {
    const { user, admin } = await context();
    const { error } = await admin.from("movement_activity_log").upsert(
      {
        user_id: user.id,
        activity: parsed.data.activity,
        happened_on: parsed.data.happenedOn,
        source: "manual",
      },
      { onConflict: "user_id,activity,happened_on" }
    );
    if (error) throw error;
    return { ok: true as const, data: await loadMovementView(user.id, parsed.data.happenedOn) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Movement could not be logged." };
  }
}

export async function saveMovementPreferencesAction(input: unknown, todayInput: string) {
  const parsed = PREFERENCES_Z.safeParse(input);
  const today = DATE_Z.safeParse(todayInput);
  if (!parsed.success || !today.success) return { ok: false as const, error: "Check the movement reminder settings." };

  try {
    const { user, admin } = await context();
    const { error } = await admin.from("movement_preferences").upsert({
      user_id: user.id,
      enabled: parsed.data.enabled,
      nudge_after_days: parsed.data.nudgeAfterDays,
    });
    if (error) throw error;
    return { ok: true as const, data: await loadMovementView(user.id, today.data) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Movement reminder settings could not be saved." };
  }
}

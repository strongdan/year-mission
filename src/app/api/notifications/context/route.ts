import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildMovementSnapshot, type MovementActivity } from "@/domain/movement-variety";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function tableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "42P01" || Boolean(error?.message?.includes("movement_"));
}

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ ok: false, error: "Invalid local date." }, { status: 400 });
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const [{ data: preferences, error: preferenceError }, { data: logs, error: logError }] = await Promise.all([
    supabase
      .from("movement_preferences")
      .select("enabled,nudge_after_days")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("movement_activity_log")
      .select("activity,happened_on")
      .eq("user_id", user.id)
      .lte("happened_on", date)
      .order("happened_on", { ascending: false })
      .limit(250),
  ]);

  if (tableMissing(preferenceError) || tableMissing(logError)) {
    return NextResponse.json({ ok: true, movement: null });
  }
  if (preferenceError || logError) {
    return NextResponse.json({ ok: true, movement: null });
  }

  const enabled = preferences?.enabled ?? true;
  if (!enabled) return NextResponse.json({ ok: true, movement: null });

  const nudgeAfterDays = preferences?.nudge_after_days ?? 2;
  const snapshot = buildMovementSnapshot(
    (logs ?? []).map((row) => ({
      activity: row.activity as MovementActivity,
      happenedOn: String(row.happened_on),
    })),
    date,
    nudgeAfterDays
  );

  if (!snapshot.overdue) return NextResponse.json({ ok: true, movement: null });

  return NextResponse.json({
    ok: true,
    movement: {
      daysSinceAny: snapshot.daysSinceAny,
      recommendation: snapshot.recommendation.label,
      options: snapshot.options.filter((option) => option.id !== "other").map((option) => option.short),
    },
  });
}

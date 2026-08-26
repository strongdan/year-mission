import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { financeImportSchema } from "@/domain/finance";
import { createAdminClient } from "@/integrations/supabase/server";
import { persistFinanceImport } from "@/services/finance/finance-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ownerIdSchema = z.string().uuid();

function authorized(request: Request): boolean {
  const expected = process.env.YEAR_MISSION_FINANCE_SYNC_TOKEN ?? "";
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected, "utf8");
  const suppliedBytes = Buffer.from(supplied, "utf8");
  if (expectedBytes.length !== suppliedBytes.length) return false;
  return timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const ownerId = ownerIdSchema.safeParse(process.env.YEAR_MISSION_OWNER_USER_ID);
  if (!ownerId.success) {
    console.error("Finance import is missing a valid owner user ID.");
    return NextResponse.json({ error: "Finance import is not configured." }, { status: 503 });
  }

  let payload: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 2_000_000) {
      return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
    }
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = financeImportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Finance payload is invalid." }, { status: 400 });
  }

  const admin = await createAdminClient();
  if (!admin) {
    console.error("Finance import cannot create the server database client.");
    return NextResponse.json({ error: "Finance import is not configured." }, { status: 503 });
  }

  try {
    const result = await persistFinanceImport(ownerId.data, admin, parsed.data);
    console.info("Finance import completed.", {
      provider: parsed.data.provider,
      accounts: result.accounts,
      transactions: result.transactions,
      liabilities: result.liabilities,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Finance import failed.", {
      provider: parsed.data.provider,
      accounts: parsed.data.accounts.length,
      transactions: parsed.data.transactions.length,
      liabilities: parsed.data.liabilities.length,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Finance import failed." }, { status: 500 });
  }
}

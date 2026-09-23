import { createServerClientForApp } from "@/integrations/supabase/server";
import { googleAppUrl } from "@/services/google/config";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerClientForApp();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", googleAppUrl()));
}

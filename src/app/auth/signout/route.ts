import { createServerClientForApp } from "@/integrations/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerClientForApp();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")));
}
import { describe, expect, it, vi } from "vitest";
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { createBrowserClient } from "./client";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
  hasSupabaseConfig: true,
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}));

describe("Supabase browser client", () => {
  it("uses the PKCE-compatible @supabase/ssr browser client", () => {
    const client = createBrowserClient();

    expect(client).toEqual({ auth: {} });
    expect(createSupabaseBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
  });
});

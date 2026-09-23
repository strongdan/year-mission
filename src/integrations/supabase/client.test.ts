import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserClient } from "./client";

const createSupabaseBrowserClient = vi.hoisted(() => vi.fn(() => ({ auth: {} })));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createSupabaseBrowserClient,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseConfig: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
}));

describe("createBrowserClient", () => {
  beforeEach(() => {
    createSupabaseBrowserClient.mockClear();
  });

  it("preserves the default Supabase browser client behavior", () => {
    createBrowserClient();

    expect(createSupabaseBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
    );
  });

  it("enables implicit flow only when explicitly requested", () => {
    createBrowserClient({ flowType: "implicit" });

    expect(createSupabaseBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      { auth: { flowType: "implicit" } },
    );
  });
});

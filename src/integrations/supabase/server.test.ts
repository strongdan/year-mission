import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServerClientForMiddleware } from "./server";

const ssrMocks = vi.hoisted(() => ({
  capturedOptions: null as unknown,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
  hasSupabaseConfig: true,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: unknown) => {
    ssrMocks.capturedOptions = options;
    return { auth: { getClaims: vi.fn() } };
  }),
}));

function middlewareCookies() {
  const options = ssrMocks.capturedOptions as {
    cookies: {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (
        cookies: Array<{ name: string; value: string; options: { path?: string; sameSite?: "lax" } }>,
        headers: Record<string, string>
      ) => void;
    };
  };
  return options.cookies;
}

describe("Supabase middleware client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ssrMocks.capturedOptions = null;
  });

  it("creates a request-specific @supabase/ssr server client from request cookies", () => {
    const request = new NextRequest("https://year.test/", {
      headers: { cookie: "sb-access-token=old-token" },
    });

    createServerClientForMiddleware(request);

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
    expect(middlewareCookies().getAll()).toEqual([
      { name: "sb-access-token", value: "old-token" },
    ]);
  });

  it("updates request cookies and preserves refreshed response cookies and cache headers", () => {
    const request = new NextRequest("https://year.test/");
    const created = createServerClientForMiddleware(request);

    middlewareCookies().setAll(
      [{ name: "sb-access-token", value: "new-token", options: { path: "/", sameSite: "lax" } }],
      {
        "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
        Expires: "0",
        Pragma: "no-cache",
      }
    );

    expect(request.cookies.get("sb-access-token")?.value).toBe("new-token");
    expect(created?.response.cookies.get("sb-access-token")?.value).toBe("new-token");
    expect(created?.response.headers.get("cache-control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0"
    );
    expect(created?.response.headers.get("expires")).toBe("0");
    expect(created?.response.headers.get("pragma")).toBe("no-cache");
  });
});

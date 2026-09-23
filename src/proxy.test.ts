import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

const proxyMocks = vi.hoisted(() => ({
  claimsResult: { data: null, error: new Error("missing session") } as {
    data: { claims: { sub?: string } } | null;
    error: Error | null;
  },
  configureResponse: null as ((response: NextResponse) => void) | null,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseConfig: true,
}));

vi.mock("@/integrations/supabase/server", () => ({
  createServerClientForMiddleware: vi.fn((request: NextRequest) => {
    const response = NextResponse.next({ request });
    proxyMocks.configureResponse?.(response);
    return {
      client: {
        auth: {
          getClaims: vi.fn(async () => proxyMocks.claimsResult),
        },
      },
      get response() {
        return response;
      },
    };
  }),
}));

function request(path: string, cookie?: string) {
  return new NextRequest(`https://year.test${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("auth proxy", () => {
  beforeEach(() => {
    proxyMocks.claimsResult = { data: null, error: new Error("missing session") };
    proxyMocks.configureResponse = null;
  });

  it("redirects unauthenticated / requests to /login", async () => {
    const response = await proxy(request("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://year.test/login?redirect=%2F");
  });

  it("allows authenticated cookie sessions to access /", async () => {
    proxyMocks.claimsResult = { data: { claims: { sub: "user-1" } }, error: null };

    const response = await proxy(request("/", "sb-access-token=valid"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps /auth/callback public", async () => {
    const response = await proxy(request("/auth/callback?code=abc"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps the native callback public and out of authenticated-page redirects", async () => {
    proxyMocks.claimsResult = { data: { claims: { sub: "user-1" } }, error: null };

    const response = await proxy(request("/native-callback#access_token=abc"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("serves only the exact AASA path without auth handling", async () => {
    const response = await proxy(request("/.well-known/apple-app-site-association"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not make neighboring well-known paths public", async () => {
    const response = await proxy(request("/.well-known/other.json"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://year.test/login?redirect=%2F.well-known%2Fother.json");
  });

  it("preserves refreshed cookies on the returned response", async () => {
    proxyMocks.claimsResult = { data: { claims: { sub: "user-1" } }, error: null };
    proxyMocks.configureResponse = (response) => {
      response.cookies.set("sb-access-token", "fresh-token", { path: "/" });
      response.headers.set("Cache-Control", "private, no-store");
    };

    const response = await proxy(request("/", "sb-access-token=old-token"));

    expect(response.cookies.get("sb-access-token")?.value).toBe("fresh-token");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not bounce rapid authenticated navigation back to /login", async () => {
    proxyMocks.claimsResult = { data: { claims: { sub: "user-1" } }, error: null };

    const [first, second] = await Promise.all([
      proxy(request("/", "sb-access-token=valid")),
      proxy(request("/", "sb-access-token=valid")),
    ]);

    expect(first.headers.get("location")).toBeNull();
    expect(second.headers.get("location")).toBeNull();
  });
});

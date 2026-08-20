import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const callbackMocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/integrations/supabase/server", () => ({
  createServerClientForApp: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: callbackMocks.exchangeCodeForSession,
    },
  })),
}));

describe("auth callback route", () => {
  beforeEach(() => {
    callbackMocks.exchangeCodeForSession.mockReset();
  });

  it("exchanges an OAuth code and redirects to /", async () => {
    callbackMocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(new Request("https://year.test/auth/callback?code=abc&next=/"));

    expect(callbackMocks.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://year.test/");
  });

  it("redirects callback failures to a visible non-secret auth error", async () => {
    callbackMocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid OAuth callback code." },
    });

    const response = await GET(new Request("https://year.test/auth/callback?code=bad"));
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("callback");
    expect(location.searchParams.get("message")).toBe("Invalid OAuth callback code.");
  });
});

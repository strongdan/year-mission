import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./page";

describe("login auth error message", () => {
  it("shows callback failure diagnostics when provided", () => {
    expect(getAuthErrorMessage("callback", "Invalid OAuth callback code.")).toBe(
      "Invalid OAuth callback code."
    );
  });

  it("falls back to a provider-neutral sign-in error", () => {
    expect(getAuthErrorMessage("callback", null)).toBe(
      "Sign-in could not be completed. Try again."
    );
  });
});

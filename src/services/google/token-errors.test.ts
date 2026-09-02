import { describe, expect, it } from "vitest";
import { googleReconnectMessage, isGoogleReconnectRequired } from "./token-errors";

describe("Google token error classification", () => {
  it("recognizes revoked or expired refresh tokens", () => {
    expect(isGoogleReconnectRequired(new Error('Google token exchange failed (400): {"error":"invalid_grant","error_description":"Token has been expired or revoked."}'))).toBe(true);
    expect(isGoogleReconnectRequired(new Error("Token has been revoked"))).toBe(true);
  });

  it("does not turn unrelated Google failures into reconnects", () => {
    expect(isGoogleReconnectRequired(new Error("Google Tasks API failed (503)."))).toBe(false);
  });

  it("returns user-facing reconnect copy without raw OAuth payloads", () => {
    expect(googleReconnectMessage()).toBe(
      "Google authorization expired. Reconnect Google to resume Tasks and Calendar sync."
    );
  });
});

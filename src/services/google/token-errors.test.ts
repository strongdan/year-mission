import { describe, expect, it } from "vitest";
import { GoogleOAuthError, googleReconnectMessage, isGoogleReconnectRequired } from "./token-errors";

describe("Google token error classification", () => {
  it("recognizes typed invalid_grant responses", () => {
    expect(isGoogleReconnectRequired(new GoogleOAuthError(400, "invalid_grant", "Token has been expired or revoked."))).toBe(true);
  });

  it("recognizes legacy revoked or expired refresh-token messages", () => {
    expect(isGoogleReconnectRequired(new Error('Google token exchange failed (400): {"error":"invalid_grant"}'))).toBe(true);
    expect(isGoogleReconnectRequired(new Error("Token has been revoked"))).toBe(true);
  });

  it("does not turn unrelated Google failures into reconnects", () => {
    expect(isGoogleReconnectRequired(new GoogleOAuthError(429, "rate_limit_exceeded", "Try later"))).toBe(false);
    expect(isGoogleReconnectRequired(new Error("Google Tasks API failed (503)."))).toBe(false);
  });

  it("returns user-facing reconnect copy without raw OAuth payloads", () => {
    expect(googleReconnectMessage()).toBe(
      "Google authorization expired or was revoked. Reconnect Google to resume Tasks and Calendar sync."
    );
  });
});

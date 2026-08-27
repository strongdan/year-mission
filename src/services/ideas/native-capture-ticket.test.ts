import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { issueNativeCaptureTicket, verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

const KEY = Buffer.alloc(32, 7).toString("base64");

beforeEach(() => {
  process.env.INTEGRATION_SECRETS_KEY = KEY;
});

afterEach(() => {
  delete process.env.INTEGRATION_SECRETS_KEY;
});

describe("native capture tickets", () => {
  it("round-trips a short-lived user ticket", () => {
    const issued = issueNativeCaptureTicket("user-123", 1_000);
    const payload = verifyNativeCaptureTicket(issued.ticket, 2_000);
    expect(payload.uid).toBe("user-123");
    expect(payload.exp).toBeGreaterThan(2_000);
  });

  it("rejects tampering", () => {
    const issued = issueNativeCaptureTicket("user-123", 1_000);
    const [payload, signature] = issued.ticket.split(".");
    expect(() => verifyNativeCaptureTicket(`${payload}x.${signature}`, 2_000)).toThrow(/invalid/i);
  });

  it("rejects expired tickets", () => {
    const issued = issueNativeCaptureTicket("user-123", 1_000);
    expect(() => verifyNativeCaptureTicket(issued.ticket, 700_000)).toThrow(/expired/i);
  });
});

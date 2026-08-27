import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TICKET_TTL_MS = 10 * 60 * 1000;
const VERSION = 1;

interface NativeCaptureTicketPayload {
  v: number;
  uid: string;
  exp: number;
  nonce: string;
}

function signingKey(): Buffer {
  const encoded = process.env.INTEGRATION_SECRETS_KEY ?? process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("Native capture signing is not configured. Set INTEGRATION_SECRETS_KEY (32 bytes, base64) or GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }
  return key;
}

function sign(payloadPart: string): string {
  return createHmac("sha256", signingKey()).update(payloadPart).digest("base64url");
}

export function issueNativeCaptureTicket(userId: string, nowMs = Date.now()) {
  const payload: NativeCaptureTicketPayload = {
    v: VERSION,
    uid: userId,
    exp: nowMs + TICKET_TTL_MS,
    nonce: randomBytes(12).toString("base64url"),
  };
  const payloadPart = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return {
    ticket: `${payloadPart}.${sign(payloadPart)}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export function verifyNativeCaptureTicket(ticket: string, nowMs = Date.now()): NativeCaptureTicketPayload {
  const [payloadPart, signaturePart, extra] = ticket.split(".");
  if (!payloadPart || !signaturePart || extra) throw new Error("Malformed native capture ticket.");

  const expected = Buffer.from(sign(payloadPart), "utf8");
  const actual = Buffer.from(signaturePart, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid native capture ticket.");
  }

  let payload: NativeCaptureTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as NativeCaptureTicketPayload;
  } catch {
    throw new Error("Malformed native capture ticket.");
  }

  if (payload.v !== VERSION || typeof payload.uid !== "string" || !payload.uid || typeof payload.exp !== "number" || typeof payload.nonce !== "string") {
    throw new Error("Invalid native capture ticket.");
  }
  if (payload.exp < nowMs) throw new Error("Native capture ticket expired. Start narration again from Year Mission.");
  return payload;
}

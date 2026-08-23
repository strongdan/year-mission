import "server-only";

import { createPrivateKey, sign } from "node:crypto";

function base64url(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

function vapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:year-mission@example.invalid";
  if (!publicKey || !privateKey) throw new Error("Web push is not configured.");
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function vapidJwt(endpoint: string): { token: string; publicKey: string } {
  const { publicKey, privateKey, subject } = vapidConfig();
  const publicBytes = Buffer.from(publicKey, "base64url");
  const privateBytes = Buffer.from(privateKey, "base64url");

  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY must be an uncompressed P-256 public key.");
  }
  if (privateBytes.length !== 32) {
    throw new Error("VAPID_PRIVATE_KEY must be a 32-byte P-256 private scalar.");
  }

  const x = publicBytes.subarray(1, 33);
  const y = publicBytes.subarray(33, 65);
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: base64url(x),
      y: base64url(y),
      d: base64url(privateBytes),
    },
    format: "jwk",
  });

  const header = base64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64url(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: subject,
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });

  return { token: `${unsigned}.${base64url(signature)}`, publicKey };
}

export async function sendEmptyWebPush(endpoint: string): Promise<{ ok: boolean; expired: boolean; status: number }> {
  const { token, publicKey } = vapidJwt(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${token}, k=${publicKey}`,
      TTL: "300",
      Urgency: "normal",
    },
  });

  return {
    ok: response.ok,
    expired: response.status === 404 || response.status === 410,
    status: response.status,
  };
}

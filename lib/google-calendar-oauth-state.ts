import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 15 * 60 * 1000;

function stateSecret(): string {
  const key = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) throw new Error("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY missing");
  return key;
}

export function signGoogleCalendarOAuthState(userId: string): string {
  const exp = Date.now() + STATE_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${userId}:${exp}:${nonce}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyGoogleCalendarOAuthState(state: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const [userId, expStr] = payload.split(":");
    if (!userId || !expStr) return null;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    return { userId };
  } catch {
    return null;
  }
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  const raw = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY missing");
  return createHash("sha256").update(raw, "utf8").digest();
}

/** Chiffrement AES-256-GCM : iv (12) + authTag (16) + ciphertext, encodé base64url. */
export function encryptGoogleRefreshToken(plain: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptGoogleRefreshToken(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  if (buf.length < 28) throw new Error("invalid_encrypted_token");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = encryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

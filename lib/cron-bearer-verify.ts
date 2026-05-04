import { timingSafeEqual } from "node:crypto";

/** Comparaison en temps constant contre fuite du secret par timing sur le préfixe Bearer. */

export function cronBearerVerify(expectedSecret: string, authorizationHeader: string | null): boolean {
  const a = Buffer.from(`Bearer ${expectedSecret}`, "utf8");
  const raw = authorizationHeader ?? "";
  const b = Buffer.from(raw, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

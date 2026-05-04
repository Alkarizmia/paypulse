/** Fenêtre fixe très simple — utile contre abus léger dans un même isolate Node (voir README pour limites en serverless distribué). */

type Bucket = number[];

const store = new Map<string, Bucket>();
const LAST_PRUNE_AT = new Map<string, number>();
const PRUNE_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 2000;

function pruneStale(key: string, windowMs: number, now: number) {
  const last = LAST_PRUNE_AT.get(key) ?? 0;
  if (now - last < PRUNE_INTERVAL_MS) return;
  LAST_PRUNE_AT.set(key, now);
  const b = store.get(key);
  if (!b) return;
  const kept = b.filter((t) => now - t < windowMs);
  if (kept.length === 0) store.delete(key);
  else store.set(key, kept);
}

/**
 * Retourne true si la limite est dépassée (requête doit être bloquée).
 */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  pruneStale(key, windowMs, now);

  if (store.size > MAX_BUCKETS && Math.random() < 0.02) {
    for (const [k, timestamps] of store) {
      const kept = timestamps.filter((t) => now - t < windowMs);
      if (kept.length === 0) store.delete(k);
      else store.set(k, kept);
    }
  }

  let bucket = store.get(key) ?? [];
  bucket = bucket.filter((t) => now - t < windowMs);
  if (bucket.length >= max) {
    store.set(key, bucket);
    return true;
  }
  bucket.push(now);
  store.set(key, bucket);
  return false;
}

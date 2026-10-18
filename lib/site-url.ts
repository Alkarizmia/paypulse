/**
 * URL absolue du site pour metadata, sitemap, robots, OG.
 * En production, NEXT_PUBLIC_SITE_URL est obligatoire.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
  }
  return "http://localhost:3000";
}

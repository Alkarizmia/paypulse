import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Public marketing and legal pages only (no auth / dashboard). */
const ROUTES = [
  "",
  "/signup",
  "/a-propos",
  "/contact",
  "/legal",
  "/mentions-legales",
  "/privacy",
  "/terms",
  "/droits-securite-donnees",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  return ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/signup" ? 0.8 : 0.6,
  }));
}

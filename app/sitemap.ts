import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Pages marketing publiques uniquement (pas d'auth / dashboard). */
const ROUTES = [
  "",
  "/a-propos",
  "/contact",
  "/legal",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
  "/droits-securite-donnees",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  return ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}

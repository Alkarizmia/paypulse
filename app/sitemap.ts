import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/dashboard",
  "/login",
  "/signup",
  "/legal",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
  "/droits-securite-donnees",
  "/free",
  "/gratuit",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  return ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}

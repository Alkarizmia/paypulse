import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/settings", "/api", "/invite", "/auth", "/admin"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

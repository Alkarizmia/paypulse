import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/signup", "/settings", "/api", "/invite", "/auth"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

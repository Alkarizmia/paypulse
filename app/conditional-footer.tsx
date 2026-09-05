"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/dashboard")
  ) {
    return null;
  }
  return <SiteFooter />;
}

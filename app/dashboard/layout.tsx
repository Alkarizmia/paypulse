import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { WorkspaceProvider } from "@/app/workspace-context";
import { DASHBOARD_SIDEBAR_RAIL_COOKIE, parseSidebarRailCookie } from "@/lib/dashboard-sidebar-cookie";
import { SidebarRailProvider } from "./sidebar-rail-provider";

export const metadata: Metadata = {
  title: "Dashboard | PayPulss",
  description: "Private PayPulss workspace for invoices, clients, and reminders.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const initialCollapsed = parseSidebarRailCookie(jar.get(DASHBOARD_SIDEBAR_RAIL_COOKIE)?.value);

  return (
    <WorkspaceProvider>
      <SidebarRailProvider initialCollapsed={initialCollapsed}>{children}</SidebarRailProvider>
    </WorkspaceProvider>
  );
}

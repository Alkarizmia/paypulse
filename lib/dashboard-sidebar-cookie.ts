/** Cookie for dashboard sidebar rail (collapsed) state. Read on the server to avoid width flash. */
export const DASHBOARD_SIDEBAR_RAIL_COOKIE = "pp-dash-sidebar-rail";

export function parseSidebarRailCookie(value: string | undefined | null): boolean {
  return value === "1";
}

export function writeSidebarRailCookie(collapsed: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${DASHBOARD_SIDEBAR_RAIL_COOKIE}=${collapsed ? "1" : "0"};path=/;max-age=${maxAge};SameSite=Lax`;
}

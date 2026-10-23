"use client";

import { createContext, useContext, type ReactNode } from "react";

const SidebarRailContext = createContext(false);

export function SidebarRailProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarRailContext.Provider value={initialCollapsed}>{children}</SidebarRailContext.Provider>
  );
}

export function useInitialSidebarRail(): boolean {
  return useContext(SidebarRailContext);
}

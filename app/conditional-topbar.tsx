"use client";

import { GlobalTopBar } from "./global-topbar";

/** Barre unique sur toutes les routes (évite double header sur la landing). */
export function ConditionalTopBar() {
  return <GlobalTopBar />;
}

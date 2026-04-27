import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/app/workspace-context";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/app/workspace-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

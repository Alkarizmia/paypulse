import type { Metadata } from "next";
import { ReminderTemplatesView } from "./reminder-templates-view";

export const metadata: Metadata = {
  title: "Reminder Templates | PayPulss",
  description: "Customize reminder email drafts and templates (Pro / Agency).",
};

export default function ModelesRelancePage() {
  return <ReminderTemplatesView />;
}

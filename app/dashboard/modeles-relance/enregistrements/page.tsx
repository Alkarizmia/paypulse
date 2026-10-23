import type { Metadata } from "next";
import { AutoRemindersRegistryView } from "../auto-reminders-registry-view";

export const metadata: Metadata = {
  title: "Auto Reminder Registry | PayPulss",
  description: "Saved auto-reminder templates and day offsets PayPulss will send.",
};

export default function EnregistrementsRelancesPage() {
  return <AutoRemindersRegistryView />;
}

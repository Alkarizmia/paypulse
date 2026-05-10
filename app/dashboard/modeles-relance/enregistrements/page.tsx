import type { Metadata } from "next";
import { AutoRemindersRegistryView } from "../auto-reminders-registry-view";

export const metadata: Metadata = {
  title: "Enregistrement relances auto | PayPulss",
  description: "Ce que PayPulss enverra réellement : modèles enregistrés et délais J+n.",
};

export default function EnregistrementsRelancesPage() {
  return <AutoRemindersRegistryView />;
}

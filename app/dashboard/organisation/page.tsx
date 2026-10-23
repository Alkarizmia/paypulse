import type { Metadata } from "next";
import { OrganisationView } from "./organisation-view";

export const metadata: Metadata = {
  title: "Organization | PayPulss",
  description: "Profile, due-date calendar, reminders, and collections overview.",
};

export default function OrganisationPage() {
  return <OrganisationView />;
}

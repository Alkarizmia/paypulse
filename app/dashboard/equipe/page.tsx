import type { Metadata } from "next";
import { EquipeView } from "./equipe-view";

export const metadata: Metadata = {
  title: "Team | PayPulss",
  description: "Invite teammates and manage roles on Pro and Agency plans.",
};

export default function EquipePage() {
  return <EquipeView />;
}

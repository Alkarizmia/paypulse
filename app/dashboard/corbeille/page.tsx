import type { Metadata } from "next";
import { TrashView } from "./trash-view";

export const metadata: Metadata = {
  title: "Trash | PayPulss",
  description: "Deleted invoices: restore them or erase them permanently.",
};

export default function CorbeillePage() {
  return <TrashView />;
}

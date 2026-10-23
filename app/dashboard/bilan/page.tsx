import type { Metadata } from "next";
import { BilanView } from "./bilan-view";

export const metadata: Metadata = {
  title: "Invoice Summary | PayPulss",
  description: "Review invoice totals over 7, 30, 90 days, or 1 year.",
};

export default function BilanPage() {
  return <BilanView />;
}

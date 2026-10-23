import { permanentRedirect } from "next/navigation";

/** Legacy French URL; canonical English page is /terms. */
export default function ConditionsUtilisationRedirectPage() {
  permanentRedirect("/terms");
}

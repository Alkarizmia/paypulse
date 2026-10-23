import { permanentRedirect } from "next/navigation";

/** Legacy French URL; canonical English page is /privacy. */
export default function ConfidentialiteRedirectPage() {
  permanentRedirect("/privacy");
}

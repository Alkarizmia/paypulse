import { isGoogleCalendarConfigured } from "@/lib/google-calendar-config";

/** Connexion Google Calendar disponible quand OAuth + chiffrement sont configurés côté serveur. */
export function isGoogleCalendarConnectEnabled(): boolean {
  return isGoogleCalendarConfigured();
}

import type { AccountRole } from "@/lib/team";

/** Droits d’un utilisateur connecté sur le compte d’un propriétaire (invitation acceptée). */
export function collaboratorAccessFlags(
  isActingAsMember: boolean,
  role: AccountRole | null,
): {
  /** Pas d’ajout client, corbeille, prochain cycle. */
  noClientManagement: boolean;
  /** Pas de marquer payé, relance, modification facture. */
  invoiceReadOnly: boolean;
} {
  if (!isActingAsMember || !role) {
    return { noClientManagement: false, invoiceReadOnly: false };
  }
  if (role === "admin") {
    return { noClientManagement: false, invoiceReadOnly: false };
  }
  if (role === "spectator") {
    return { noClientManagement: true, invoiceReadOnly: true };
  }
  return { noClientManagement: true, invoiceReadOnly: false };
}

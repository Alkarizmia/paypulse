export type ClientStatus = "paid" | "unpaid";

/** Encaissement reconnu (conserve le bilan quand la fiche repasse en impayé pour le mois suivant). */
export type ClientPaidEvent = {
  at: string;
  amount: number;
};

export type Client = {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  amountDue: number;
  dueDate: string;
  status: ClientStatus;
  /** ISO : création de la ligne (analytics). */
  createdAt?: string;
  /** ISO : marqué payé (encaissements réels par mois). */
  paidAt?: string | null;
  /** Historique d’encaissements (graphiques / bilan). */
  paidEvents?: ClientPaidEvent[];
  /** ISO : corbeille — exclus des graphiques / bilan tant que présent. */
  deletedAt?: string | null;
};

"use client";

import type { PlanCapabilities } from "@/lib/plans";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

type Props = {
  locale: "fr" | "en";
  caps: PlanCapabilities;
  appearance: UiResolvedAppearance;
  /** Préférence utilisateur (toggle), combinée avec caps.autoReminders. */
  autoRemindersUserEnabled?: boolean;
  onAutoRemindersUserEnabledChange?: (enabled: boolean) => void;
  /** Portefeuilles (Agency), données réelles pour la carte. */
  workspaces?: { id: string; name: string }[];
};

function getTierCopy(locale: "fr" | "en") {
  return locale === "fr"
    ? {
        relanceTitle: "Relances par e-mail",
        relanceLead:
          "PayPulss n’envoie pas les e-mails à votre place : le bouton « Envoyer relance » ouvre un brouillon dans votre messagerie (mailto).",
        relanceFree:
          "Sur ce plan, ouvrez chaque relance depuis la ligne facture : texte prêt à adapter, envoi depuis votre propre adresse.",
        relanceToggle: "Ligne d’info dans le brouillon",
        relanceExplainOn:
          "Activé : une courte phrase peut être ajoutée au corps du mail pour évoquer une prochaine relance (ex. sous 3 jours). Aucun envoi automatique ni relance programmée côté serveur.",
        relanceExplainOff:
          "Désactivé : le brouillon ne contiendra pas cette phrase. Réactivez l’option ci-dessus si vous souhaitez la conserver.",
        teamTitle: "Équipe",
        teamBody:
          "Invitations et rôles (facturation / lecture seule), à gérer dans Paramètres. Le nombre de comptes actifs suit vos invitations acceptées.",
        workspaceTitle: "Espaces clients",
        wsEmpty: "Aucun portefeuille chargé. Ouvrez Paramètres pour en créer.",
        autoTitle: "Automatisation avancée",
        autoBody:
          "Webhooks sortants et exports CSV planifiés : prévus sur l’offre Agence ; branchement produit à finaliser (pas encore disponible dans l’app).",
      }
    : {
        relanceTitle: "Email reminders",
        relanceLead:
          "PayPulss does not send mail for you: “Send reminder” opens a draft in your mail app (mailto).",
        relanceFree:
          "On this plan, open each reminder from the invoice row: editable text, you send from your own address.",
        relanceToggle: "Info line in draft",
        relanceExplainOn:
          "On: a short line may be appended to the mail body about a possible next reminder (e.g. in 3 days). No automatic send and no server-side scheduling.",
        relanceExplainOff:
          "Off: drafts won’t include that line. Turn the option on above if you want it.",
        teamTitle: "Team",
        teamBody:
          "Invites and roles (billing / read-only), manage in Settings. Active seats follow accepted invitations.",
        workspaceTitle: "Client workspaces",
        wsEmpty: "No wallets loaded yet. Open Settings to create one.",
        autoTitle: "Advanced automation",
        autoBody:
          "Outgoing webhooks and scheduled CSV exports: planned on the Agency tier; in-app wiring still pending (not available yet).",
      };
}

export function DashboardRelancePanel({
  locale,
  caps,
  appearance,
  autoRemindersUserEnabled = true,
  onAutoRemindersUserEnabledChange,
}: Props) {
  const t = getTierCopy(locale);
  const light = appearance === "light";
  const planAllows = caps.autoReminders;
  const effective = planAllows && autoRemindersUserEnabled;

  const detailText = !planAllows ? t.relanceFree : effective ? t.relanceExplainOn : t.relanceExplainOff;

  return (
    <section
      className={`pp-dashboard-card-interactive rounded-2xl border p-6 ${
        light
          ? "border-slate-200 bg-white shadow-sm hover:border-violet-300/60"
          : "border-white/[0.08] bg-[#14141c] shadow-none hover:border-violet-500/35"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <h2 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.relanceTitle}</h2>
            <p className={`mt-1 text-xs leading-relaxed ${light ? "text-slate-600" : "text-slate-400"}`}>{t.relanceLead}</p>
          </div>
          {planAllows && onAutoRemindersUserEnabledChange ? (
            <div
              className={`flex shrink-0 flex-col items-end gap-1.5 rounded-xl border px-3 py-2 ${
                light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/35"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${light ? "text-slate-700" : "text-slate-300"}`}>{t.relanceToggle}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoRemindersUserEnabled}
                  onClick={() => onAutoRemindersUserEnabledChange(!autoRemindersUserEnabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${autoRemindersUserEnabled ? "bg-violet-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${autoRemindersUserEnabled ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={`rounded-xl border px-4 py-3 text-left text-xs leading-relaxed ${
            light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-black/25 text-slate-300"
          }`}
        >
          {detailText}
        </div>
      </div>
    </section>
  );
}

export function DashboardAddonTierPanels({ locale, caps, appearance, workspaces: workspaceList }: Props) {
  const t = getTierCopy(locale);
  const light = appearance === "light";
  if (!caps.multiWorkspace && !caps.teamManagement && !caps.advancedAutomation) {
    return null;
  }
  const wsRows = workspaceList?.filter((w) => w.name.trim()) ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {caps.multiWorkspace ? (
          <section
            className={`pp-dashboard-card-interactive rounded-2xl border p-5 ${
              light ? "border-rose-200 bg-rose-50 hover:border-rose-300" : "border-rose-500/30 bg-rose-950/30 hover:border-rose-400/35"
            }`}
          >
            <h2 className={`text-sm font-semibold ${light ? "text-rose-900" : "text-rose-200"}`}>{t.workspaceTitle}</h2>
            {wsRows.length === 0 ? (
              <p className={`mt-3 text-xs ${light ? "text-slate-600" : "text-slate-400"}`}>{t.wsEmpty}</p>
            ) : (
              <ul className={`mt-3 space-y-2 text-sm ${light ? "text-slate-700" : "text-slate-200"}`}>
                {wsRows.map((w) => (
                  <li
                    key={w.id}
                    className={`rounded-lg px-3 py-2 ${light ? "bg-white" : "border border-white/10 bg-black/35"}`}
                  >
                    {w.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        {caps.teamManagement ? (
          <section
            className={`pp-dashboard-card-interactive rounded-2xl border p-5 ${
              light ? "border-rose-200 bg-rose-50 hover:border-rose-300" : "border-rose-500/30 bg-rose-950/30 hover:border-rose-400/35"
            }`}
          >
            <h2 className={`text-sm font-semibold ${light ? "text-rose-900" : "text-rose-200"}`}>{t.teamTitle}</h2>
            <p className={`mt-2 text-xs leading-relaxed ${light ? "text-slate-700" : "text-slate-300"}`}>{t.teamBody}</p>
          </section>
        ) : null}
        {caps.advancedAutomation ? (
          <section
            className={`pp-dashboard-card-interactive rounded-2xl border p-5 lg:col-span-1 ${
              light ? "border-rose-200 bg-rose-50 hover:border-rose-300" : "border-rose-500/30 bg-rose-950/30 hover:border-rose-400/35"
            }`}
          >
            <h2 className={`text-sm font-semibold ${light ? "text-rose-900" : "text-rose-200"}`}>{t.autoTitle}</h2>
            <p className={`mt-2 text-xs leading-relaxed ${light ? "text-slate-700" : "text-slate-300"}`}>{t.autoBody}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardTierPanels(props: Props) {
  return (
    <div className="space-y-6">
      <DashboardRelancePanel {...props} />
      <DashboardAddonTierPanels {...props} />
    </div>
  );
}

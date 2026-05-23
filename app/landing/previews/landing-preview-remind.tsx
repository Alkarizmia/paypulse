"use client";

import { useMemo } from "react";
import { EnvelopeSendButton } from "@/app/dashboard/modeles-relance/envelope-send-button";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { LANDING_DEMO_CLIENTS } from "@/lib/landing-demo-clients";
import { getDefaultReminderTemplates } from "@/lib/reminder-templates-storage";
import { pickQuad } from "@/lib/messages/pick";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

export function LandingPreviewRemind({
  locale,
  appearance,
  onToggleAppearance,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
}) {
  const light = appearance === "light";
  const data = useMemo(() => getDefaultReminderTemplates(locale), [locale]);

  const t =
    locale === "fr"
      ? {
          page: "Modèles de relance",
          aiTitle: "Brouillon de relance",
          aiHint:
            "Envoi manuel : rédigez ici, puis ouvrez votre messagerie via l’enveloppe. Rien n’est envoyé automatiquement depuis cette page.",
          subjectLabel: "Objet",
          bodyLabel: "Corps du message",
          sendNow: "Envoyer maintenant",
          envelopeAria: "Ouvrir l’envoi du brouillon par e-mail",
          modalTitle: "Envoyer le brouillon",
          modalHint: "Choisissez les destinataires, puis ouvrez votre messagerie.",
          toLabel: "Destinataire (e-mail)",
          toPlaceholder: "client@exemple.com",
          copy: "Copier tout le message",
          copied: "Copié",
          openMail: "Ouvrir l’application e-mail",
          cancel: "Fermer",
          previewHeading: "Aperçu",
          tabEveryone: "Tout le monde",
          tabList: "Liste",
          tabManual: "Manuel",
          listTitle: "Choisir les destinataires",
          listHint: "Cochez les clients à inclure dans l’envoi.",
          listEmpty: "Aucun client.",
          listOpenMailDisabled: "Sélectionnez au moins un client.",
          everyoneSummary: (n: number) => `${n} adresse(s) en Bcc.`,
          everyoneCapped: (included: number, total: number) => `${included} sur ${total} adresses (plafond plan).`,
          everyoneEmpty: "Aucun client.",
          listSelectedSummary: (rowCount: number, distinct: number, max: number) =>
            `${rowCount} fiche(s) · ${distinct} adresse(s) · max ${max}.`,
          listLimitReached: (max: number) => `Plafond : ${max} adresses.`,
          toggleSelectAria: "Sélectionner",
          mailtoTooLong: "Lien trop long, utilisez Copier.",
          statusPaid: "Payé",
          statusUnpaid: "Impayé",
        }
      : {
          page: "Reminder templates",
          aiTitle: "Reminder draft",
          aiHint: "Manual send: edit here, then open your mail app via the envelope.",
          subjectLabel: "Subject",
          bodyLabel: "Message body",
          sendNow: "Send now",
          envelopeAria: "Open draft in mail app",
          modalTitle: "Send draft",
          modalHint: "Pick recipients, then open your mail app.",
          toLabel: "Recipient (email)",
          toPlaceholder: "client@example.com",
          copy: "Copy full message",
          copied: "Copied",
          openMail: "Open mail app",
          cancel: "Close",
          previewHeading: "Preview",
          tabEveryone: "Everyone",
          tabList: "List",
          tabManual: "Manual",
          listTitle: "Choose recipients",
          listHint: "Check clients to include.",
          listEmpty: "No clients.",
          listOpenMailDisabled: "Select at least one client.",
          everyoneSummary: (n: number) => `${n} address(es) in Bcc.`,
          everyoneCapped: (i: number, total: number) => `${i} of ${total} addresses (plan cap).`,
          everyoneEmpty: "No clients.",
          listSelectedSummary: (rows: number, distinct: number, max: number) =>
            `${rows} row(s) · ${distinct} email(s) · max ${max}.`,
          listLimitReached: (max: number) => `Cap: ${max} addresses.`,
          toggleSelectAria: "Select",
          mailtoTooLong: "Link too long, use Copy.",
          statusPaid: "Paid",
          statusUnpaid: "Unpaid",
        };

  const sectionClass = light
    ? "rounded-2xl border border-violet-200 bg-violet-50/80 p-4 sm:p-5"
    : "rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/40 to-violet-950/30 p-4 sm:p-5";

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${t.page}`}
    >
      <div className="space-y-4 p-3 sm:p-4">
        <section className={sectionClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-semibold ${light ? "text-violet-900" : "text-fuchsia-100"}`}>{t.aiTitle}</h3>
              <p className={`mt-2 text-xs leading-relaxed sm:text-sm ${light ? "text-slate-700" : "text-slate-300"}`}>
                {t.aiHint}
              </p>
            </div>
            <EnvelopeSendButton
              subject={data.draftSubject}
              body={data.draftBody}
              labels={t}
              clients={LANDING_DEMO_CLIENTS}
              locale={locale}
              planId="pro"
            />
          </div>
          <div className="mt-4 space-y-3">
            <label className={`block text-xs font-medium uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-400"}`}>
              {t.subjectLabel}
            </label>
            <input
              type="text"
              readOnly
              value={data.draftSubject}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                light
                  ? "border-slate-200 bg-white text-slate-900"
                  : "border-white/10 bg-black/30 text-violet-100"
              }`}
            />
            <label className={`block text-xs font-medium uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-400"}`}>
              {t.bodyLabel}
            </label>
            <textarea
              readOnly
              value={data.draftBody}
              rows={5}
              className={`w-full resize-none rounded-lg border p-3 text-[13px] leading-relaxed ${
                light
                  ? "border-slate-200 bg-white font-mono text-slate-800"
                  : "border-white/10 bg-black/30 font-mono text-violet-100"
              }`}
            />
          </div>
        </section>
      </div>
    </LandingPreviewShell>
  );
}

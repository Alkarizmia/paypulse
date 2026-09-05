"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/locale-context";
import { useWorkspace } from "@/app/workspace-context";
import {
  listReminderEmailTemplates,
  replaceReminderEmailTemplatesForWorkspace,
  syncReminderRuleDaysFromTemplates,
  type ReminderEmailTemplate,
  type ReminderEmailTemplateInput,
} from "@/lib/reminder-email-templates";
import { getReminderRule, normalizeDaysAfterDue, upsertReminderRule, type ReminderRule } from "@/lib/reminder-rules";
import {
  canUseTemplatePaymentLink,
  getMaxEmailTemplates,
  getMaxReminderJobsPerRun,
  REMINDER_JOBS_PER_RUN_DEFAULT,
} from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { AUTO_REMINDER_FROM_DISPLAY } from "@/lib/auto-reminder-copy";
import { REMINDER_TEMPLATE_VARIABLES_DOC } from "@/lib/reminder-template-substitution";
import type { ReminderTemplateAttachmentMeta } from "@/lib/reminder-template-attachment";
import { TemplateAttachmentField } from "@/app/dashboard/modeles-relance/template-attachment-field";
import type { SupabaseClient } from "@supabase/supabase-js";

const SCHEDULE_CHIPS = [1, 3, 7, 21] as const;

export type AutomationTemplatesPanelProps = {
  supabase: SupabaseClient;
  userId: string;
  planId: PlanId;
  memberReadOnly: boolean;
};

type EditableTemplate = {
  clientId: string;
  daysAfterDue: number;
  subjectTemplate: string;
  bodyTemplate: string;
  paymentLink: string;
  sortOrder: number;
  attachment: ReminderTemplateAttachmentMeta | null;
};

function rowFromDb(t: ReminderEmailTemplate): EditableTemplate {
  const attachment =
    t.attachmentStoragePath && t.attachmentFileName
      ? {
          storagePath: t.attachmentStoragePath,
          fileName: t.attachmentFileName,
          contentType: t.attachmentContentType ?? "application/octet-stream",
          sizeBytes: t.attachmentSizeBytes ?? 0,
        }
      : null;
  return {
    clientId: t.id,
    daysAfterDue: t.daysAfterDue,
    subjectTemplate: t.subjectTemplate,
    bodyTemplate: t.bodyTemplate,
    paymentLink: t.paymentLink ?? "",
    sortOrder: t.sortOrder,
    attachment,
  };
}

function defaultTemplateBodyFr(days: number): string {
  return [
    "Bonjour,",
    "",
    `Petit rappel concernant la facture de {{amount}} € échue le {{dueDate}}.`,
    `Relance programmée automatiquement à J+${days}.`,
    "Merci de nous confirmer la date de règlement.",
    "",
    "Cordialement,",
    "PayPulss",
  ].join("\n");
}

function defaultTemplateBodyEn(days: number): string {
  return [
    "Hello,",
    "",
    `Friendly reminder about the invoice for {{amount}} € due on {{dueDate}}.`,
    `This follow-up is scheduled automatically at J+${days}.`,
    "Please confirm when you expect to pay.",
    "",
    "Regards,",
    "PayPulss",
  ].join("\n");
}

export function AutomationTemplatesPanel({ supabase, userId, planId, memberReadOnly }: AutomationTemplatesPanelProps) {
  const { locale } = useLocale();
  const ws = useWorkspace();
  const maxModels = getMaxEmailTemplates(planId);
  const allowPaymentLink = canUseTemplatePaymentLink(planId);
  const maxJobsCap = useMemo(() => getMaxReminderJobsPerRun(planId), [planId]);
  const showMultiPresets = maxModels > 1;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showRegistryHint, setShowRegistryHint] = useState(false);
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [ruleMax, setRuleMax] = useState(REMINDER_JOBS_PER_RUN_DEFAULT);
  const [rows, setRows] = useState<EditableTemplate[]>([]);

  const workspaceId = ws.activeWorkspaceId;

  const load = useCallback(async () => {
    if (!workspaceId || !supabase) return;
    setLoading(true);
    setMessage(null);
    setShowRegistryHint(false);
    try {
      const [rule, tpls] = await Promise.all([
        getReminderRule(supabase, workspaceId),
        listReminderEmailTemplates(supabase, workspaceId),
      ]);
      if (rule) {
        setRuleEnabled(rule.enabled);
        setRuleMax(Math.max(1, Math.min(rule.maxJobsPerRun, getMaxReminderJobsPerRun(planId))));
      } else {
        setRuleEnabled(true);
        setRuleMax(Math.min(REMINDER_JOBS_PER_RUN_DEFAULT, getMaxReminderJobsPerRun(planId)));
      }
      setRows(tpls.map(rowFromDb));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, workspaceId, planId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setRuleMax((v) => Math.max(1, Math.min(v, maxJobsCap)));
  }, [maxJobsCap]);

  const usedDays = useMemo(() => new Set(rows.map((r) => r.daysAfterDue)), [rows]);

  const t =
    locale === "fr"
      ? {
          title: "Relances automatiques",
          hint: "PayPulss envoie automatiquement un e-mail aux factures impayées du portefeuille sélectionné.",
          hintLearnMore: "En savoir plus",
          hintTech: `L’expéditeur affiché est en général ${AUTO_REMINDER_FROM_DISPLAY} (ou votre domaine s’il est configuré). L’envoi part d’une tâche automatique régulière qui vérifie les échéances. Les délais J+n se calculent à partir de la date d’échéance, puis le message part souvent le matin (fuseau Paris).`,
          enable: "Activer les relances automatiques pour ce portefeuille",
          daysTitle: "Délais après la date d’échéance (J+n)",
          daysExpl: "Choisissez le nombre de jours après l’échéance avant chaque relance automatique.",
          preset37: "Préréglage : J+3 · 7 · 21",
          preset137: "Préréglage : J+1 · 3 · 7 · 21",
          maxRun: "Plafond d’envois par passage",
          maxRunExpl: (cap: number) =>
            `Nombre maximum de relances automatiques envoyées d’un coup pour ce portefeuille (limite du plan : ${cap}).`,
          save: "Enregistrer les règles et modèles",
          modelsTitle: "Modèles d’e-mails",
          unpaidOnlyHint:
            "Les relances automatiques et les modèles ci-dessous s’appliquent aux factures impayées uniquement. Pour une fiche payée, la relance manuelle utilise le brouillon (objet + corps) plus bas sur cette page.",
          quota: (n: number, m: number) => `Modèles enregistrés : ${n} / ${m}`,
          senderLine: `Ajouter un ou plusieurs messages : ils seront envoyés automatiquement par ${AUTO_REMINDER_FROM_DISPLAY} aux adresses clients en retard.`,
          add: "Ajouter un modèle",
          remove: "Supprimer ce modèle",
          delay: "Délai J+",
          subject: "Objet (sujet)",
          body: "Corps du message",
          link: "Lien de paiement (optionnel)",
          attachmentTitle: "Pièce jointe (optionnelle)",
          attachmentChoose: "Parcourir les fichiers",
          attachmentReplace: "Changer de fichier",
          attachmentRemove: "Retirer",
          attachmentUploading: "Envoi…",
          attachmentNone: "Aucune pièce jointe pour ce modèle.",
          attachmentAttached: (name: string, size: string) => `Fichier : ${name} (${size})`,
          linkLockedHint:
            "Plans Pro et Agence : champ séparé « lien de paiement » avec mise en avant cliquable en bas du mail. Sur Starter, ce champ est absent ; vous pouvez quand même saisir une URL https dans le corps. PayPulss envoie la relance en texte brut (sans HTML). Le destinataire copie-collera le lien s’il y en a.",
          starterBodyUrlsHint:
            "Sur Starter, évitez de compter sur un « joli lien bleu » : le message est envoyé en texte brut — ce qui aide à éviter confusion avec nos liens paiement réservés Pro/Agence. Le client peut tout de même sélectionner l’URL dans le mail et la copier dans son navigateur.",
          vars: "Variables que le serveur remplacera automatiquement : " + REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          registryHint: (
            <>
              Voir&nbsp;
              <Link href="/dashboard/modeles-relance/enregistrements" className="font-semibold text-blue-700 underline hover:text-blue-800">
                la synthèse de ce qui sera envoyé aux clients
              </Link>
              .
            </>
          ),
          readonly: "Lecture seule, membre invité.",
          pickDay: "Choisissez un J+ libre pour le nouveau modèle.",
          quotaBlock: "Quota atteint pour votre plan.",
        }
      : {
          title: "Automatic reminders",
          hint: "PayPulss automatically emails unpaid invoices in the selected wallet.",
          hintLearnMore: "Learn more",
          hintTech: `Clients usually see ${AUTO_REMINDER_FROM_DISPLAY} (or your domain if configured). Sends run on a regular automatic check of due dates. J+n delays are counted from the due date, then the message typically goes out in the morning (Paris time).`,
          enable: "Enable automatic reminders for this wallet",
          daysTitle: "Delays after the due date (J+n)",
          daysExpl: "Choose how many days after the due date each automatic reminder should wait.",
          preset37: "Preset: J+3 · 7 · 21",
          preset137: "Preset: J+1 · 3 · 7 · 21",
          maxRun: "Max reminders per run",
          maxRunExpl: (cap: number) =>
            `Maximum automatic reminders sent at once for this wallet (plan limit: ${cap}).`,
          save: "Save rules and templates",
          modelsTitle: "Email templates",
          unpaidOnlyHint:
            "Automatic reminders and the templates below apply to unpaid invoices only. For a paid row, the manual reminder uses the draft (subject + body) further down this page.",
          quota: (n: number, m: number) => `Saved templates: ${n} / ${m}`,
          senderLine: `Add one or more messages: PayPulss sends them automatically from ${AUTO_REMINDER_FROM_DISPLAY} to overdue client emails.`,
          add: "Add template",
          remove: "Remove template",
          delay: "Delay J+",
          subject: "Subject",
          body: "Message body",
          link: "Payment link (optional)",
          attachmentTitle: "Attachment (optional)",
          attachmentChoose: "Browse files",
          attachmentReplace: "Change file",
          attachmentRemove: "Remove",
          attachmentUploading: "Uploading…",
          attachmentNone: "No attachment for this template.",
          attachmentAttached: (name: string, size: string) => `File: ${name} (${size})`,
          linkLockedHint:
            "Pro / Agency unlock a dedicated payment-link field rendered as an obvious clickable block. Starter hides that field—you can paste an https URL in the body instead. Starter uses plain-text email (no HTML) so recipients usually copy links manually.",
          starterBodyUrlsHint:
            "Starter skips HTML for auto reminders—expect plain text URLs. Recipients highlight the URL if their mail client does not autopaste it.",
          vars: "Server replaces these placeholders: " + REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          registryHint: (
            <>
              View{" "}
              <Link href="/dashboard/modeles-relance/enregistrements" className="font-semibold text-blue-700 underline hover:text-blue-800">
                the summary clients will receive
              </Link>
              .
            </>
          ),
          readonly: "Read-only, invited member.",
          pickDay: "Pick a free J+ for the new template.",
          quotaBlock: "Plan template limit reached.",
        };

  function applyPreset(days: number[]) {
    if (memberReadOnly) return;
    const norm = normalizeDaysAfterDue(days);
    const next: EditableTemplate[] = [];
    let order = 0;
    for (const d of norm) {
      if (next.length >= maxModels) break;
      next.push({
        clientId: `new-${d}-${Date.now()}`,
        daysAfterDue: d,
        subjectTemplate: `Rappel J+${d}, facture en attente ({{clientName}})`,
        bodyTemplate: locale === "fr" ? defaultTemplateBodyFr(d) : defaultTemplateBodyEn(d),
        paymentLink: "",
        sortOrder: order++,
        attachment: null,
      });
    }
    setRows(next);
  }

  function addRow() {
    if (memberReadOnly) return;
    if (rows.length >= maxModels) {
      setMessage(t.quotaBlock);
      return;
    }
    const free = SCHEDULE_CHIPS.find((d) => !usedDays.has(d));
    if (free === undefined) {
      setMessage(t.pickDay);
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        clientId: `new-${free}-${Date.now()}`,
        daysAfterDue: free,
        subjectTemplate: `Rappel J+${free}, facture en attente ({{clientName}})`,
        bodyTemplate: locale === "fr" ? defaultTemplateBodyFr(free) : defaultTemplateBodyEn(free),
        paymentLink: "",
        sortOrder: prev.length,
        attachment: null,
      },
    ]);
  }

  async function deleteAttachmentQuiet(path: string) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      await fetch("/api/reminder-template-attachment", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: path }),
      });
    } catch {
      /* best effort */
    }
  }

  function removeRow(clientId: string) {
    if (memberReadOnly) return;
    const row = rows.find((r) => r.clientId === clientId);
    if (row?.attachment?.storagePath) void deleteAttachmentQuiet(row.attachment.storagePath);
    setRows((prev) => prev.filter((r) => r.clientId !== clientId).map((r, i) => ({ ...r, sortOrder: i })));
  }

  function updateRow(clientId: string, patch: Partial<EditableTemplate>) {
    if (memberReadOnly) return;
    setRows((prev) => prev.map((r) => (r.clientId === clientId ? { ...r, ...patch } : r)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || memberReadOnly) return;
    const dup = rows.some((a, i) => rows.findIndex((b) => b.daysAfterDue === a.daysAfterDue) !== i);
    if (dup) {
      setMessage(locale === "fr" ? "Deux modèles ne peuvent pas partager le même J+n." : "Two templates cannot share the same J+n.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const baseRule: ReminderRule =
        (await getReminderRule(supabase, workspaceId)) ??
        ({
          workspaceId,
          ownerUserId: userId,
          enabled: true,
          timezone: "Europe/Paris",
          daysAfterDue: normalizeDaysAfterDue([3, 7, 21]),
          maxJobsPerRun: REMINDER_JOBS_PER_RUN_DEFAULT,
        } satisfies ReminderRule);

      const merged: ReminderRule = {
        ...baseRule,
        enabled: ruleEnabled,
        maxJobsPerRun: Math.max(1, Math.min(ruleMax, maxJobsCap)),
      };

      const inputs: ReminderEmailTemplateInput[] = rows.map((r, i) => ({
        daysAfterDue: r.daysAfterDue,
        subjectTemplate: r.subjectTemplate,
        bodyTemplate: r.bodyTemplate,
        paymentLink: allowPaymentLink ? r.paymentLink.trim() || null : null,
        sortOrder: i,
        attachmentStoragePath: r.attachment?.storagePath ?? null,
        attachmentFileName: r.attachment?.fileName ?? null,
        attachmentContentType: r.attachment?.contentType ?? null,
        attachmentSizeBytes: r.attachment?.sizeBytes ?? null,
      }));

      const saved = await replaceReminderEmailTemplatesForWorkspace(supabase, workspaceId, userId, inputs);
      await syncReminderRuleDaysFromTemplates(supabase, merged, saved);
      setRows(saved.map(rowFromDb));
      setMessage(locale === "fr" ? "Enregistré." : "Saved.");
      setShowRegistryHint(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!workspaceId) {
    return (
      <p className="text-sm text-slate-600">
        {locale === "fr" ? "Sélectionnez un portefeuille." : "Select a workspace."}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-600">{locale === "fr" ? "Chargement…" : "Loading…"}</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
        <div className="mt-2 space-y-2 text-sm text-slate-600">
          <p>{t.hint}</p>
          <details className="rounded-lg border border-border bg-bg-alt px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-700">{t.hintLearnMore}</summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.hintTech}</p>
          </details>
        </div>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={ruleEnabled}
              disabled={memberReadOnly}
              onChange={(e) => setRuleEnabled(e.target.checked)}
            />
            {t.enable}
          </label>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.daysTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.daysExpl}</p>
            {showMultiPresets ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={memberReadOnly}
                  onClick={() => applyPreset([3, 7, 21])}
                  className="pp-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {t.preset37}
                </button>
                <button
                  type="button"
                  disabled={memberReadOnly}
                  onClick={() => applyPreset([1, 3, 7, 21])}
                  className="pp-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {t.preset137}
                </button>
              </div>
            ) : null}
          </div>
          <label className="block text-sm text-slate-700">
            {t.maxRun}
            <input
              type="number"
              min={1}
              max={maxJobsCap}
              disabled={memberReadOnly}
              value={ruleMax}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                const next = Number.isFinite(n) ? n : 1;
                setRuleMax(Math.max(1, Math.min(next, maxJobsCap)));
              }}
              className="pp-field mt-1 w-32 px-3 py-2"
            />
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.maxRunExpl(maxJobsCap)}</p>
          </label>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{t.modelsTitle}</h3>
              <p className="text-xs text-slate-500">{t.quota(rows.length, maxModels)}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{t.unpaidOnlyHint}</p>
            <p className="mt-1 text-xs text-slate-500">{t.vars}</p>
            <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">{t.senderLine}</p>
            <button
              type="button"
              disabled={memberReadOnly || rows.length >= maxModels}
              onClick={addRow}
              className="mt-3 pp-btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {t.add}
            </button>

            <div className="mt-4 space-y-4">
              {rows.map((r) => (
                <div key={r.clientId} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.delay}</span>
                    {!memberReadOnly ? (
                      <button
                        type="button"
                        onClick={() => removeRow(r.clientId)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        {t.remove}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SCHEDULE_CHIPS.map((day) => {
                      const taken = usedDays.has(day) && r.daysAfterDue !== day;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={memberReadOnly || taken}
                          onClick={() => {
                            if (r.daysAfterDue === day) return;
                            if (r.attachment?.storagePath) void deleteAttachmentQuiet(r.attachment.storagePath);
                            updateRow(r.clientId, { daysAfterDue: day, attachment: null });
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            r.daysAfterDue === day
                              ? "border-accent bg-accent text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          }`}
                        >
                          J+{day}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-3 block text-xs font-medium text-slate-600">
                    {t.subject}
                    <input
                      type="text"
                      disabled={memberReadOnly}
                      value={r.subjectTemplate}
                      onChange={(e) => updateRow(r.clientId, { subjectTemplate: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="mt-2 block text-xs font-medium text-slate-600">
                    {t.body}
                    <textarea
                      disabled={memberReadOnly}
                      value={r.bodyTemplate}
                      onChange={(e) => updateRow(r.clientId, { bodyTemplate: e.target.value })}
                      rows={6}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  {planId === "starter" ? <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{t.starterBodyUrlsHint}</p> : null}
                  {allowPaymentLink ? (
                    <label className="mt-2 block text-xs font-medium text-slate-600">
                      {t.link}
                      <input
                        type="url"
                        disabled={memberReadOnly}
                        value={r.paymentLink}
                        onChange={(e) => updateRow(r.clientId, { paymentLink: e.target.value })}
                        placeholder="https://"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  ) : (
                    <p className="mt-2 text-[11px] italic text-slate-500">{t.linkLockedHint}</p>
                  )}
                  <TemplateAttachmentField
                    supabase={supabase}
                    workspaceId={workspaceId}
                    daysAfterDue={r.daysAfterDue}
                    planId={planId}
                    locale={locale}
                    disabled={memberReadOnly}
                    value={r.attachment}
                    onChange={(attachment) => updateRow(r.clientId, { attachment })}
                    onError={(msg) => setMessage(msg)}
                    labels={{
                      title: t.attachmentTitle,
                      choose: t.attachmentChoose,
                      replace: t.attachmentReplace,
                      remove: t.attachmentRemove,
                      uploading: t.attachmentUploading,
                      none: t.attachmentNone,
                      attached: t.attachmentAttached,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {memberReadOnly ? <p className="text-sm text-amber-700">{t.readonly}</p> : null}
          {message ? (
            <div className="space-y-1">
              <p className="text-sm text-slate-700">{message}</p>
              {!memberReadOnly && showRegistryHint ? <div className="text-sm text-slate-700">{t.registryHint}</div> : null}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={saving || memberReadOnly}
            className="pp-btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? "…" : t.save}
          </button>
        </form>
      </section>
    </div>
  );
}

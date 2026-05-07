"use client";

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
import { getMaxEmailTemplates } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { REMINDER_TEMPLATE_VARIABLES_DOC } from "@/lib/reminder-template-substitution";
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
};

function rowFromDb(t: ReminderEmailTemplate): EditableTemplate {
  return {
    clientId: t.id,
    daysAfterDue: t.daysAfterDue,
    subjectTemplate: t.subjectTemplate,
    bodyTemplate: t.bodyTemplate,
    paymentLink: t.paymentLink ?? "",
    sortOrder: t.sortOrder,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [ruleMax, setRuleMax] = useState(50);
  const [rows, setRows] = useState<EditableTemplate[]>([]);

  const workspaceId = ws.activeWorkspaceId;

  const load = useCallback(async () => {
    if (!workspaceId || !supabase) return;
    setLoading(true);
    setMessage(null);
    try {
      const [rule, tpls] = await Promise.all([
        getReminderRule(supabase, workspaceId),
        listReminderEmailTemplates(supabase, workspaceId),
      ]);
      if (rule) {
        setRuleEnabled(rule.enabled);
        setRuleMax(rule.maxJobsPerRun);
      } else {
        setRuleEnabled(true);
        setRuleMax(50);
      }
      setRows(tpls.map(rowFromDb));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const usedDays = useMemo(() => new Set(rows.map((r) => r.daysAfterDue)), [rows]);

  const t =
    locale === "fr"
      ? {
          title: "Relances automatiques (scheduler)",
          hint: "Ces paramètres pilotent le runner serveur /api/reminders/run pour le portefeuille actif. Les envois automatiques utilisent MAIL_FROM_AUTO_REMINDERS si la variable serveur existe, sinon MAIL_FROM (Resend ; domaine à vérifier).",
          enable: "Activer l’automatisation (portefeuille)",
          daysTitle: "Jours après échéance",
          daysExpl:
            "Chaque modèle correspond à un seul J+n. Calendrier serveur en UTC (scheduled_for à 08:00 UTC). Exemple : avec J+1, une facture dont due_date est aujourd’hui UTC est mise en file le lendemain, puis envoyée après ce créneau.",
          preset37: "Préréglage : J+3 · 7 · 21",
          preset137: "Préréglage : J+1 · 3 · 7 · 21",
          maxRun: "Maximum d’envois par run",
          save: "Enregistrer les règles et modèles",
          modelsTitle: "Modèles d’e-mails",
          unpaidOnlyHint:
            "Les relances automatiques et les modèles ci-dessous s’appliquent aux factures impayées uniquement. Pour une fiche payée, la relance manuelle utilise le brouillon (objet + corps) plus bas sur cette page.",
          quota: (n: number, m: number) => `Modèles enregistrés : ${n} / ${m}`,
          add: "Ajouter un modèle",
          remove: "Supprimer ce modèle",
          delay: "Délai J+",
          subject: "Objet (sujet)",
          body: "Corps du message",
          link: "Lien de paiement (optionnel)",
          vars: "Variables : " + REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          readonly: "Lecture seule — membre invité.",
          pickDay: "Choisissez un J+ libre pour le nouveau modèle.",
          quotaBlock: "Quota atteint pour votre plan.",
        }
      : {
          title: "Automatic reminders (scheduler)",
          hint: "These settings drive the server runner /api/reminders/run for the active workspace. Automated sends use MAIL_FROM_AUTO_REMINDERS when set server-side; otherwise MAIL_FROM (Resend; domain must be verified).",
          enable: "Enable automation (workspace)",
          daysTitle: "Days after due date",
          daysExpl:
            "Each model maps to exactly one J+n. The runner uses UTC dates (scheduled_for at 08:00 UTC). Example: with J+1, if due_date is today UTC, enqueue happens the next day, then the email sends after that window.",
          preset37: "Preset: J+3 · 7 · 21",
          preset137: "Preset: J+1 · 3 · 7 · 21",
          maxRun: "Max sends per run",
          save: "Save rules and templates",
          modelsTitle: "Email templates",
          unpaidOnlyHint:
            "Automatic reminders and the templates below apply to unpaid invoices only. For a paid row, the manual reminder uses the draft (subject + body) further down this page.",
          quota: (n: number, m: number) => `Saved templates: ${n} / ${m}`,
          add: "Add template",
          remove: "Remove template",
          delay: "Delay J+",
          subject: "Subject",
          body: "Message body",
          link: "Payment link (optional)",
          vars: "Variables: " + REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          readonly: "Read-only — invited member.",
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
        subjectTemplate: `Rappel J+${d} — facture en attente ({{clientName}})`,
        bodyTemplate: locale === "fr" ? defaultTemplateBodyFr(d) : defaultTemplateBodyEn(d),
        paymentLink: "",
        sortOrder: order++,
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
        subjectTemplate: `Rappel J+${free} — facture en attente ({{clientName}})`,
        bodyTemplate: locale === "fr" ? defaultTemplateBodyFr(free) : defaultTemplateBodyEn(free),
        paymentLink: "",
        sortOrder: prev.length,
      },
    ]);
  }

  function removeRow(clientId: string) {
    if (memberReadOnly) return;
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
          maxJobsPerRun: 50,
        } satisfies ReminderRule);

      const merged: ReminderRule = {
        ...baseRule,
        enabled: ruleEnabled,
        maxJobsPerRun: Math.max(1, Math.min(500, ruleMax)),
      };

      const inputs: ReminderEmailTemplateInput[] = rows.map((r, i) => ({
        daysAfterDue: r.daysAfterDue,
        subjectTemplate: r.subjectTemplate,
        bodyTemplate: r.bodyTemplate,
        paymentLink: r.paymentLink.trim() || null,
        sortOrder: i,
      }));

      const saved = await replaceReminderEmailTemplatesForWorkspace(supabase, workspaceId, userId, inputs);
      await syncReminderRuleDaysFromTemplates(supabase, merged, saved);
      setRows(saved.map(rowFromDb));
      setMessage(locale === "fr" ? "Enregistré." : "Saved.");
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
        <p className="mt-2 text-sm text-slate-600">{t.hint}</p>
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={memberReadOnly}
                onClick={() => applyPreset([3, 7, 21])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t.preset37}
              </button>
              <button
                type="button"
                disabled={memberReadOnly}
                onClick={() => applyPreset([1, 3, 7, 21])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t.preset137}
              </button>
            </div>
          </div>
          <label className="block text-sm text-slate-700">
            {t.maxRun}
            <input
              type="number"
              min={1}
              max={500}
              disabled={memberReadOnly}
              value={ruleMax}
              onChange={(e) => setRuleMax(Number.parseInt(e.target.value, 10) || 1)}
              className="mt-1 w-32 rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{t.modelsTitle}</h3>
              <p className="text-xs text-slate-500">{t.quota(rows.length, maxModels)}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{t.unpaidOnlyHint}</p>
            <p className="mt-1 text-xs text-slate-500">{t.vars}</p>
            <button
              type="button"
              disabled={memberReadOnly || rows.length >= maxModels}
              onClick={addRow}
              className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
                          onClick={() => updateRow(r.clientId, { daysAfterDue: day })}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            r.daysAfterDue === day
                              ? "border-blue-500 bg-blue-600 text-white"
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
                </div>
              ))}
            </div>
          </div>

          {memberReadOnly ? <p className="text-sm text-amber-700">{t.readonly}</p> : null}
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          <button
            type="submit"
            disabled={saving || memberReadOnly}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "…" : t.save}
          </button>
        </form>
      </section>
    </div>
  );
}

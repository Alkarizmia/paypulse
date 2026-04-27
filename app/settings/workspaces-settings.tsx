"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGENCY_MAX_WORKSPACES,
  getMaxWorkspaces,
  usesAgencyWorkspaceUi,
  type PlanId,
} from "@/lib/plans";
import {
  createWorkspace,
  deleteWorkspaceIfEmpty,
  fetchWorkspaces,
  moveWorkspace,
  updateWorkspaceName,
  type Workspace,
} from "@/lib/workspaces";
import { setProfileActiveWorkspace } from "@/lib/profile";

type Props = {
  supabase: SupabaseClient;
  userId: string;
  planId: PlanId;
  locale: "fr" | "en";
};

export function WorkspacesSettings({ supabase, userId, planId, locale }: Props) {
  const [list, setList] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const show = usesAgencyWorkspaceUi(planId);
  const max = getMaxWorkspaces(planId);

  const t =
    locale === "fr"
      ? {
          title: "Espaces / portefeuilles",
          intro: `Jusqu’à ${AGENCY_MAX_WORKSPACES} portefeuilles : données (clients, relances, modèles) séparées. Le sélecteur du dashboard applique le portefeuille actif.`,
          loadError: "Impossible de charger les portefeuilles.",
          namePlaceholder: "Nom du portefeuille",
          add: "Ajouter",
          limit: `Limite atteinte (${AGENCY_MAX_WORKSPACES} portefeuilles).`,
          rename: "Renommer",
          save: "Enregistrer",
          cancel: "Annuler",
          up: "Monter",
          down: "Descendre",
          delete: "Supprimer",
          deleteBlocked: "Ce portefeuille contient encore des clients ou factures. Videz-le ou déplacez-les avant suppression.",
          deleted: "Portefeuille supprimé.",
          created: "Portefeuille créé.",
          updated: "Nom mis à jour.",
          confirmDelete: "Supprimer ce portefeuille ? (uniquement s’il est vide)",
        }
      : {
          title: "Spaces / wallets",
          intro: `Up to ${AGENCY_MAX_WORKSPACES} wallets: clients, reminders and templates are isolated per wallet. Use the dashboard selector for the active wallet.`,
          loadError: "Could not load wallets.",
          namePlaceholder: "Wallet name",
          add: "Add",
          limit: `Limit reached (${AGENCY_MAX_WORKSPACES} wallets).`,
          rename: "Rename",
          save: "Save",
          cancel: "Cancel",
          up: "Move up",
          down: "Move down",
          delete: "Delete",
          deleteBlocked: "This wallet still has clients or invoices. Empty it before deleting.",
          deleted: "Wallet removed.",
          created: "Wallet created.",
          updated: "Name saved.",
          confirmDelete: "Delete this wallet? (only if empty)",
        };

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const rows = await fetchWorkspaces(supabase, userId);
      setList(rows);
    } catch {
      setMessage(t.loadError);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, t.loadError]);

  useEffect(() => {
    if (!show) return;
    void refresh();
  }, [show, refresh]);

  async function handleAdd() {
    setMessage(null);
    const name = newName.trim();
    if (!name) return;
    try {
      await createWorkspace(supabase, userId, planId, name);
      setNewName("");
      setMessage(t.created);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setMessage(msg === "WORKSPACE_LIMIT" ? t.limit : msg || t.loadError);
    }
  }

  async function handleSaveRename(id: string) {
    setMessage(null);
    try {
      await updateWorkspaceName(supabase, id, renameValue);
      setRenameId(null);
      setMessage(t.updated);
      await refresh();
    } catch {
      setMessage(t.loadError);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    setMessage(null);
    try {
      await deleteWorkspaceIfEmpty(supabase, id);
      const remaining = await fetchWorkspaces(supabase, userId);
      const first = remaining[0]?.id ?? null;
      await setProfileActiveWorkspace(supabase, userId, first);
      setMessage(t.deleted);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setMessage(msg === "WORKSPACE_NOT_EMPTY" ? t.deleteBlocked : t.loadError);
    }
  }

  async function handleMove(id: string, dir: "up" | "down") {
    setMessage(null);
    try {
      await moveWorkspace(supabase, userId, id, dir);
      await refresh();
    } catch {
      setMessage(t.loadError);
    }
  }

  const canAdd = list.length < max;

  if (!show) return null;

  return (
    <section id="workspaces" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{t.intro}</p>
      {message ? (
        <p className="mt-3 text-sm text-slate-700" role="status">
          {message}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!canAdd}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {t.add}
        </button>
      </div>
      {!canAdd ? <p className="mt-2 text-xs text-amber-700">{t.limit}</p> : null}
      {loading ? (
        <p className="mt-4 text-sm text-slate-600">…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((w, i) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                {renameId === w.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveRename(w.id)}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                    >
                      {t.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenameId(null)}
                      className="text-xs text-slate-600 underline"
                    >
                      {t.cancel}
                    </button>
                  </div>
                ) : (
                  <p className="truncate font-medium text-slate-900">{w.name}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => void handleMove(w.id, "up")}
                  className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                >
                  {t.up}
                </button>
                <button
                  type="button"
                  disabled={i === list.length - 1}
                  onClick={() => void handleMove(w.id, "down")}
                  className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                >
                  {t.down}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenameId(w.id);
                    setRenameValue(w.name);
                  }}
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                >
                  {t.rename}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(w.id)}
                  disabled={list.length <= 1}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 disabled:opacity-40"
                >
                  {t.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

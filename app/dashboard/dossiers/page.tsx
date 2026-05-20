"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import type { Client } from "@/app/dashboard/types";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { useWorkspace } from "@/app/workspace-context";
import { fetchClients } from "@/lib/clients";
import { getActiveLocalClients } from "@/lib/local-clients";
import { createMemberActionNotifications } from "@/lib/notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useResolvedUiAppearance } from "@/lib/ui-theme";

type FolderNote = { id: string; text: string; createdAt: string };
type FolderPerson = { clientId: string; name: string; email: string };
type Folder = {
  id: string;
  name: string;
  createdAt: string;
  people: FolderPerson[];
  notes: FolderNote[];
};

const STORAGE_PREFIX = "paypulss_dashboard_folders_v1";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageKeyFor(scope: string): string {
  return `${STORAGE_PREFIX}:${scope}`;
}

function loadFolders(scope: string): Folder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.createdAt !== "string") return null;
        const people = Array.isArray(o.people)
          ? o.people
              .map((p) => {
                if (!p || typeof p !== "object") return null;
                const v = p as Record<string, unknown>;
                if (typeof v.clientId !== "string" || typeof v.name !== "string" || typeof v.email !== "string") return null;
                return { clientId: v.clientId, name: v.name, email: v.email };
              })
              .filter((p): p is FolderPerson => p !== null)
          : [];
        const notes = Array.isArray(o.notes)
          ? o.notes
              .map((n) => {
                if (!n || typeof n !== "object") return null;
                const v = n as Record<string, unknown>;
                if (typeof v.id !== "string" || typeof v.text !== "string" || typeof v.createdAt !== "string") return null;
                return { id: v.id, text: v.text, createdAt: v.createdAt };
              })
              .filter((n): n is FolderNote => n !== null)
          : [];
        return { id: o.id, name: o.name, createdAt: o.createdAt, people, notes };
      })
      .filter((f): f is Folder => f !== null);
  } catch {
    return [];
  }
}

function saveFolders(scope: string, folders: Folder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKeyFor(scope), JSON.stringify(folders));
}

export default function DashboardFoldersPage() {
  const { user, signOut } = useAuth();
  const { locale } = useLocale();
  const ws = useWorkspace();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [loadingClients, setLoadingClients] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";

  const t =
    locale === "fr"
      ? {
          title: "Dossiers",
          subtitle: "Créez des dossiers, ajoutez des personnes depuis vos clients et prenez des notes.",
          newFolder: "Nouveau dossier",
          create: "Créer",
          rename: "Renommer",
          delete: "Supprimer",
          clientsLabel: "Ajouter une personne du dashboard",
          notesLabel: "Notes",
          addNote: "Ajouter la note",
          save: "Enregistrer",
          saved: "Dossiers enregistrés.",
          pendingSave: "Modifications non enregistrées",
          foldersEmpty: "Aucun dossier pour le moment.",
          peopleEmpty: "Aucune personne dans ce dossier.",
          notesEmpty: "Aucune note pour ce dossier.",
          dashboardBack: "Retour dashboard",
          noClient: "Aucun client disponible.",
        }
      : {
          title: "Folders",
          subtitle: "Create folders, add people from your dashboard clients, and write notes.",
          newFolder: "New folder",
          create: "Create",
          rename: "Rename",
          delete: "Delete",
          clientsLabel: "Add a person from dashboard clients",
          notesLabel: "Notes",
          addNote: "Add note",
          save: "Save",
          saved: "Folders saved.",
          pendingSave: "Unsaved changes",
          foldersEmpty: "No folder yet.",
          peopleEmpty: "No person in this folder.",
          notesEmpty: "No note in this folder.",
          dashboardBack: "Back to dashboard",
          noClient: "No client available.",
        };

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);

  const storageScope = useMemo(() => {
    const owner = ws.effectiveOwnerUserId ?? user?.id ?? "anon";
    const workspace = ws.activeWorkspaceId ?? "local";
    return `${owner}:${workspace}`;
  }, [ws.effectiveOwnerUserId, ws.activeWorkspaceId, user?.id]);

  useEffect(() => {
    const initial = loadFolders(storageScope);
    setFolders(initial);
    if (initial[0]) {
      setSelectedFolderId(initial[0].id);
      setRenameValue(initial[0].name);
    } else {
      setSelectedFolderId(null);
      setRenameValue("");
    }
    setDirty(false);
    setLoaded(true);
    setSaveMessage(null);
  }, [storageScope]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoadingClients(true);
      try {
        if (ws.supabaseMode && ws.activeWorkspaceId) {
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            const rows = await fetchClients(supabase, ws.activeWorkspaceId);
            if (alive) setClients(rows);
          } else if (alive) {
            setClients(getActiveLocalClients());
          }
        } else if (alive) {
          setClients(getActiveLocalClients());
        }
      } catch {
        if (alive) setClients(getActiveLocalClients());
      } finally {
        if (alive) setLoadingClients(false);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [ws.supabaseMode, ws.activeWorkspaceId]);

  const selectedFolder = useMemo(() => folders.find((f) => f.id === selectedFolderId) ?? null, [folders, selectedFolderId]);

  function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const next: Folder = { id: uid(), name, createdAt: new Date().toISOString(), people: [], notes: [] };
    setFolders((prev) => [next, ...prev]);
    setSelectedFolderId(next.id);
    setRenameValue(next.name);
    setNewFolderName("");
    setDirty(true);
    setSaveMessage(null);
    if (user?.id && ws.supabaseMode) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        void createMemberActionNotifications(supabase, {
          ownerUserId: ws.effectiveOwnerUserId ?? user.id,
          actorUserId: user.id,
          workspaceId: ws.activeWorkspaceId,
          title: locale === "fr" ? "Dossier créé" : "Folder created",
          body: locale === "fr" ? `Dossier "${name}" créé.` : `Folder "${name}" created.`,
          payload: { action: "folder_created", folderName: name },
        });
      }
    }
  }

  function renameFolder() {
    if (!selectedFolder) return;
    const name = renameValue.trim();
    if (!name) return;
    setFolders((prev) => prev.map((f) => (f.id === selectedFolder.id ? { ...f, name } : f)));
    setDirty(true);
    setSaveMessage(null);
    if (user?.id && ws.supabaseMode) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        void createMemberActionNotifications(supabase, {
          ownerUserId: ws.effectiveOwnerUserId ?? user.id,
          actorUserId: user.id,
          workspaceId: ws.activeWorkspaceId,
          title: locale === "fr" ? "Dossier renommé" : "Folder renamed",
          body: locale === "fr" ? `Dossier renommé en "${name}".` : `Folder renamed to "${name}".`,
          payload: { action: "folder_renamed", folderId: selectedFolder.id },
        });
      }
    }
  }

  function removeFolder() {
    if (!selectedFolder) return;
    setFolders((prev) => prev.filter((f) => f.id !== selectedFolder.id));
    const remain = folders.filter((f) => f.id !== selectedFolder.id);
    setSelectedFolderId(remain[0]?.id ?? null);
    setRenameValue(remain[0]?.name ?? "");
    setDirty(true);
    setSaveMessage(null);
    if (user?.id && ws.supabaseMode) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        void createMemberActionNotifications(supabase, {
          ownerUserId: ws.effectiveOwnerUserId ?? user.id,
          actorUserId: user.id,
          workspaceId: ws.activeWorkspaceId,
          title: locale === "fr" ? "Dossier supprimé" : "Folder deleted",
          body: locale === "fr" ? `Dossier "${selectedFolder.name}" supprimé.` : `Folder "${selectedFolder.name}" deleted.`,
          payload: { action: "folder_deleted", folderId: selectedFolder.id },
        });
      }
    }
  }

  function addClientToFolder(clientId: string) {
    if (!selectedFolder) return;
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== selectedFolder.id) return f;
        if (f.people.some((p) => p.clientId === c.id)) return f;
        return { ...f, people: [...f.people, { clientId: c.id, name: c.name, email: c.email }] };
      }),
    );
    setDirty(true);
    setSaveMessage(null);
  }

  function removePerson(clientId: string) {
    if (!selectedFolder) return;
    setFolders((prev) =>
      prev.map((f) => (f.id === selectedFolder.id ? { ...f, people: f.people.filter((p) => p.clientId !== clientId) } : f)),
    );
    setDirty(true);
    setSaveMessage(null);
  }

  function addNote() {
    if (!selectedFolder) return;
    const text = noteDraft.trim();
    if (!text) return;
    const note: FolderNote = { id: uid(), text, createdAt: new Date().toISOString() };
    setFolders((prev) => prev.map((f) => (f.id === selectedFolder.id ? { ...f, notes: [note, ...f.notes] } : f)));
    setNoteDraft("");
    setDirty(true);
    setSaveMessage(null);
    if (user?.id && ws.supabaseMode) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        void createMemberActionNotifications(supabase, {
          ownerUserId: ws.effectiveOwnerUserId ?? user.id,
          actorUserId: user.id,
          workspaceId: ws.activeWorkspaceId,
          title: locale === "fr" ? "Note ajoutée" : "Note added",
          body: locale === "fr" ? `Nouvelle note dans "${selectedFolder.name}".` : `New note in "${selectedFolder.name}".`,
          payload: { action: "note_created", folderId: selectedFolder.id },
        });
      }
    }
  }

  function removeNote(noteId: string) {
    if (!selectedFolder) return;
    setFolders((prev) => prev.map((f) => (f.id === selectedFolder.id ? { ...f, notes: f.notes.filter((n) => n.id !== noteId) } : f)));
    setDirty(true);
    setSaveMessage(null);
  }

  function handleSave() {
    if (!loaded) return;
    saveFolders(storageScope, folders);
    setDirty(false);
    setSaveMessage(t.saved);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <DashboardShell
      locale={locale}
      planId={ws.planId}
      activeNav="overview"
      onNav={() => {}}
      navScrollMode={false}
      userEmail={user?.email ?? null}
      onLogout={handleLogout}
      hideTrashNav={ws.collaboratorNoClientMgmt}
      appearance={appearance}
    >
      <section className="space-y-6">
        <div className={`rounded-2xl border p-6 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
          <h2 className={`text-2xl font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.title}</h2>
          <p className={`mt-2 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{t.subtitle}</p>
          <div className="mt-4 flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t.newFolder}
              className={`w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:border-violet-400/50 ${
                light ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-black/35 text-white placeholder:text-slate-500"
              }`}
            />
            <button onClick={createFolder} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              {t.create}
            </button>
            <button
              onClick={handleSave}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                light ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-white/15 text-slate-200 hover:bg-white/10"
              }`}
            >
              {t.save}
            </button>
          </div>
          {dirty ? (
            <p className={`mt-2 text-xs ${light ? "text-amber-700" : "text-amber-300"}`}>{t.pendingSave}</p>
          ) : null}
          {saveMessage ? (
            <p className={`mt-2 text-xs ${light ? "text-emerald-700" : "text-emerald-300"}`}>{saveMessage}</p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className={`rounded-2xl border p-4 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
            <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>Dossiers</h3>
            <div className="mt-3 space-y-2">
              {folders.length === 0 ? <p className={`text-sm ${light ? "text-slate-500" : "text-slate-400"}`}>{t.foldersEmpty}</p> : null}
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFolderId(f.id);
                    setRenameValue(f.name);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    selectedFolderId === f.id
                      ? light
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-violet-500/40 bg-violet-950/40 text-violet-200"
                      : light
                        ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        : "border-white/10 bg-black/35 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </aside>

          <div className={`rounded-2xl border p-5 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
            {!selectedFolder ? (
              <p className={`text-sm ${light ? "text-slate-500" : "text-slate-400"}`}>{t.foldersEmpty}</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className={`w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:border-violet-400/50 ${
                      light ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-black/35 text-white"
                    }`}
                  />
                  <button
                    onClick={renameFolder}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      light ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-white/15 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {t.rename}
                  </button>
                  <button
                    onClick={removeFolder}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      light ? "border-red-300 bg-red-50 text-red-700" : "border-red-500/40 bg-red-950/35 text-red-200"
                    }`}
                  >
                    {t.delete}
                  </button>
                </div>

                <div className={`rounded-xl border p-4 ${light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`}>
                  <h4 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.clientsLabel}</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {loadingClients ? <span className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>...</span> : null}
                    {!loadingClients && clients.length === 0 ? (
                      <span className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>{t.noClient}</span>
                    ) : null}
                    {!loadingClients
                      ? clients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => addClientToFolder(c.id)}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              light
                                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                : "border-white/15 bg-black/45 text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))
                      : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedFolder.people.length === 0 ? (
                      <p className={`text-sm ${light ? "text-slate-500" : "text-slate-400"}`}>{t.peopleEmpty}</p>
                    ) : null}
                    {selectedFolder.people.map((p) => (
                      <div
                        key={p.clientId}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                          light ? "border-slate-200 bg-white" : "border-white/10 bg-black/35"
                        }`}
                      >
                        <div>
                          <p className={`text-sm ${light ? "text-slate-900" : "text-white"}`}>{p.name}</p>
                          <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>{p.email}</p>
                        </div>
                        <button onClick={() => removePerson(p.clientId)} className="text-xs text-red-700 hover:text-red-600">
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`}>
                  <h4 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.notesLabel}</h4>
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={3}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-violet-400/50 ${
                        light ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-black/35 text-white placeholder:text-slate-500"
                      }`}
                    />
                    <button onClick={addNote} className="h-fit rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">
                      {t.addNote}
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {selectedFolder.notes.length === 0 ? (
                      <p className={`text-sm ${light ? "text-slate-500" : "text-slate-400"}`}>{t.notesEmpty}</p>
                    ) : null}
                    {selectedFolder.notes.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-lg border px-3 py-2 ${light ? "border-slate-200 bg-white" : "border-white/10 bg-black/35"}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>
                            {new Date(n.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                          </p>
                          <button onClick={() => removeNote(n.id)} className="text-xs text-red-700 hover:text-red-600">
                            {t.delete}
                          </button>
                        </div>
                        <p className={`mt-1 whitespace-pre-wrap text-sm ${light ? "text-slate-800" : "text-slate-200"}`}>{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

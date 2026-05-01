"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { useWorkspace } from "@/app/workspace-context";
import { usesAgencyWorkspaceUi, type PlanId } from "@/lib/plans";
import { getProfile } from "@/lib/profile";
import {
  cancelAccountInvite,
  createAccountInvite,
  fetchAccountInvites,
  fetchAccountMembers,
  removeAccountMember,
  type AccountInvite,
  type AccountMember,
  type AccountRole,
} from "@/lib/team";
import type { SupabaseClient } from "@supabase/supabase-js";

type AccountTeamSettingsProps = {
  supabase: SupabaseClient;
  planId: PlanId;
};

type MemberRow = AccountMember & { label: string };

export function AccountTeamSettings({ supabase, planId }: AccountTeamSettingsProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const ws = useWorkspace();
  const [invites, setInvites] = useState<AccountInvite[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccountRole>("member");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agency = usesAgencyWorkspaceUi(planId);

  const refresh = useCallback(async () => {
    if (!user?.id || !agency) {
      setInvites([]);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [invList, memList] = await Promise.all([
        fetchAccountInvites(supabase, user.id),
        fetchAccountMembers(supabase, user.id),
      ]);
      setInvites(invList);
      const enriched: MemberRow[] = [];
      for (const m of memList) {
        let label = m.memberUserId.slice(0, 8) + "…";
        try {
          const p = await getProfile(supabase, m.memberUserId);
          label = p?.fullName?.trim() || p?.companyName?.trim() || label;
        } catch {
          /* */
        }
        enriched.push({ ...m, label });
      }
      setMembers(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur équipe");
      setInvites([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id, agency]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const t = useMemo(
    () =>
      locale === "fr"
        ? {
            title: "Équipe & invitations",
            sub: "Invitez un collègue par e-mail. Il doit créer un compte PayPulss avec le même e-mail, puis ouvrir le lien d’acceptation.",
            acting:
              "Vous consultez un compte partagé depuis le dashboard. Revenez à « Mon compte » pour gérer les invitations de votre propre organisation.",
            admin: "Admin",
            member: "Membre",
            adminHint: "Gestion clients (ajout, corbeille) comme le propriétaire. Les portefeuilles / équipe restent gérés par le propriétaire.",
            memberHint: "Lecture et mise à jour des factures (ex. marquer payé), sans ajout ni corbeille.",
            email: "E-mail du collègue",
            roleLabel: "Rôle",
            submit: "Envoyer l’invitation",
            pending: "Invitations en attente",
            members: "Membres",
            copy: "Copier le lien",
            copied: "Lien copié",
            cancel: "Annuler",
            remove: "Retirer",
            noneInv: "Aucune invitation en attente.",
            noneMem: "Aucun membre pour le moment.",
            load: "Chargement…",
          }
        : {
            title: "Team & invites",
            sub: "Invite a colleague by email. They need a PayPulss account on that email, then open the accept link.",
            acting:
              "You are viewing a shared account from the dashboard. Switch to “My account” to manage invites for your own organization.",
            admin: "Admin",
            member: "Member",
            adminHint: "Full client management (add, trash) like the owner. Workspaces / team remain owner-only.",
            memberHint: "View and update invoices (e.g. mark paid); no add or trash.",
            email: "Colleague email",
            roleLabel: "Role",
            submit: "Send invite",
            pending: "Pending invites",
            members: "Members",
            copy: "Copy link",
            copied: "Link copied",
            cancel: "Cancel",
            remove: "Remove",
            noneInv: "No pending invites.",
            noneMem: "No members yet.",
            load: "Loading…",
          },
    [locale],
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    if (!user?.id) return;
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) {
      setError(locale === "fr" ? "E-mail invalide." : "Invalid email.");
      return;
    }
    setSaving(true);
    try {
      await createAccountInvite(supabase, user.id, clean, role);
      setEmail("");
      setNotice(locale === "fr" ? "Invitation créée. Copiez le lien ci-dessous." : "Invite created. Copy the link below.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function inviteLink(inv: AccountInvite) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/invite/accept?token=${inv.token}`;
  }

  async function copyToken(inv: AccountInvite) {
    try {
      await navigator.clipboard.writeText(inviteLink(inv));
      setNotice(t.copied);
    } catch {
      setNotice(inviteLink(inv));
    }
  }

  if (!agency) return null;

  if (ws.isActingAsMember) {
    return (
      <section id="team" className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
        <p className="mt-3 text-sm text-amber-800">{t.acting}</p>
      </section>
    );
  }

  return (
    <section id="team" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{t.sub}</p>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <dt className="font-semibold text-slate-900">{t.admin}</dt>
          <dd className="mt-1 text-slate-600">{t.adminHint}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <dt className="font-semibold text-slate-900">{t.member}</dt>
          <dd className="mt-1 text-slate-600">{t.memberHint}</dd>
        </div>
      </dl>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleInvite} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.email}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="collegue@exemple.fr"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.roleLabel}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AccountRole)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="admin">{t.admin}</option>
            <option value="member">{t.member}</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {t.submit}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-slate-900">{t.pending}</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">{t.load}</p>
        ) : invites.filter((i) => i.status === "pending").length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t.noneInv}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {invites
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <li key={inv.id} className="rounded-lg border border-slate-200 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{inv.email}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">{inv.role}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyToken(inv)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {t.copy}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await cancelAccountInvite(supabase, inv.id);
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      {t.cancel}
                    </button>
                  </div>
                  <p className="mt-2 break-all text-xs text-slate-500">{inviteLink(inv)}</p>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-slate-900">{t.members}</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">{t.load}</p>
        ) : members.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t.noneMem}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-900">{m.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">{m.role}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await removeAccountMember(supabase, m.id);
                      await refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erreur");
                    }
                  }}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  {t.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

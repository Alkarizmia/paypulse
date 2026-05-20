"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { useWorkspace } from "@/app/workspace-context";
import { canAccessTeamPage, getMaxTeamMembers, type PlanId } from "@/lib/plans";
import { getProfile } from "@/lib/profile";
import {
  cancelAccountInvite,
  countTeamSlots,
  createAccountInvite,
  fetchAccountInvites,
  fetchAccountMembers,
  isAccountRole,
  removeAccountMember,
  type AccountInvite,
  type AccountMember,
  type AccountRole,
} from "@/lib/team";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { SupabaseClient } from "@supabase/supabase-js";

type AccountTeamSettingsProps = {
  supabase: SupabaseClient;
  planId: PlanId;
  appearance?: UiResolvedAppearance;
  variant?: "settings" | "dashboard";
};

type MemberRow = AccountMember & { label: string };

function roleLabel(role: AccountRole, t: Record<string, string>): string {
  if (role === "admin") return t.admin;
  if (role === "spectator") return t.spectator;
  return t.member;
}

export function AccountTeamSettings({
  supabase,
  planId,
  appearance = "light",
  variant = "settings",
}: AccountTeamSettingsProps) {
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

  const teamEnabled = canAccessTeamPage(planId);
  const maxSeats = getMaxTeamMembers(planId);
  const seatsUsed = countTeamSlots(members, invites);
  const seatsFull = seatsUsed >= maxSeats;
  const light = appearance === "light";
  const dashboard = variant === "dashboard";

  const card = dashboard
    ? light
      ? "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-5 sm:p-6"
    : "rounded-2xl border border-slate-200 bg-white p-6";
  const titleCls = dashboard
    ? light
      ? "text-lg font-semibold text-slate-900"
      : "text-lg font-semibold text-white"
    : "text-lg font-semibold text-slate-900";
  const subCls = dashboard ? (light ? "text-sm text-slate-600" : "text-sm text-slate-400") : "text-sm text-slate-600";
  const inputCls = dashboard
    ? light
      ? "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
      : "mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f14] px-3 py-2 text-white"
    : "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2";
  const hintBox = dashboard
    ? light
      ? "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
      : "rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2"
    : "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2";

  const refresh = useCallback(async () => {
    if (!user?.id || !teamEnabled) {
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
      setError(e instanceof Error ? e.message : locale === "fr" ? "Erreur équipe" : "Team error");
      setInvites([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id, teamEnabled, locale]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const t = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Équipe & invitations",
        sub: "Invitez un collègue par e-mail. Il crée un compte PayPulss avec le même e-mail, puis ouvre le lien d’acceptation.",
        seats: `Places utilisées : ${seatsUsed} / ${maxSeats}`,
        seatsFull: `Limite atteinte (${maxSeats} collaborateur${maxSeats > 1 ? "s" : ""} sur le plan ${planId === "agency" ? "Agency" : "Pro"}). Retirez un membre ou annulez une invitation pour en ajouter une autre.`,
        acting:
          "Vous consultez un compte partagé. Revenez à « Mon compte » pour gérer les invitations de votre organisation.",
        admin: "Admin",
        member: "Membre",
        spectator: "Spectateur",
        adminHint: "Comme le propriétaire : ajout et corbeille. Pas la gestion des portefeuilles ni des invitations.",
        memberHint: "Voir les factures, marquer payé, relancer. Pas d’ajout ni corbeille.",
        spectatorHint: "Lecture seule : consultation du dashboard, sans modifier ni relancer.",
        email: "E-mail du collègue",
        roleLabel: "Rôle et pouvoirs",
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
      };
    }
    if (locale === "nl") {
      return {
        title: "Team & uitnodigingen",
        sub: "Nodig een collega uit per e-mail. Zelfde e-mail op PayPulss, daarna de acceptatielink.",
        seats: `Plaatsen: ${seatsUsed} / ${maxSeats}`,
        seatsFull: `Limiet bereikt (${maxSeats}). Verwijder een lid of annuleer een uitnodiging.`,
        acting: "U bekijkt een gedeeld account. Schakel terug naar « Mijn account » voor eigen uitnodigingen.",
        admin: "Beheerder",
        member: "Lid",
        spectator: "Toeschouwer",
        adminHint: "Zoals eigenaar: klanten toevoegen en prullenbak. Geen workspaces of teambeheer.",
        memberHint: "Facturen bekijken, betaald markeren, herinneren. Geen toevoegen of prullenbak.",
        spectatorHint: "Alleen lezen: geen wijzigingen of herinneringen.",
        email: "E-mail collega",
        roleLabel: "Rol en rechten",
        submit: "Uitnodiging versturen",
        pending: "Openstaande uitnodigingen",
        members: "Leden",
        copy: "Link kopiëren",
        copied: "Link gekopieerd",
        cancel: "Annuleren",
        remove: "Verwijderen",
        noneInv: "Geen openstaande uitnodigingen.",
        noneMem: "Nog geen leden.",
        load: "Laden…",
      };
    }
    if (locale === "es") {
      return {
        title: "Equipo e invitaciones",
        sub: "Invite por correo. Misma cuenta PayPulss, luego el enlace de aceptación.",
        seats: `Plazas: ${seatsUsed} / ${maxSeats}`,
        seatsFull: `Límite alcanzado (${maxSeats}). Retire un miembro o cancele una invitación.`,
        acting: "Está en una cuenta compartida. Vuelva a « Mi cuenta » para sus invitaciones.",
        admin: "Admin",
        member: "Miembro",
        spectator: "Espectador",
        adminHint: "Como el propietario: altas y papelera. Sin workspaces ni equipo.",
        memberHint: "Ver facturas, marcar pagado, recordar. Sin altas ni papelera.",
        spectatorHint: "Solo lectura: sin cambios ni recordatorios.",
        email: "Correo del colaborador",
        roleLabel: "Rol y permisos",
        submit: "Enviar invitación",
        pending: "Invitaciones pendientes",
        members: "Miembros",
        copy: "Copiar enlace",
        copied: "Enlace copiado",
        cancel: "Cancelar",
        remove: "Retirar",
        noneInv: "Sin invitaciones pendientes.",
        noneMem: "Sin miembros aún.",
        load: "Cargando…",
      };
    }
    return {
      title: "Team & invites",
      sub: "Invite by email. Same PayPulss account on that email, then open the accept link.",
      seats: `Seats used: ${seatsUsed} / ${maxSeats}`,
      seatsFull: `Limit reached (${maxSeats}). Remove a member or cancel a pending invite.`,
      acting: "You are viewing a shared account. Switch to “My account” to manage your own invites.",
      admin: "Admin",
      member: "Member",
      spectator: "Viewer",
      adminHint: "Like the owner: add clients and trash. Workspaces and team invites stay owner-only.",
      memberHint: "View invoices, mark paid, send reminders. No add or trash.",
      spectatorHint: "Read-only: browse the dashboard without edits or reminders.",
      email: "Colleague email",
      roleLabel: "Role & permissions",
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
    };
  }, [locale, seatsUsed, maxSeats, planId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    if (!user?.id) return;
    if (seatsFull) {
      setError(t.seatsFull);
      return;
    }
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

  if (!teamEnabled) return null;

  if (ws.isActingAsMember) {
    return (
      <section id="team" className={card}>
        <h2 className={titleCls}>{t.title}</h2>
        <p className={`mt-3 text-sm ${dashboard && !light ? "text-amber-200/90" : "text-amber-800"}`}>{t.acting}</p>
      </section>
    );
  }

  const roleHints: { id: AccountRole; title: string; body: string }[] = [
    { id: "admin", title: t.admin, body: t.adminHint },
    { id: "member", title: t.member, body: t.memberHint },
    { id: "spectator", title: t.spectator, body: t.spectatorHint },
  ];

  return (
    <section id="team" className={card}>
      <h2 className={titleCls}>{t.title}</h2>
      <p className={`mt-2 ${subCls}`}>{t.sub}</p>
      <p className={`mt-2 text-xs font-medium ${light ? "text-violet-700" : "text-violet-300"}`}>{t.seats}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        {roleHints.map((r) => (
          <div key={r.id} className={hintBox}>
            <dt className={`font-semibold ${dashboard && !light ? "text-white" : "text-slate-900"}`}>{r.title}</dt>
            <dd className={`mt-1 ${dashboard && !light ? "text-slate-400" : "text-slate-600"}`}>{r.body}</dd>
          </div>
        ))}
      </dl>

      {error ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            light ? "border-red-200 bg-red-50 text-red-800" : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            light ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleInvite} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}>
            {t.email}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="collegue@exemple.fr"
            required
            disabled={seatsFull}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}>
            {t.roleLabel}
          </span>
          <select
            value={role}
            onChange={(e) => {
              const v = e.target.value;
              setRole(isAccountRole(v) ? v : "member");
            }}
            className={inputCls}
            disabled={seatsFull}
          >
            <option value="admin">{t.admin}</option>
            <option value="member">{t.member}</option>
            <option value="spectator">{t.spectator}</option>
          </select>
        </label>
        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={saving || loading || seatsFull}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {t.submit}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h3 className={titleCls}>{t.pending}</h3>
        {loading ? (
          <p className={`mt-2 text-sm ${subCls}`}>{t.load}</p>
        ) : invites.filter((i) => i.status === "pending").length === 0 ? (
          <p className={`mt-2 text-sm ${subCls}`}>{t.noneInv}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {invites
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <li
                  key={inv.id}
                  className={`rounded-lg border px-3 py-3 text-sm ${
                    light ? "border-slate-200" : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={dashboard && !light ? "font-medium text-white" : "font-medium text-slate-900"}>
                      {inv.email}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs uppercase ${
                        light ? "bg-slate-100 text-slate-700" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {roleLabel(inv.role, t)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyToken(inv)}
                      className={`rounded border px-2 py-1 text-xs font-medium ${
                        light
                          ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                          : "border-white/15 text-slate-200 hover:bg-white/[0.06]"
                      }`}
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
                      className={`rounded border px-2 py-1 text-xs font-medium ${
                        light
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-red-500/30 text-red-300 hover:bg-red-500/10"
                      }`}
                    >
                      {t.cancel}
                    </button>
                  </div>
                  <p className={`mt-2 break-all text-xs ${subCls}`}>{inviteLink(inv)}</p>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h3 className={titleCls}>{t.members}</h3>
        {loading ? (
          <p className={`mt-2 text-sm ${subCls}`}>{t.load}</p>
        ) : members.length === 0 ? (
          <p className={`mt-2 text-sm ${subCls}`}>{t.noneMem}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  light ? "border-slate-200" : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <span className={dashboard && !light ? "text-white" : "text-slate-900"}>{m.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs uppercase ${
                    light ? "bg-slate-100 text-slate-700" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {roleLabel(m.role, t)}
                </span>
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
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-300"
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

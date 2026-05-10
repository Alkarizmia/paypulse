"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/app/auth-context";
import {
  getActingOwnerUserId,
  getActingWorkspaceId,
  setActingOwnerUserId,
  setActingWorkspaceId,
} from "@/lib/effective-account";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getProfile, setProfileActiveWorkspace } from "@/lib/profile";
import { ensureAtLeastOneWorkspace, fetchWorkspaces, type Workspace } from "@/lib/workspaces";
import { fetchMembershipsForMember, type AccountMember } from "@/lib/team";
import type { PlanId } from "@/lib/plans";

export type SharedAccountSummary = { ownerUserId: string; displayName: string };

type WorkspaceContextValue = {
  ready: boolean;
  supabaseMode: boolean;
  effectiveOwnerUserId: string | null;
  isActingAsMember: boolean;
  memberRoleOnEffectiveAccount: "admin" | "member" | null;
  myMemberships: AccountMember[];
  /** Libellés pour le sélecteur de compte (profil du propriétaire invité). */
  sharedAccountSummaries: SharedAccountSummary[];
  planId: PlanId;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  switchToOwnAccount: () => void;
  switchToMemberAccount: (ownerUserId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(!supabase);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveState] = useState<string | null>(null);
  const [myMemberships, setMyMemberships] = useState<AccountMember[]>([]);
  const [sharedAccountSummaries, setSharedAccountSummaries] = useState<SharedAccountSummary[]>([]);
  const [actingVersion, setActingVersion] = useState(0);

  const refreshWorkspaces = useCallback(async () => {
    if (!supabase || !user?.id) {
      setWorkspaces([]);
      setActiveState(null);
      setMyMemberships([]);
      setSharedAccountSummaries([]);
      setReady(true);
      return;
    }
    setReady(false);
    const client = supabase;
    const memberUserId = user.id;
    try {
      const actingOwner = getActingOwnerUserId();
      const ownerUserIdForData =
        actingOwner && actingOwner.length > 0 && actingOwner !== memberUserId ? actingOwner : memberUserId;
      const isActing = ownerUserIdForData !== memberUserId;

      const [sub, memberships] = await Promise.all([
        getCurrentSubscription(client, ownerUserIdForData),
        fetchMembershipsForMember(client, memberUserId).catch(() => [] as AccountMember[]),
      ]);
      setPlanId(sub.planId);
      if (!isActing) {
        try {
          const { data: sess } = await client.auth.getSession();
          const token = sess.session?.access_token;
          if (token) {
            const res = await fetch("/api/stripe/active-subscription", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const j = (await res.json()) as { subscription?: { planId: PlanId } };
              if (j.subscription?.planId) setPlanId(j.subscription.planId);
            }
          }
        } catch {
          /* ignore */
        }
      }
      setMyMemberships(memberships);

      const uniqueOwners = [...new Set(memberships.map((m) => m.ownerUserId))];

      async function summaryForOwner(ownerId: string): Promise<SharedAccountSummary> {
        let displayName = `Compte ${ownerId.slice(0, 6)}…`;
        try {
          const p = await getProfile(client, ownerId);
          const n = p?.companyName?.trim() || p?.fullName?.trim();
          if (n) displayName = n;
        } catch {
          /* profil absent */
        }
        return { ownerUserId: ownerId, displayName };
      }

      const [summaries, list, ownProfile] = await Promise.all([
        Promise.all(uniqueOwners.map((oid) => summaryForOwner(oid))),
        (async () => {
          let w = await fetchWorkspaces(client, ownerUserIdForData);
          if (w.length === 0) {
            w = await ensureAtLeastOneWorkspace(client, ownerUserIdForData, memberUserId);
          }
          return w;
        })(),
        isActing ? Promise.resolve(null) : getProfile(client, memberUserId).catch(() => null),
      ]);
      setSharedAccountSummaries(summaries);
      setWorkspaces(list);

      let preferred: string | null = null;
      if (isActing) {
        preferred = getActingWorkspaceId();
      } else {
        preferred = ownProfile?.activeWorkspaceId ?? null;
      }

      const valid = preferred && list.some((w) => w.id === preferred) ? preferred : list[0]?.id ?? null;
      setActiveState(valid);
      if (isActing && valid) {
        setActingWorkspaceId(valid);
      }
      if (!isActing && valid && preferred !== valid) {
        try {
          await setProfileActiveWorkspace(client, memberUserId, valid);
        } catch {
          /* ignore */
        }
      }
    } catch {
      setWorkspaces([]);
      setActiveState(null);
      setSharedAccountSummaries([]);
    } finally {
      setReady(true);
    }
  }, [supabase, user?.id, actingVersion]);

  useEffect(() => {
    queueMicrotask(() => void refreshWorkspaces());
  }, [refreshWorkspaces]);

  const switchToOwnAccount = useCallback(() => {
    setActingOwnerUserId(null);
    setActingWorkspaceId(null);
    setActingVersion((v) => v + 1);
  }, []);

  const switchToMemberAccount = useCallback((ownerUserId: string) => {
    setActingOwnerUserId(ownerUserId);
    setActingWorkspaceId(null);
    setActingVersion((v) => v + 1);
  }, []);

  const setActiveWorkspaceId = useCallback(
    async (id: string) => {
      if (!supabase || !user?.id) return;
      if (!workspaces.some((w) => w.id === id)) return;
      const actingOwner = getActingOwnerUserId();
      const ownerForData =
        actingOwner && actingOwner.length > 0 && actingOwner !== user.id ? actingOwner : user.id;
      const isActing = ownerForData !== user.id;

      setActiveState(id);
      if (isActing) {
        setActingWorkspaceId(id);
        return;
      }
      try {
        await setProfileActiveWorkspace(supabase, user.id, id);
      } catch {
        /* colonne absente */
      }
    },
    [supabase, user, workspaces],
  );

  const effectiveOwnerUserId = useMemo(() => {
    if (!user?.id) return null;
    const acting = getActingOwnerUserId();
    if (acting && acting.length > 0 && acting !== user.id) return acting;
    return user.id;
  }, [user?.id, actingVersion, ready]);

  const isActingAsMember = Boolean(user?.id && effectiveOwnerUserId && effectiveOwnerUserId !== user.id);

  const memberRoleOnEffectiveAccount = useMemo((): "admin" | "member" | null => {
    if (!isActingAsMember || !effectiveOwnerUserId) return null;
    const m = myMemberships.find((x) => x.ownerUserId === effectiveOwnerUserId);
    return m?.role ?? null;
  }, [isActingAsMember, effectiveOwnerUserId, myMemberships]);

  const supabaseMode = Boolean(supabase);
  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      supabaseMode,
      effectiveOwnerUserId,
      isActingAsMember,
      memberRoleOnEffectiveAccount,
      myMemberships,
      sharedAccountSummaries,
      planId,
      workspaces,
      activeWorkspaceId,
      setActiveWorkspaceId,
      refreshWorkspaces,
      switchToOwnAccount,
      switchToMemberAccount,
    }),
    [
      ready,
      supabaseMode,
      effectiveOwnerUserId,
      isActingAsMember,
      memberRoleOnEffectiveAccount,
      myMemberships,
      sharedAccountSummaries,
      planId,
      workspaces,
      activeWorkspaceId,
      setActiveWorkspaceId,
      refreshWorkspaces,
      switchToOwnAccount,
      switchToMemberAccount,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}

export function useWorkspaceOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}

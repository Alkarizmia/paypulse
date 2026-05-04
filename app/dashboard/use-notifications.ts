"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type DashboardNotification } from "@/lib/notifications";

export function useNotifications(userId: string | null | undefined) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNotifications(supabase, userId, 30);
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch for notification center hydration
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const timer = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(timer);
  }, [supabase, userId, refresh]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, refresh]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  const markOneRead = useCallback(
    async (id: string) => {
      if (!supabase) return;
      await markNotificationRead(supabase, id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    },
    [supabase],
  );

  const markAllRead = useCallback(async () => {
    if (!supabase || !userId) return;
    await markAllNotificationsRead(supabase, userId);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
  }, [supabase, userId]);

  return { items, unreadCount, loading, error, refresh, markOneRead, markAllRead };
}

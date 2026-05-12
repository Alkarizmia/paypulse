"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type DashboardNotification } from "@/lib/notifications";

export function useNotifications(userId: string | null | undefined) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
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

    let fallbackTimer: number | null = null;
    const startFallbackPolling = () => {
      if (fallbackTimer !== null) return;
      fallbackTimer = window.setInterval(() => void refresh(), 120_000);
    };
    const stopFallbackPolling = () => {
      if (fallbackTimer !== null) {
        window.clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          stopFallbackPolling();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startFallbackPolling();
        }
      });

    return () => {
      stopFallbackPolling();
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, refresh]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  const markOneRead = useCallback(
    async (id: string) => {
      if (!supabase) return;
      try {
        await markNotificationRead(supabase, id);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
      } catch {
        await refresh();
      }
    },
    [supabase, refresh],
  );

  const markAllRead = useCallback(async (): Promise<boolean> => {
    if (!supabase || !userId) return false;
    setMarkingAllRead(true);
    setError(null);
    try {
      await markAllNotificationsRead(supabase, userId);
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark all as read");
      await refresh();
      return false;
    } finally {
      setMarkingAllRead(false);
    }
  }, [supabase, userId, refresh]);

  return { items, unreadCount, loading, error, markingAllRead, refresh, markOneRead, markAllRead };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!supabase || !userId) return;

    let fallbackTimer: number | null = null;
    let useFallbackPolling = false;
    let cancelled = false;

    const syncFallbackTimer = () => {
      if (!useFallbackPolling || document.hidden) {
        if (fallbackTimer !== null) {
          window.clearInterval(fallbackTimer);
          fallbackTimer = null;
        }
        return;
      }
      if (fallbackTimer !== null) return;
      fallbackTimer = window.setInterval(() => void refreshRef.current(), 120_000);
    };

    const startFallbackPolling = () => {
      useFallbackPolling = true;
      syncFallbackTimer();
    };

    const stopFallbackPolling = () => {
      useFallbackPolling = false;
      if (fallbackTimer !== null) {
        window.clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const onVis = () => {
      syncFallbackTimer();
    };
    document.addEventListener("visibilitychange", onVis);

    const channelName = `notifications:${userId}`;
    const channel = supabase.channel(channelName);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
      () => {
        if (!cancelled) void refreshRef.current();
      },
    );
    channel.subscribe((status) => {
      if (cancelled) return;
      if (status === "SUBSCRIBED") {
        stopFallbackPolling();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        startFallbackPolling();
      }
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      stopFallbackPolling();
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

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

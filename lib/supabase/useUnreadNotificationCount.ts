"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";

/** Live count of the signed-in patient's unread notifications (RLS scopes rows to their own appointments). */
export function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { count: unread } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setCount(unread ?? 0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeRefresh("notifications", undefined, refresh);

  return count;
}

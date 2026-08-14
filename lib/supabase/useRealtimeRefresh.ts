"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Re-runs `onChange` whenever a row in `table` changes. Pass `filter` (a
 * Postgres realtime filter string like "patient_id=eq.<uuid>") to scope to
 * rows with a direct column match; omit it when the table has no such
 * column (e.g. notifications, only reachable via a join) — Realtime still
 * only delivers rows the subscriber's RLS SELECT policy allows them to see.
 */
export function useRealtimeRefresh(table: string, filter: string | undefined, onChange: () => void) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`${table}:${filter ?? "all"}`).on(
      "postgres_changes",
      filter
        ? { event: "*", schema: "public", table, filter }
        : { event: "*", schema: "public", table },
      () => {
        onChange();
      }
    );
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}

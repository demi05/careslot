"use client";

import { useEffect, useId } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Re-runs `onChange` whenever a row in `table` changes. Pass `filter` (a
 * Postgres realtime filter string like "patient_id=eq.<uuid>") to scope to
 * rows with a direct column match; omit it when the table has no such
 * column (e.g. notifications, only reachable via a join) — Realtime still
 * only delivers rows the subscriber's RLS SELECT policy allows them to see.
 *
 * The channel name includes a per-instance id (React's useId) so two
 * components subscribing to the same table+filter at once — e.g.
 * PatientTopNav and PatientBottomTabs both watching "notifications" with
 * no filter, rendered on the same page — never collide on the same
 * channel name. Supabase's realtime client throws if a second `.on()` is
 * added to a channel name that's already subscribed, rather than just
 * giving each call its own channel.
 */
export function useRealtimeRefresh(table: string, filter: string | undefined, onChange: () => void) {
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`${table}:${filter ?? "all"}:${instanceId}`).on(
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
  }, [table, filter, instanceId]);
}

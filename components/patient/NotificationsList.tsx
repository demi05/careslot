"use client";

import { useState, useCallback } from "react";
import { BellSlash, ChatCircleDots, EnvelopeSimple, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface NotificationRow {
  id: string;
  channel: "sms" | "email";
  delivery_status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

type Filter = "all" | "email" | "sms";

async function fetchNotifications(): Promise<NotificationRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, channel, delivery_status, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export function NotificationsList({ initialNotifications }: { initialNotifications: NotificationRow[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");

  const refetch = useCallback(async () => {
    setNotifications(await fetchNotifications());
  }, []);

  useRealtimeRefresh("notifications", undefined, refetch);

  const filtered = notifications.filter((n) => filter === "all" || n.channel === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["all", "email", "sms"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex h-10 items-center rounded-full px-4 text-[13px] font-bold capitalize ${
              filter === f ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BellSlash size={22} weight="bold" />}
          title="No alerts yet"
          description="Reminders and confirmations about your appointments will show up here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-[24px] bg-surface p-3.5 shadow-[0_10px_24px_-20px_rgba(20,35,31,0.45)]"
            >
              <div
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${
                  n.channel === "sms" ? "bg-accent-tint text-accent-dark" : "bg-primary-tint text-primary"
                }`}
              >
                {n.channel === "sms" ? <ChatCircleDots size={17} /> : <EnvelopeSimple size={17} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold leading-snug text-ink">
                  Appointment reminder, {n.channel === "sms" ? "SMS" : "Email"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {n.channel === "sms" ? "SMS" : "Email"},{" "}
                  {new Date(n.sent_at ?? n.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                {n.delivery_status === "failed" && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-danger">
                    <ArrowClockwise size={12} />
                    Phone unreachable. Retrying in 15 min.
                  </div>
                )}
              </div>
              <StatusBadge status={n.delivery_status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { BellSlash, ChatCircleDots, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
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

  const refetch = useCallback(async () => {
    setNotifications(await fetchNotifications());
  }, []);

  useRealtimeRefresh("notifications", undefined, refetch);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<BellSlash size={22} weight="bold" />}
        title="No alerts yet"
        description="Reminders and confirmations about your appointments will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
              n.channel === "sms" ? "bg-primary-tint text-primary" : "bg-accent-tint text-accent-dark"
            }`}
          >
            {n.channel === "sms" ? <ChatCircleDots size={18} /> : <EnvelopeSimple size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-sm font-semibold text-ink">
              Appointment reminder · {n.channel.toUpperCase()}
            </div>
            <div className="text-[13px] text-muted">
              {new Date(n.sent_at ?? n.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
          <StatusBadge status={n.delivery_status} />
        </div>
      ))}
    </div>
  );
}

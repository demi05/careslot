"use client";

import { useState, useCallback } from "react";
import { ArrowClockwise, Bell } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export interface NotificationLogRow {
  id: string;
  channel: "sms" | "email";
  delivery_status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
  appointments: { appointment_date: string; patient: { full_name: string | null } | null } | null;
}

async function fetchLog(): Promise<NotificationLogRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      "id, channel, delivery_status, sent_at, created_at, appointments(appointment_date, patient:profiles!appointments_patient_id_fkey(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as NotificationLogRow[];
}

export function NotificationLogTable({ initialNotifications }: { initialNotifications: NotificationLogRow[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setNotifications(await fetchLog());
  }, []);

  useRealtimeRefresh("notifications", undefined, refetch);

  async function handleRetry(id: string) {
    setRetryingId(id);
    const supabase = createClient();
    await supabase.from("notifications").update({ delivery_status: "pending", error_message: null }).eq("id", id);
    setRetryingId(null);
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={22} weight="bold" />}
        title="No notifications sent yet"
        description="Reminders and confirmations sent to patients will be logged here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <div className="flex min-w-[700px] bg-background px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted">
        <div className="w-40">Patient</div>
        <div className="w-32">Appt. date</div>
        <div className="w-24">Channel</div>
        <div className="w-44">Sent</div>
        <div className="w-28">Status</div>
      </div>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="flex min-w-[700px] flex-wrap items-center border-b border-[#F1F2F3] px-5 py-3.5 text-sm last:border-b-0"
        >
          <div className="w-40 truncate font-semibold text-ink">
            {n.appointments?.patient?.full_name ?? "Patient"}
          </div>
          <div className="w-32 text-muted">
            {n.appointments ? formatDate(n.appointments.appointment_date) : "—"}
          </div>
          <div className="w-24 text-muted">{n.channel.toUpperCase()}</div>
          <div className="w-44 text-muted">
            {new Date(n.sent_at ?? n.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
          <div className="w-28">
            <StatusBadge status={n.delivery_status} />
          </div>
          {n.delivery_status === "failed" && (
            <button
              type="button"
              onClick={() => handleRetry(n.id)}
              disabled={retryingId === n.id}
              className="ml-3 flex items-center gap-1.5 rounded-lg border border-danger px-3 py-1.5 text-[12px] font-bold text-danger transition-colors hover:bg-danger-tint disabled:opacity-50"
            >
              <ArrowClockwise size={13} />
              {retryingId === n.id ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

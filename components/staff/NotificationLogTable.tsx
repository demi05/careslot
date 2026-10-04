"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowClockwise, Bell, EnvelopeSimple, ChatText, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { EmptyState } from "@/components/ui/EmptyState";

export interface NotificationLogRow {
  id: string;
  channel: "sms" | "email";
  recipient: string;
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
      "id, channel, recipient, delivery_status, sent_at, created_at, appointments(appointment_date, patient:profiles!appointments_patient_id_fkey(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as NotificationLogRow[];
}

type Filter = "all" | "email" | "sms" | "failed";

const tabs: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "failed", label: "Failed" },
];

const statusStyles: Record<string, { bg: string; icon: typeof CheckCircle }> = {
  sent: { bg: "bg-[#E3F5EA] text-[#137A3A]", icon: CheckCircle },
  pending: { bg: "bg-[#FDF1E1] text-[#B45309]", icon: Bell },
  failed: { bg: "bg-[#FDE8E8] text-[#B91C1C]", icon: WarningCircle },
};

export function NotificationLogTable({ initialNotifications }: { initialNotifications: NotificationLogRow[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
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

  const todayISO = new Date().toISOString().slice(0, 10);
  const emailToday = notifications.filter(
    (n) => n.channel === "email" && n.delivery_status === "sent" && (n.sent_at ?? n.created_at).slice(0, 10) === todayISO
  ).length;
  const smsToday = notifications.filter(
    (n) => n.channel === "sms" && n.delivery_status === "sent" && (n.sent_at ?? n.created_at).slice(0, 10) === todayISO
  ).length;
  const failedCount = notifications.filter((n) => n.delivery_status === "failed").length;

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "failed") return notifications.filter((n) => n.delivery_status === "failed");
    return notifications.filter((n) => n.channel === filter);
  }, [notifications, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">Notification log</h1>
          <p className="text-[13px] text-muted">Every reminder sent to patients, by email and SMS</p>
        </div>
        <div className="flex gap-2.5">
          <div className="flex items-center gap-2.5 rounded-[22px] bg-primary-tint px-4 py-2.5">
            <EnvelopeSimple size={20} className="text-primary" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-ink">{emailToday}</span>
              <span className="text-[11px] text-[#4F5F5B]">Emails today</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[22px] bg-accent-tint px-4 py-2.5">
            <ChatText size={20} className="text-accent-dark" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-ink">{smsToday}</span>
              <span className="text-[11px] text-[#6B5444]">SMS today</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[22px] bg-danger px-4 py-2.5 text-white">
            <WarningCircle size={20} />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold">{failedCount}</span>
              <span className="text-[11px]">Failed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex h-10 items-center rounded-full px-4 text-[13px] font-bold ${
              filter === t.key ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} weight="bold" />}
          title="No notifications sent yet"
          description="Reminders and confirmations sent to patients will be logged here."
        />
      ) : (
        <div className="overflow-hidden rounded-[30px] bg-surface shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <div className="grid grid-cols-[110px_1.2fr_2fr_0.9fr_1fr_110px] items-center gap-3 px-5 py-3.5 text-xs font-semibold text-muted">
            <span>Channel</span>
            <span>Recipient</span>
            <span>Subject</span>
            <span>Status</span>
            <span>Sent</span>
            <span />
          </div>
          {filtered.map((n) => {
            const style = statusStyles[n.delivery_status] ?? statusStyles.pending;
            const StatusIcon = style.icon;
            return (
              <div
                key={n.id}
                className="grid grid-cols-[110px_1.2fr_2fr_0.9fr_1fr_110px] items-center gap-3 border-t border-[#EEF2F1] px-5 py-3"
              >
                <span
                  className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    n.channel === "sms" ? "bg-accent-tint text-accent-dark" : "bg-primary-tint text-primary"
                  }`}
                >
                  {n.channel === "sms" ? <ChatText size={13} /> : <EnvelopeSimple size={13} />}
                  {n.channel === "sms" ? "SMS" : "Email"}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-ink">
                    {n.appointments?.patient?.full_name ?? "Patient"}
                  </div>
                  <div className="truncate text-[11px] text-muted">{n.recipient}</div>
                </div>
                <span className="truncate text-[13px] text-ink">Appointment reminder</span>
                <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.bg}`}>
                  <StatusIcon size={12} />
                  {n.delivery_status}
                </span>
                <span className="text-xs text-muted">
                  {new Date(n.sent_at ?? n.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {n.delivery_status === "failed" && (
                  <button
                    type="button"
                    onClick={() => handleRetry(n.id)}
                    disabled={retryingId === n.id}
                    className="flex h-8 items-center gap-1.5 justify-self-end rounded-full bg-danger px-3.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <ArrowClockwise size={13} />
                    {retryingId === n.id ? "…" : "Retry"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

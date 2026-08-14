"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, type Status } from "@/components/ui/StatusBadge";
import { cancelAppointmentAction } from "@/app/(patient)/appointments/actions";
import { formatDate, formatTime } from "@/lib/format";

export interface AppointmentRowData {
  id: string;
  doctorName: string | null;
  date: string;
  time: string;
  status: Status;
}

export function AppointmentRow({ id, doctorName, date, time, status }: AppointmentRowData) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canModify = status === "pending" || status === "confirmed";

  async function handleCancel() {
    setCancelling(true);
    await cancelAppointmentAction(id);
    setCancelling(false);
    setConfirming(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-[0_10px_22px_rgba(26,92,82,0.07)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
          {doctorName ? doctorName.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-ink">{doctorName ?? "Doctor to be assigned"}</div>
          <div className="truncate text-sm text-muted">
            {formatDate(date)} at {formatTime(time)}
          </div>
        </div>
      </div>

      <StatusBadge status={status} />

      {canModify && (
        <div className="flex gap-2">
          <Link
            href={`/appointments/${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-primary px-3.5 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-tint"
          >
            <Calendar size={15} />
            Reschedule
          </Link>
          {confirming ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-lg border border-danger px-3.5 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-tint disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Confirm cancel?"}
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-semibold text-[#9A4A40] transition-colors hover:bg-background"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

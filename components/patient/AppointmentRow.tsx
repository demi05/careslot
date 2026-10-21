"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, type Status } from "@/components/ui/StatusBadge";
import { cancelAppointmentAction } from "@/app/(patient)/appointments/actions";
import { formatTime } from "@/lib/format";

export interface AppointmentRowData {
  id: string;
  doctorName: string | null;
  specialty?: string | null;
  date: string;
  time: string;
  status: Status;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AppointmentRow({ id, doctorName, specialty, date, time, status }: AppointmentRowData) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canModify = status === "pending" || status === "confirmed";
  const d = new Date(`${date}T00:00:00`);

  async function handleCancel() {
    setCancelling(true);
    await cancelAppointmentAction(id);
    setCancelling(false);
    setConfirming(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[28px] bg-surface p-3.5 shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-[52px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-primary-tint text-primary">
          <span className="text-[10px] font-bold">{MONTHS[d.getMonth()]}</span>
          <span className="text-xl font-bold leading-none">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">{doctorName ?? "Doctor to be assigned"}</div>
          <div className="truncate text-xs text-muted">
            {specialty ? `${specialty}, ` : ""}
            {formatTime(time)}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {canModify && (
        <div className="flex gap-2">
          <Link
            href={`/appointments/${id}`}
            className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full bg-primary-tint text-[13px] font-bold text-primary"
          >
            <ArrowsClockwise size={14} />
            Reschedule
          </Link>
          {confirming ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex h-[38px] flex-1 items-center justify-center rounded-full bg-danger text-[13px] font-bold text-white disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Confirm cancel?"}
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex h-[38px] flex-1 items-center justify-center rounded-full text-[13px] font-bold text-danger shadow-[inset_0_0_0_1px_#F3C4C4]"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

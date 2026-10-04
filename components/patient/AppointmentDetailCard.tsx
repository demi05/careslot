"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  CalendarBlank,
  Clock,
  EnvelopeSimple,
  ChatText,
  ArrowsClockwise,
  ShareNetwork,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { cancelAppointmentAction, rescheduleAppointmentAction } from "@/app/(patient)/appointments/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BackButton } from "@/components/ui/BackButton";
import { Alert } from "@/components/ui/Alert";
import { SlotPicker } from "@/components/patient/SlotPicker";
import { formatDate, formatTime } from "@/lib/format";
import type { AppointmentWithDoctor } from "@/lib/appointments";

interface AppointmentDetailCardProps {
  appointment: AppointmentWithDoctor;
  doctorId: string;
}

export function AppointmentDetailCard({ appointment: initial, doctorId }: AppointmentDetailCardProps) {
  const [appointment, setAppointment] = useState(initial);
  const [showReschedule, setShowReschedule] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, reason, doctors(specialty, photo_url, profiles(full_name))")
      .eq("id", appointment.id)
      .single();
    if (data) setAppointment(data as unknown as AppointmentWithDoctor);
  }, [appointment.id]);

  useRealtimeRefresh("appointments", `id=eq.${appointment.id}`, refetch);

  async function handleReschedule(date: string, time: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = await rescheduleAppointmentAction(appointment.id, date, time);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAppointment((prev) => ({ ...prev, appointment_date: date, appointment_time: time, status: "pending" }));
    setSuccess("Appointment rescheduled.");
    setShowReschedule(false);
  }

  async function handleCancel() {
    setSaving(true);
    const result = await cancelAppointmentAction(appointment.id);
    setSaving(false);
    setConfirmingCancel(false);
    if (!result.error) {
      setAppointment((prev) => ({ ...prev, status: "cancelled" }));
    }
  }

  const doctorName = appointment.doctors?.profiles?.full_name ?? "Doctor to be assigned";
  const specialty = appointment.doctors?.specialty ?? "";
  const photoUrl = appointment.doctors?.photo_url ?? null;
  const canModify = appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div>
      <div className="relative mb-4 overflow-hidden rounded-[32px] bg-gradient-to-b from-[#CFE4DF] to-[#EAF3F0] p-5 pb-10">
        {photoUrl && (
          <div className="absolute right-0 top-0 h-full w-[55%]">
            <Image
              src={photoUrl}
              alt={doctorName}
              fill
              className="object-cover object-[50%_15%] [mask-image:linear-gradient(180deg,#000_65%,transparent_100%),linear-gradient(90deg,transparent_0%,#000_25%)] [mask-composite:intersect]"
            />
          </div>
        )}
        <div className="relative flex justify-between">
          <BackButton href="/appointments" />
          <button
            type="button"
            aria-label="Share"
            className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-12px_rgba(20,35,31,0.5)]"
          >
            <ShareNetwork size={18} />
          </button>
        </div>
        <div className="relative mt-6 flex flex-col gap-2">
          <StatusBadge status={appointment.status} />
          <h1 className="text-[32px] font-bold leading-[1.05] tracking-[-0.035em] text-ink">{doctorName}</h1>
          <p className="text-sm text-[#4F5F5B]">{specialty}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[36px] bg-surface p-5 shadow-[0_-10px_40px_-20px_rgba(20,35,31,0.3)]">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 rounded-[22px] bg-primary-tint p-3.5">
            <CalendarBlank size={18} className="text-primary" />
            <span className="mt-0.5 text-[11px] text-[#4F5F5B]">Date</span>
            <span className="text-[15px] font-bold text-ink">{formatDate(appointment.appointment_date)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[22px] bg-primary-tint p-3.5">
            <Clock size={18} className="text-primary" />
            <span className="mt-0.5 text-[11px] text-[#4F5F5B]">Time</span>
            <span className="text-[15px] font-bold text-ink">{formatTime(appointment.appointment_time)}</span>
          </div>
        </div>

        {appointment.reason && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Reason for visit</span>
            <span className="text-sm leading-relaxed text-ink">{appointment.reason}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-[#4F5F5B]">
          <span className="flex items-center gap-1.5">
            <EnvelopeSimple size={14} className="text-primary" />
            Email
          </span>
          <span className="flex items-center gap-1.5">
            <ChatText size={14} className="text-accent" />
            SMS
          </span>
          <span>reminders on</span>
        </div>

        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        {canModify ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReschedule((v) => !v)}
                className="flex h-[52px] flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-white"
              >
                <ArrowsClockwise size={16} />
                Reschedule
              </button>
              {confirmingCancel ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-danger text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? "…" : "Confirm?"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="flex h-[52px] flex-1 items-center justify-center rounded-full text-sm font-bold text-danger shadow-[inset_0_0_0_1px_#F3C4C4]"
                >
                  Cancel
                </button>
              )}
            </div>

            {showReschedule && (
              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm text-muted">Available slots with {doctorName}:</p>
                <SlotPicker doctorId={doctorId} onSelect={handleReschedule} />
                {saving && <p className="mt-2 text-sm text-muted">Saving…</p>}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-muted">
            This appointment is {appointment.status} and can no longer be changed.
          </p>
        )}
      </div>
    </div>
  );
}

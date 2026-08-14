"use client";

import { useState, useCallback } from "react";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      .select("id, appointment_date, appointment_time, status, reason, doctors(specialty, profiles(full_name))")
      .eq("id", appointment.id)
      .single();
    if (data) setAppointment(data as unknown as AppointmentWithDoctor);
  }, [appointment.id]);

  useRealtimeRefresh("appointments", `id=eq.${appointment.id}`, refetch);

  async function handleReschedule(date: string, time: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ appointment_date: date, appointment_time: time, status: "pending" })
      .eq("id", appointment.id);
    setSaving(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "That slot was just booked by someone else. Pick another time."
          : error.message
      );
      return;
    }
    setAppointment((prev) => ({ ...prev, appointment_date: date, appointment_time: time, status: "pending" }));
    setSuccess("Appointment rescheduled.");
    setShowReschedule(false);
  }

  async function handleCancel() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);
    setSaving(false);
    setConfirmingCancel(false);
    if (!error) {
      setAppointment((prev) => ({ ...prev, status: "cancelled" }));
    }
  }

  const doctorName = appointment.doctors?.profiles?.full_name ?? "Doctor to be assigned";
  const specialty = appointment.doctors?.specialty ?? "";
  const canModify = appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="rounded-2xl border border-border bg-surface p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-lg font-bold text-primary">
            {doctorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{doctorName}</h1>
            <p className="text-sm text-muted">{specialty}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="mb-6 flex flex-col gap-2.5 text-[15px]">
        <div className="flex justify-between">
          <span className="text-muted">Date</span>
          <strong>{formatDate(appointment.appointment_date)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Time</span>
          <strong>{formatTime(appointment.appointment_time)}</strong>
        </div>
        {appointment.reason && (
          <div className="flex justify-between gap-6">
            <span className="shrink-0 text-muted">Reason</span>
            <strong className="text-right">{appointment.reason}</strong>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {canModify ? (
        <>
          <button
            type="button"
            onClick={() => setShowReschedule((v) => !v)}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-primary-dark"
          >
            <CalendarCheck size={18} weight="bold" />
            Reschedule this appointment
          </button>

          {showReschedule && (
            <div className="mb-4 border-t border-border pt-5">
              <p className="mb-3 text-sm text-muted">Available slots with {doctorName}:</p>
              <SlotPicker doctorId={doctorId} onSelect={handleReschedule} />
              {saving && <p className="mt-2 text-sm text-muted">Saving…</p>}
            </div>
          )}

          <div className="pt-1 text-center">
            {confirmingCancel ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="text-sm font-semibold text-danger disabled:opacity-60"
              >
                {saving ? "Cancelling…" : "Confirm cancel?"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="text-sm font-semibold text-[#9A4A40]"
              >
                Cancel appointment
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-muted">
          This appointment is {appointment.status} and can no longer be changed.
        </p>
      )}
    </div>
  );
}

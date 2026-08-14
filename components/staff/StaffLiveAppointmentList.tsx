"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { staffUpdateAppointmentStatusAction } from "@/app/staff/appointments/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTime } from "@/lib/format";

export interface StaffAppointmentRow {
  id: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "no-show";
  patient: { full_name: string | null } | null;
  doctors: { specialty: string; profiles: { full_name: string | null } | null } | null;
}

async function fetchToday(today: string): Promise<StaffAppointmentRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, appointment_time, status, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
    )
    .eq("appointment_date", today)
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });
  return (data ?? []) as unknown as StaffAppointmentRow[];
}

const statusOptions: { value: "confirmed" | "pending" | "no-show"; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "no-show", label: "No-show" },
];

interface StaffLiveAppointmentListProps {
  initialAppointments: StaffAppointmentRow[];
  today: string;
  canEdit: boolean;
}

export function StaffLiveAppointmentList({ initialAppointments, today, canEdit }: StaffLiveAppointmentListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);

  const refetch = useCallback(async () => {
    setAppointments(await fetchToday(today));
  }, [today]);

  useRealtimeRefresh("appointments", undefined, refetch);

  async function handleStatusChange(id: string, status: string) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as StaffAppointmentRow["status"] } : a)));
    await staffUpdateAppointmentStatusAction(id, status as "confirmed" | "pending" | "no-show");
  }

  if (appointments.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        No appointments scheduled for today.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {appointments.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center gap-4 border-b border-[#F1F2F3] px-5 py-3.5 last:border-b-0"
        >
          <div className="w-36 truncate text-sm font-semibold text-ink">{a.patient?.full_name ?? "Patient"}</div>
          <div className="w-20 text-sm text-muted">{formatTime(a.appointment_time)}</div>
          <div className="w-40 truncate text-sm text-muted">{a.doctors?.profiles?.full_name ?? "Doctor"}</div>
          <div className="ml-auto">
            {canEdit ? (
              <select
                value={a.status === "cancelled" ? "pending" : a.status}
                onChange={(e) => handleStatusChange(a.id, e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <StatusBadge status={a.status} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

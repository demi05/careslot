"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { staffUpdateAppointmentStatusAction } from "@/app/staff/appointments/actions";
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

const statusDot: Record<string, string> = {
  confirmed: "#16A34A",
  pending: "#B45309",
  "no-show": "#DC2626",
  cancelled: "#9CA3AF",
};

const statusStyles: Record<string, string> = {
  confirmed: "bg-[#E3F5EA] text-[#137A3A]",
  pending: "bg-[#FDF1E1] text-[#B45309]",
  "no-show": "bg-[#FDE8E8] text-[#B91C1C]",
  cancelled: "bg-gray-100 text-gray-500",
};

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
      <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        No appointments scheduled for today.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {appointments.map((a) => {
        const initials = (a.patient?.full_name ?? "P").charAt(0).toUpperCase();
        return (
          <div key={a.id} className="grid grid-cols-[56px_14px_1fr_auto] items-center gap-3.5 py-2">
            <span className="text-[13px] font-semibold text-[#4F5F5B]">{formatTime(a.appointment_time)}</span>
            <span
              className="h-3 w-3 rounded-full border-[3px] bg-white"
              style={{ borderColor: statusDot[a.status] ?? "#9CA3AF" }}
            />
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{a.patient?.full_name ?? "Patient"}</div>
                <div className="truncate text-xs text-muted">{a.doctors?.profiles?.full_name ?? "Doctor"}</div>
              </div>
            </div>
            {canEdit ? (
              <select
                value={a.status === "cancelled" ? "pending" : a.status}
                onChange={(e) => handleStatusChange(a.id, e.target.value)}
                className={`rounded-full border-0 px-3 py-1.5 text-[11px] font-bold ${statusStyles[a.status] ?? ""}`}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[a.status] ?? ""}`}>
                {a.status}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

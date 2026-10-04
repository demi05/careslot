"use client";

import { useState, useCallback, useMemo } from "react";
import { MagnifyingGlass, Plus, Check, X, UserMinus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import {
  staffUpdateAppointmentStatusAction,
  staffBulkNoShowAction,
  staffRescheduleAppointmentAction,
} from "@/app/staff/appointments/actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlotPicker } from "@/components/patient/SlotPicker";
import { formatDate, formatTime } from "@/lib/format";

export interface StaffAppointmentFull {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "no-show";
  doctor_id: string;
  patient: { full_name: string | null } | null;
  doctors: { specialty: string; profiles: { full_name: string | null } | null } | null;
}

export interface DoctorFilterOption {
  id: string;
  name: string;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-[#E3F5EA] text-[#137A3A]",
  pending: "bg-[#FDF1E1] text-[#B45309]",
  cancelled: "bg-gray-100 text-gray-500",
  "no-show": "bg-[#FDE8E8] text-[#B91C1C]",
};

const statusFilters: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "no-show", label: "No-show" },
  { key: "cancelled", label: "Cancelled" },
];

async function fetchAppointments(): Promise<StaffAppointmentFull[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, appointment_time, status, doctor_id, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
    )
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(200);
  return (data ?? []) as unknown as StaffAppointmentFull[];
}

interface StaffAppointmentsManagerProps {
  initialAppointments: StaffAppointmentFull[];
  doctorOptions: DoctorFilterOption[];
}

export function StaffAppointmentsManager({ initialAppointments, doctorOptions }: StaffAppointmentsManagerProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setAppointments(await fetchAppointments());
  }, []);

  useRealtimeRefresh("appointments", undefined, refetch);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (search && !a.patient?.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (doctorFilter !== "all" && a.doctor_id !== doctorFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (dateFilter && a.appointment_date !== dateFilter) return false;
      return true;
    });
  }, [appointments, search, doctorFilter, statusFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: appointments.length };
    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });
    return counts;
  }, [appointments]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateStatus(id: string, status: "confirmed" | "cancelled" | "no-show") {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await staffUpdateAppointmentStatusAction(id, status);
  }

  async function markSelectedNoShow() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setAppointments((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, status: "no-show" } : a)));
    await staffBulkNoShowAction(ids);
    setSelected(new Set());
  }

  async function confirmSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setAppointments((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, status: "confirmed" } : a)));
    await Promise.all(ids.map((id) => staffUpdateAppointmentStatusAction(id, "confirmed")));
    setSelected(new Set());
  }

  async function handleReschedule(id: string, date: string, time: string) {
    await staffRescheduleAppointmentAction(id, date, time);
    setReschedulingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[260px] flex-1">
          <MagnifyingGlass size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search patient or doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[46px] w-full rounded-full bg-white pl-11 pr-4 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none focus:shadow-[inset_0_0_0_2px_#1A5C52]"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-[46px] rounded-full bg-white px-4 text-[13px] font-semibold text-ink shadow-[inset_0_0_0_1px_#E2EAE8] focus:outline-none"
        />
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="h-[46px] rounded-full bg-white px-4 text-[13px] font-semibold text-ink shadow-[inset_0_0_0_1px_#E2EAE8] focus:outline-none"
        >
          <option value="all">All doctors</option>
          {doctorOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="flex h-[46px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white"
        >
          <Plus size={16} />
          New booking
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-bold ${
              statusFilter === f.key ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                statusFilter === f.key ? "bg-white/20" : "bg-background"
              }`}
            >
              {statusCounts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={22} weight="bold" />}
          title="No appointments match"
          description="Try a different search or filter."
        />
      ) : (
        <div className="overflow-hidden rounded-[30px] bg-surface shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <div className="grid grid-cols-[44px_1.4fr_1.5fr_1fr_0.9fr_230px] items-center px-5 py-3.5 text-xs font-semibold text-muted">
            <span />
            <span>Patient</span>
            <span>Doctor</span>
            <span>Date and time</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {filtered.map((a) => {
            const initials = (a.patient?.full_name ?? "P").charAt(0).toUpperCase();
            return (
              <div key={a.id} className="border-t border-[#EEF2F1]">
                <div className="grid grid-cols-[44px_1.4fr_1.5fr_1fr_0.9fr_230px] items-center px-5 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleSelected(a.id)}
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-[8px] text-white ${
                      selected.has(a.id) ? "bg-primary" : "shadow-[inset_0_0_0_1px_#DCE5E2]"
                    }`}
                  >
                    {selected.has(a.id) && <Check size={13} weight="bold" />}
                  </button>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">
                      {initials}
                    </span>
                    <span className="truncate text-sm font-bold text-ink">{a.patient?.full_name ?? "Patient"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-ink">
                      {a.doctors?.profiles?.full_name ?? "Doctor"}
                    </div>
                    <div className="truncate text-[11px] text-muted">{a.doctors?.specialty}</div>
                  </div>
                  <span className="text-[13px] text-ink">
                    {formatDate(a.appointment_date)}, {formatTime(a.appointment_time)}
                  </span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[a.status]}`}>
                    {a.status}
                  </span>
                  <div className="flex justify-end gap-1.5">
                    {a.status !== "confirmed" && a.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(a.id, "confirmed")}
                        className="flex h-8 items-center rounded-full bg-primary-tint px-3 text-xs font-bold text-primary"
                      >
                        Confirm
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}
                        className="flex h-8 items-center rounded-full px-3 text-xs font-bold text-ink shadow-[inset_0_0_0_1px_#DCE5E2]"
                      >
                        Reschedule
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(a.id, "cancelled")}
                        aria-label="Cancel"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-danger shadow-[inset_0_0_0_1px_#F3C4C4]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {reschedulingId === a.id && (
                  <div className="border-t border-[#EEF2F1] bg-background px-5 py-4">
                    <SlotPicker doctorId={a.doctor_id} onSelect={(date, time) => handleReschedule(a.id, date, time)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3.5 rounded-full bg-primary-dark py-2 pl-5 pr-2 text-white shadow-[0_20px_40px_-16px_rgba(18,64,57,0.7)]">
          <span className="text-[13px] font-bold">{selected.size} selected</span>
          <button
            type="button"
            onClick={markSelectedNoShow}
            className="flex h-[38px] items-center gap-1.5 rounded-full bg-danger px-4 text-[13px] font-bold"
          >
            <UserMinus size={14} />
            Mark no-show
          </button>
          <button
            type="button"
            onClick={confirmSelected}
            className="flex h-[38px] items-center rounded-full bg-white/15 px-4 text-[13px] font-bold"
          >
            Confirm all
          </button>
        </div>
      )}
    </div>
  );
}

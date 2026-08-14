"use client";

import { useState, useCallback, useMemo } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((a) => a.id))));
  }

  async function updateStatus(id: string, status: "confirmed" | "cancelled" | "no-show") {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const supabase = createClient();
    await supabase.from("appointments").update({ status }).eq("id", id);
  }

  async function markSelectedNoShow() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setAppointments((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, status: "no-show" } : a)));
    const supabase = createClient();
    await supabase.from("appointments").update({ status: "no-show" }).in("id", ids);
    setSelected(new Set());
  }

  async function handleReschedule(id: string, date: string, time: string) {
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ appointment_date: date, appointment_time: time, status: "pending" })
      .eq("id", id);
    setReschedulingId(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search patient name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        >
          <option value="all">All doctors</option>
          {doctorOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-show</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selected.size === filtered.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 accent-primary"
          />
          Select all
        </label>
        <button
          type="button"
          onClick={markSelectedNoShow}
          disabled={selected.size === 0}
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark selected as no-show
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={22} weight="bold" />}
          title="No appointments match"
          description="Try a different search or filter."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {filtered.map((a) => (
            <div key={a.id} className="border-b border-[#F1F2F3] last:border-b-0">
              <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleSelected(a.id)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <div className="w-36 truncate text-sm font-semibold text-ink">
                  {a.patient?.full_name ?? "Patient"}
                </div>
                <div className="w-40 truncate text-sm text-muted">{a.doctors?.profiles?.full_name ?? "Doctor"}</div>
                <div className="w-28 text-sm text-muted">{formatDate(a.appointment_date)}</div>
                <div className="w-20 text-sm text-muted">{formatTime(a.appointment_time)}</div>
                <StatusBadge status={a.status} />
                <div className="ml-auto flex gap-2">
                  {a.status !== "confirmed" && a.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(a.id, "confirmed")}
                      className="rounded-lg border border-primary px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary-tint"
                    >
                      Confirm
                    </button>
                  )}
                  {a.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => setReschedulingId(reschedulingId === a.id ? null : a.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:bg-background"
                    >
                      Reschedule
                    </button>
                  )}
                  {a.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(a.id, "cancelled")}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold text-[#9A4A40] transition-colors hover:bg-background"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {reschedulingId === a.id && (
                <div className="border-t border-[#F1F2F3] bg-background px-5 py-4">
                  <SlotPicker doctorId={a.doctor_id} onSelect={(date, time) => handleReschedule(a.id, date, time)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

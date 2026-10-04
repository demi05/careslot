"use client";

import { useState, useCallback } from "react";
import { CalendarX } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { fetchPatientAppointments, type AppointmentWithDoctor } from "@/lib/appointments";
import { AppointmentRow } from "@/components/patient/AppointmentRow";
import { EmptyState } from "@/components/ui/EmptyState";

type Filter = "upcoming" | "past" | "cancelled" | "all";

const filters: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

interface AppointmentsListProps {
  initialAppointments: AppointmentWithDoctor[];
  userId: string;
}

export function AppointmentsList({ initialAppointments, userId }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<Filter>("upcoming");

  const refetch = useCallback(async () => {
    const supabase = createClient();
    setAppointments(await fetchPatientAppointments(supabase, userId));
  }, [userId]);

  useRealtimeRefresh("appointments", `patient_id=eq.${userId}`, refetch);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = appointments.filter((a) => {
    if (filter === "cancelled") return a.status === "cancelled";
    if (filter === "upcoming") return a.status !== "cancelled" && a.appointment_date >= today;
    if (filter === "past") return a.status === "no-show" || (a.status !== "cancelled" && a.appointment_date < today);
    return true;
  });

  return (
    <div>
      <div className="mb-5 grid grid-cols-4 gap-1 rounded-full bg-white p-[5px] shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex h-10 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
              filter === f.key ? "bg-primary text-white" : "text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarX size={22} weight="bold" />}
          title="No appointments in this view"
          description="Appointments matching this filter will show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <AppointmentRow
              key={a.id}
              id={a.id}
              doctorName={a.doctors?.profiles?.full_name ?? null}
              specialty={a.doctors?.specialty ?? null}
              date={a.appointment_date}
              time={a.appointment_time}
              status={a.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}

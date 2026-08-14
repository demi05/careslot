import { CalendarCheck, CheckCircle, Clock, XCircle } from "@phosphor-icons/react/dist/ssr";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/staff/StatCard";
import { StaffLiveAppointmentList, type StaffAppointmentRow } from "@/components/staff/StaffLiveAppointmentList";

export default async function StaffDashboardPage() {
  const { role } = await requireStaff();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, appointment_time, status, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
    )
    .eq("appointment_date", today)
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });

  const appointments = (data ?? []) as unknown as StaffAppointmentRow[];
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const noShowCount = appointments.filter((a) => a.status === "no-show").length;

  const formattedDate = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-bold text-ink">Today&apos;s clinic activity</h1>
      <p className="mb-6 text-[15px] text-muted">{formattedDate}</p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's appointments" icon={<CalendarCheck size={16} />} value={appointments.length} />
        <StatCard
          label="Confirmed"
          icon={<CheckCircle size={16} />}
          value={confirmedCount}
          valueClassName="text-success"
        />
        <StatCard label="Pending" icon={<Clock size={16} />} value={pendingCount} valueClassName="text-warning" />
        <StatCard label="No-shows" icon={<XCircle size={16} />} value={noShowCount} valueClassName="text-danger" />
      </div>

      <h2 className="mb-3.5 text-[17px] font-bold text-ink">Live appointment list</h2>
      <StaffLiveAppointmentList initialAppointments={appointments} today={today} canEdit={role !== "doctor"} />
    </div>
  );
}

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StaffAppointmentsManager,
  type StaffAppointmentFull,
  type DoctorFilterOption,
} from "@/components/staff/StaffAppointmentsManager";

export default async function StaffAppointmentsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = createClient();

  const [{ data: appointmentsData }, { data: doctorsData }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, status, doctor_id, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
      )
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .limit(200),
    supabase.from("doctors").select("id, profiles(full_name)").eq("is_active", true),
  ]);

  const doctorRows = (doctorsData ?? []) as unknown as { id: string; profiles: { full_name: string | null } | null }[];
  const doctorOptions: DoctorFilterOption[] = doctorRows.map((d) => ({
    id: d.id,
    name: d.profiles?.full_name ?? "Doctor",
  }));

  return (
    <div className="max-w-6xl p-8">
      <h1 className="mb-5 text-2xl font-bold text-ink">All appointments</h1>
      <StaffAppointmentsManager
        initialAppointments={(appointmentsData ?? []) as unknown as StaffAppointmentFull[]}
        doctorOptions={doctorOptions}
      />
    </div>
  );
}

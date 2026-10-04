import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StaffAppointmentsManager,
  type StaffAppointmentFull,
  type DoctorFilterOption,
} from "@/components/staff/StaffAppointmentsManager";

export default async function StaffAppointmentsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = await createClient();

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
    <div className="flex min-h-screen flex-col gap-4 p-7">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">Appointments</h1>
        <p className="text-[13px] text-muted">Every booking across all doctors</p>
      </div>
      <StaffAppointmentsManager
        initialAppointments={(appointmentsData ?? []) as unknown as StaffAppointmentFull[]}
        doctorOptions={doctorOptions}
      />
    </div>
  );
}

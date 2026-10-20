import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StaffAppointmentsManager,
  type StaffAppointmentFull,
  type DoctorFilterOption,
  type PatientOption,
} from "@/components/staff/StaffAppointmentsManager";

export default async function StaffAppointmentsPage() {
  const { user, role } = await requireStaff(["doctor", "front-desk", "admin"]);
  const supabase = await createClient();
  const isDoctor = role === "doctor";

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, appointment_date, appointment_time, status, doctor_id, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
    )
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(200);
  if (isDoctor) appointmentsQuery = appointmentsQuery.eq("doctor_id", user.id);

  const [{ data: appointmentsData }, { data: doctorsData }, { data: patientsData }] = await Promise.all([
    appointmentsQuery,
    isDoctor ? Promise.resolve({ data: null }) : supabase.from("doctors").select("id, profiles(full_name)").eq("is_active", true),
    isDoctor ? Promise.resolve({ data: null }) : supabase.from("profiles").select("id, full_name").eq("role", "patient").order("full_name"),
  ]);

  const doctorRows = (doctorsData ?? []) as unknown as { id: string; profiles: { full_name: string | null } | null }[];
  const doctorOptions: DoctorFilterOption[] = doctorRows.map((d) => ({
    id: d.id,
    name: d.profiles?.full_name ?? "Doctor",
  }));

  return (
    <div className="flex min-h-screen flex-col gap-4 p-7">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">{isDoctor ? "My appointments" : "Appointments"}</h1>
        <p className="text-[13px] text-muted">{isDoctor ? "Every booking assigned to you" : "Every booking across all doctors"}</p>
      </div>
      <StaffAppointmentsManager
        initialAppointments={(appointmentsData ?? []) as unknown as StaffAppointmentFull[]}
        doctorOptions={doctorOptions}
        patientOptions={(patientsData ?? []) as PatientOption[]}
        readOnly={isDoctor}
        ownDoctorId={isDoctor ? user.id : undefined}
      />
    </div>
  );
}

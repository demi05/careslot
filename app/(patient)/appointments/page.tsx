import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchPatientAppointments } from "@/lib/appointments";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentsList } from "@/components/patient/AppointmentsList";

export default async function AppointmentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appointments = await fetchPatientAppointments(supabase, user.id);
  const fullName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  )?.trim();

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-7 sm:px-8">
        <h1 className="mb-5 text-2xl font-bold text-ink">My appointments</h1>
        <AppointmentsList initialAppointments={appointments} userId={user.id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

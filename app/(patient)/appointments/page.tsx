import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { fetchPatientAppointments } from "@/lib/appointments";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentsList } from "@/components/patient/AppointmentsList";

export default async function AppointmentsPage() {
  const supabase = await createClient();
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
    <div className="flex min-h-screen flex-col animate-fade-in-up pb-28 sm:pb-0">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-7 sm:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-[-0.035em] text-ink">Appointments</h1>
          <Link
            href="/book"
            aria-label="Book an appointment"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_20px_-10px_rgba(224,123,57,0.8)]"
          >
            <Plus size={20} />
          </Link>
        </div>
        <AppointmentsList initialAppointments={appointments} userId={user.id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

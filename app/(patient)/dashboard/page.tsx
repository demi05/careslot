import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ListChecks, Pill, CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";
import type { Status } from "@/components/ui/StatusBadge";

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: Status;
  doctors: { full_name: string; specialty: string } | null;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
  const firstName = fullName?.split(" ")[0] || "there";

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("appointments")
    .select("id, appointment_date, appointment_time, status, doctors(full_name, specialty)")
    .eq("patient_id", user.id)
    .neq("status", "cancelled")
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .limit(4);

  const appointments = (!error && data ? data : []) as unknown as UpcomingAppointment[];

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-7 sm:px-8">
        <h1 className="mb-1.5 text-2xl font-bold text-ink sm:text-[26px]">Welcome back, {firstName}</h1>
        <p className="mb-5 text-base text-muted">Here is what&apos;s coming up.</p>

        <div className="mb-7 flex flex-wrap gap-3">
          <Link href="/book" className={buttonClasses("primary", "px-[22px] py-3.5 text-[15px]")}>
            <CalendarPlus size={18} weight="bold" />
            Book new appointment
          </Link>
          <Link href="/appointments" className={buttonClasses("outline", "px-[22px] py-3.5 text-[15px]")}>
            <ListChecks size={18} weight="bold" />
            View all appointments
          </Link>
          <Link href="/pharmacy" className={buttonClasses("ghost", "px-[22px] py-3.5 text-[15px]")}>
            <Pill size={18} weight="bold" />
            My medications
          </Link>
        </div>

        <h2 className="mb-3.5 text-lg font-bold text-ink">Upcoming appointments</h2>
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {appointments.map((a) => (
              <AppointmentCard
                key={a.id}
                id={a.id}
                doctorName={a.doctors?.full_name ?? null}
                specialty={a.doctors?.specialty ?? null}
                date={a.appointment_date}
                time={a.appointment_time}
                status={a.status}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck size={22} weight="bold" />}
            title="No upcoming appointments"
            description="When you book an appointment, it'll show up here so you can keep track of it."
            action={
              <Link href="/book" className={buttonClasses("primary", "mt-1 px-5 py-2.5 text-sm")}>
                Book an appointment
              </Link>
            }
          />
        )}
      </div>

      <PatientBottomTabs />
    </div>
  );
}

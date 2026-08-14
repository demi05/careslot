import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentDetailCard } from "@/components/patient/AppointmentDetailCard";
import type { AppointmentWithDoctor } from "@/lib/appointments";

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, doctor_id, appointment_date, appointment_time, status, reason, doctors(specialty, profiles(full_name))")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const fullName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  )?.trim();

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-7 sm:px-8">
        <Link
          href="/appointments"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to my appointments
        </Link>
        <AppointmentDetailCard appointment={data as unknown as AppointmentWithDoctor} doctorId={data.doctor_id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

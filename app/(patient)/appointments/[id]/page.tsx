import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentDetailCard } from "@/components/patient/AppointmentDetailCard";
import type { AppointmentWithDoctor } from "@/lib/appointments";

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  // Next 14 (pinned in package.json) passes these as plain objects; Next
  // 15+ made them Promises. Awaiting works correctly either way — await
  // on a non-Promise value just resolves immediately — so this is safe
  // regardless of which actually ends up installed.
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ action?: string }> | { action?: string };
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, doctor_id, appointment_date, appointment_time, status, reason, doctors(specialty, photo_url, profiles(full_name))"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const fullName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  )?.trim();

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up pb-28 sm:pb-0">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:px-8">
        <AppointmentDetailCard
          appointment={data as unknown as AppointmentWithDoctor}
          doctorId={data.doctor_id}
          autoOpenReschedule={resolvedSearchParams.action === "reschedule"}
        />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

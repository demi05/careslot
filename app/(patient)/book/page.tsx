import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { BookingWizard, type DoctorOption } from "@/components/patient/BookingWizard";

export default async function BookPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("doctors")
    .select("id, specialty, profiles(full_name)")
    .eq("is_active", true);

  const doctors = (data ?? []) as unknown as DoctorOption[];

  const fullName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  )?.trim();

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientTopNav userName={fullName || user.email || "there"} />

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-7 sm:px-8">
        <BookingWizard doctors={doctors} patientId={user.id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

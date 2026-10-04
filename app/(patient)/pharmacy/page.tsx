import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientSimpleHeader } from "@/components/patient/PatientSimpleHeader";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { MedicationsList, type MedicationRow } from "@/components/patient/MedicationsList";

export default async function PharmacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("medications")
    .select(
      "id, medication_name, dosage, status, logged_at, collected_at, profiles!medications_logged_by_fkey(full_name)"
    )
    .eq("patient_id", user.id)
    .order("logged_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up pb-28 sm:pb-0">
      <PatientSimpleHeader title="My medications" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:px-8">
        <MedicationsList initialMedications={(data ?? []) as unknown as MedicationRow[]} patientId={user.id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientSimpleHeader } from "@/components/patient/PatientSimpleHeader";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { MedicationsList, type MedicationRow } from "@/components/patient/MedicationsList";

export default async function PharmacyPage() {
  const supabase = createClient();
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
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientSimpleHeader title="Pharmacy" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        <h1 className="mb-1.5 text-[22px] font-bold text-ink">My medications</h1>
        <p className="mb-5 text-[15px] text-muted">
          Everything dispensed to you, and what&apos;s still waiting for pickup.
        </p>
        <MedicationsList initialMedications={(data ?? []) as unknown as MedicationRow[]} patientId={user.id} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

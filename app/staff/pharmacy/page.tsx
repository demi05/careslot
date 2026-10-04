import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PharmacyDeskManager,
  type PharmacyMedicationRow,
  type PatientOption,
} from "@/components/staff/PharmacyDeskManager";

export default async function StaffPharmacyPage() {
  await requireStaff(["doctor", "front-desk", "admin"]);
  const supabase = await createClient();

  const [{ data: medicationsData }, { data: patientsData }] = await Promise.all([
    supabase
      .from("medications")
      .select(
        "id, medication_name, dosage, status, logged_at, patient:profiles!medications_patient_id_fkey(full_name), logger:profiles!medications_logged_by_fkey(full_name)"
      )
      .order("logged_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("id, full_name").eq("role", "patient").order("full_name"),
  ]);

  return (
    <div className="min-h-screen p-7">
      <PharmacyDeskManager
        initialMedications={(medicationsData ?? []) as unknown as PharmacyMedicationRow[]}
        patients={(patientsData ?? []) as PatientOption[]}
      />
    </div>
  );
}

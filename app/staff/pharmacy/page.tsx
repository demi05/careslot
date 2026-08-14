import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PharmacyDeskManager,
  type PharmacyMedicationRow,
  type PatientOption,
} from "@/components/staff/PharmacyDeskManager";

export default async function StaffPharmacyPage() {
  const { user } = await requireStaff(["doctor", "front-desk", "admin"]);
  const supabase = createClient();

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
    <div className="max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-bold text-ink">Pharmacy desk</h1>
      <p className="mb-6 text-[15px] text-muted">
        Record what each patient collects. Anything left owing shows up in the patient&apos;s app.
      </p>
      <PharmacyDeskManager
        initialMedications={(medicationsData ?? []) as unknown as PharmacyMedicationRow[]}
        patients={(patientsData ?? []) as PatientOption[]}
        staffId={user.id}
      />
    </div>
  );
}

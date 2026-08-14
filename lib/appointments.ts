import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface AppointmentWithDoctor {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "no-show";
  reason: string | null;
  doctors: { specialty: string; profiles: { full_name: string | null } | null } | null;
}

export async function fetchPatientAppointments(
  supabase: SupabaseClient<Database>,
  patientId: string
): Promise<AppointmentWithDoctor[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, appointment_date, appointment_time, status, reason, doctors(specialty, profiles(full_name))")
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error || !data) return [];
  return data as unknown as AppointmentWithDoctor[];
}

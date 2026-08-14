"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { medicationReadyEmail } from "@/lib/emailTemplates";

interface ActionResult {
  error?: string;
}

export async function logMedicationAction(
  patientId: string,
  medicationName: string,
  dosage: string
): Promise<ActionResult> {
  const { user } = await requireStaff(["doctor", "front-desk", "admin"]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("medications")
    .insert({
      patient_id: patientId,
      medication_name: medicationName,
      dosage: dosage || null,
      logged_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not log the medication." };

  // medications aren't always tied to an appointment, and
  // notifications.appointment_id is required, so this send isn't logged
  // to the notifications table the way appointment emails are.
  const admin = createAdminClient();
  const { data: patientData } = await admin.auth.admin.getUserById(patientId);
  const email = patientData.user?.email;
  if (email) {
    const { subject, html } = medicationReadyEmail({ medicationName });
    await sendEmail(email, subject, html);
  }

  revalidatePath("/staff/pharmacy");
  return {};
}

export async function markMedicationCollectedAction(medicationId: string): Promise<ActionResult> {
  await requireStaff(["doctor", "front-desk", "admin"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("medications")
    .update({ status: "collected", collected_at: new Date().toISOString() })
    .eq("id", medicationId);

  if (error) return { error: error.message };

  revalidatePath("/staff/pharmacy");
  return {};
}

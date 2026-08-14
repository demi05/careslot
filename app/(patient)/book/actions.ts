"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyByEmail } from "@/lib/notify";
import { appointmentBookedEmail } from "@/lib/emailTemplates";

interface ActionResult {
  error?: string;
}

interface BookedAppointment {
  id: string;
  doctors: { profiles: { full_name: string | null } | null } | null;
}

export async function bookAppointmentAction(
  doctorId: string,
  appointmentDate: string,
  appointmentTime: string,
  reason: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in to book an appointment." };

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: user.id,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      reason: reason || null,
    })
    .select("id, doctors(profiles(full_name))")
    .single();

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "That slot was just booked by someone else. Please pick another time."
          : (error?.message ?? "Could not book the appointment."),
    };
  }

  const appt = data as unknown as BookedAppointment;
  if (user.email) {
    const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
    const { subject, html } = appointmentBookedEmail({ doctorName, appointmentDate, appointmentTime });
    await notifyByEmail(appt.id, user.email, subject, html);
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return {};
}

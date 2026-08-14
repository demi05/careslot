"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyByEmail } from "@/lib/notify";
import { appointmentCancelledEmail, appointmentRescheduledEmail } from "@/lib/emailTemplates";

interface ActionResult {
  error?: string;
}

interface AppointmentWithDoctorName {
  id: string;
  appointment_date: string;
  appointment_time: string;
  doctors: { profiles: { full_name: string | null } | null } | null;
}

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .select("id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not cancel the appointment." };

  const appt = data as unknown as AppointmentWithDoctorName;
  if (user.email) {
    const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
    const { subject, html } = appointmentCancelledEmail({
      doctorName,
      appointmentDate: appt.appointment_date,
      appointmentTime: appt.appointment_time,
    });
    await notifyByEmail(appointmentId, user.email, subject, html);
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return {};
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("appointments")
    .update({ appointment_date: appointmentDate, appointment_time: appointmentTime, status: "pending" })
    .eq("id", appointmentId)
    .select("id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "That slot was just booked by someone else. Please pick another time."
          : (error?.message ?? "Could not reschedule the appointment."),
    };
  }

  const appt = data as unknown as AppointmentWithDoctorName;
  if (user.email) {
    const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
    const { subject, html } = appointmentRescheduledEmail({
      doctorName,
      appointmentDate: appt.appointment_date,
      appointmentTime: appt.appointment_time,
    });
    await notifyByEmail(appointmentId, user.email, subject, html);
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");
  return {};
}

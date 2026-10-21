"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAppointmentEvent } from "@/lib/notify";
import { appointmentCancelledEmail, appointmentRescheduledEmail } from "@/lib/emailTemplates";
import { appointmentCancelledSms, appointmentRescheduledSms } from "@/lib/smsTemplates";

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
  const supabase = await createClient();
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
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
    const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
    const appointmentDate = appt.appointment_date;
    const appointmentTime = appt.appointment_time;
    const { subject, html } = appointmentCancelledEmail({ doctorName, appointmentDate, appointmentTime });
    await notifyAppointmentEvent({
      appointmentId,
      email: user.email,
      phone: profile?.phone,
      emailSubject: subject,
      emailHtml: html,
      smsMessage: appointmentCancelledSms({ doctorName, appointmentDate, appointmentTime }),
    });
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
  const supabase = await createClient();
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
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
    const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
    const { subject, html } = appointmentRescheduledEmail({ doctorName, appointmentDate, appointmentTime });
    await notifyAppointmentEvent({
      appointmentId,
      email: user.email,
      phone: profile?.phone,
      emailSubject: subject,
      emailHtml: html,
      smsMessage: appointmentRescheduledSms({ doctorName, appointmentDate, appointmentTime }),
    });
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAppointmentEvent } from "@/lib/notify";
import { isPastSlot } from "@/lib/time";
import {
  appointmentBookedEmail,
  appointmentConfirmedEmail,
  appointmentCancelledEmail,
  appointmentRescheduledEmail,
} from "@/lib/emailTemplates";
import {
  appointmentBookedSms,
  appointmentConfirmedSms,
  appointmentCancelledSms,
  appointmentRescheduledSms,
} from "@/lib/smsTemplates";

interface ActionResult {
  error?: string;
}

interface AppointmentForNotify {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  doctors: { profiles: { full_name: string | null } | null } | null;
}

type EmailBuilder = (input: {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}) => { subject: string; html: string };

type SmsBuilder = (input: { doctorName: string; appointmentDate: string; appointmentTime: string }) => string;

async function notifyPatientOfAppointment(
  appt: AppointmentForNotify,
  emailBuilder: EmailBuilder,
  smsBuilder: SmsBuilder
) {
  const admin = createAdminClient();
  const [{ data: userData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(appt.patient_id),
    admin.from("profiles").select("phone").eq("id", appt.patient_id).single(),
  ]);
  const email = userData.user?.email;
  if (!email) return;

  const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
  const appointmentDate = appt.appointment_date;
  const appointmentTime = appt.appointment_time;
  const { subject, html } = emailBuilder({ doctorName, appointmentDate, appointmentTime });
  await notifyAppointmentEvent({
    appointmentId: appt.id,
    email,
    phone: profile?.phone,
    emailSubject: subject,
    emailHtml: html,
    smsMessage: smsBuilder({ doctorName, appointmentDate, appointmentTime }),
  });
}

export async function staffUpdateAppointmentStatusAction(
  appointmentId: string,
  status: "confirmed" | "pending" | "cancelled" | "no-show" | "completed"
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("id, patient_id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not update the appointment." };

  const appt = data as unknown as AppointmentForNotify;
  if (status === "confirmed") {
    await notifyPatientOfAppointment(appt, appointmentConfirmedEmail, appointmentConfirmedSms);
  } else if (status === "cancelled") {
    await notifyPatientOfAppointment(appt, appointmentCancelledEmail, appointmentCancelledSms);
  }

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/appointments");
  return {};
}

export async function staffBulkNoShowAction(appointmentIds: string[]): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  if (appointmentIds.length === 0) return {};

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status: "no-show" }).in("id", appointmentIds);
  if (error) return { error: error.message };

  revalidatePath("/staff/appointments");
  return {};
}

export async function staffRescheduleAppointmentAction(
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  if (isPastSlot(appointmentDate, appointmentTime)) {
    return { error: "That time has already passed. Please pick a time in the future." };
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ appointment_date: appointmentDate, appointment_time: appointmentTime, status: "pending" })
    .eq("id", appointmentId)
    .select("id, patient_id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "That slot is already booked. Please pick another time."
          : (error?.message ?? "Could not reschedule the appointment."),
    };
  }

  const appt = data as unknown as AppointmentForNotify;
  await notifyPatientOfAppointment(appt, appointmentRescheduledEmail, appointmentRescheduledSms);

  revalidatePath("/staff/appointments");
  return {};
}

/**
 * Front-desk/admin booking on behalf of a patient (phone calls,
 * walk-ins) -- the counterpart to the patient's own self-service
 * booking flow (app/(patient)/book/actions.ts), using the "appointments:
 * staff book any" RLS policy rather than the patient's own-row one.
 */
export async function staffCreateAppointmentAction(
  patientId: string,
  doctorId: string,
  appointmentDate: string,
  appointmentTime: string,
  reason?: string
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);

  if (!patientId) return { error: "Choose a patient." };
  if (!doctorId) return { error: "Choose a doctor." };
  if (!appointmentDate || !appointmentTime) return { error: "Choose a date and time." };
  if (isPastSlot(appointmentDate, appointmentTime)) {
    return { error: "That time has already passed. Please pick a time in the future." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      reason: reason?.trim() || null,
    })
    .select("id, patient_id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "That slot is already booked. Please pick another time."
          : (error?.message ?? "Could not create the appointment."),
    };
  }

  const appt = data as unknown as AppointmentForNotify;
  await notifyPatientOfAppointment(appt, appointmentBookedEmail, appointmentBookedSms);

  revalidatePath("/staff/appointments");
  revalidatePath("/staff/dashboard");
  return {};
}

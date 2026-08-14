"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyByEmail } from "@/lib/notify";
import {
  appointmentConfirmedEmail,
  appointmentCancelledEmail,
  appointmentRescheduledEmail,
} from "@/lib/emailTemplates";

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

async function notifyPatientOfAppointment(appt: AppointmentForNotify, emailBuilder: EmailBuilder) {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(appt.patient_id);
  const email = data.user?.email;
  if (!email) return;

  const doctorName = appt.doctors?.profiles?.full_name ?? "your doctor";
  const { subject, html } = emailBuilder({
    doctorName,
    appointmentDate: appt.appointment_date,
    appointmentTime: appt.appointment_time,
  });
  await notifyByEmail(appt.id, email, subject, html);
}

export async function staffUpdateAppointmentStatusAction(
  appointmentId: string,
  status: "confirmed" | "pending" | "cancelled" | "no-show"
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("id, patient_id, appointment_date, appointment_time, doctors(profiles(full_name))")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not update the appointment." };

  const appt = data as unknown as AppointmentForNotify;
  if (status === "confirmed") {
    await notifyPatientOfAppointment(appt, appointmentConfirmedEmail);
  } else if (status === "cancelled") {
    await notifyPatientOfAppointment(appt, appointmentCancelledEmail);
  }

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/appointments");
  return {};
}

export async function staffBulkNoShowAction(appointmentIds: string[]): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  if (appointmentIds.length === 0) return {};

  const supabase = createClient();
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
  const supabase = createClient();

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
  await notifyPatientOfAppointment(appt, appointmentRescheduledEmail);

  revalidatePath("/staff/appointments");
  return {};
}

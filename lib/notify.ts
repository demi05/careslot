import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

/**
 * Logs a notification row and sends the email, updating delivery_status
 * based on the result. Uses the admin client because notification logging
 * is a system action, not something the acting user's own RLS grants
 * should gate (a patient booking their own appointment has no INSERT
 * policy on notifications, for example — nor should they need one).
 * subject/html are stored on the row (not just sent) so a later automatic
 * retry can resend the exact same content without re-deriving it.
 */
export async function notifyByEmail(
  appointmentId: string,
  recipientEmail: string,
  subject: string,
  html: string
): Promise<void> {
  const admin = createAdminClient();

  const { data: notification } = await admin
    .from("notifications")
    .insert({ appointment_id: appointmentId, channel: "email", recipient: recipientEmail, subject, body: html })
    .select("id")
    .single();

  const result = await sendEmail(recipientEmail, subject, html);

  if (notification) {
    await admin
      .from("notifications")
      .update({
        delivery_status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
        error_message: result.ok ? null : (result.error ?? null),
      })
      .eq("id", notification.id);
  }
}

/**
 * Logs an SMS notification row and sends it through SmartSMSSolutions (see
 * lib/sms.ts). If SMARTSMS_* isn't configured yet, sendSms fails safely and
 * this logs delivery_status "failed" with that reason — the dual-channel
 * requirement stays demonstrable end-to-end (Notification Log, patient
 * Notifications screen, automatic retry) even before real credentials are
 * added, and the cron retry job will pick the row up the moment they are.
 */
export async function notifyBySms(appointmentId: string, recipientPhone: string, message: string): Promise<void> {
  const admin = createAdminClient();

  const { data: notification } = await admin
    .from("notifications")
    .insert({ appointment_id: appointmentId, channel: "sms", recipient: recipientPhone, body: message })
    .select("id")
    .single();

  const result = await sendSms(recipientPhone, message);

  if (notification) {
    await admin
      .from("notifications")
      .update({
        delivery_status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
        error_message: result.ok ? null : (result.error ?? null),
      })
      .eq("id", notification.id);
  }
}

/** Fires both notification channels for an appointment event in parallel. */
export async function notifyAppointmentEvent(input: {
  appointmentId: string;
  email: string;
  phone?: string | null;
  emailSubject: string;
  emailHtml: string;
  smsMessage: string;
}): Promise<void> {
  const { appointmentId, email, phone, emailSubject, emailHtml, smsMessage } = input;
  await Promise.all([
    notifyByEmail(appointmentId, email, emailSubject, emailHtml),
    phone ? notifyBySms(appointmentId, phone, smsMessage) : Promise.resolve(),
  ]);
}

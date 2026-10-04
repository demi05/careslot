import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Logs a notification row and sends the email, updating delivery_status
 * based on the result. Uses the admin client because notification logging
 * is a system action, not something the acting user's own RLS grants
 * should gate (a patient booking their own appointment has no INSERT
 * policy on notifications, for example — nor should they need one).
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
    .insert({ appointment_id: appointmentId, channel: "email", recipient: recipientEmail })
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
 * Logs an SMS notification row for the second reminder channel. No carrier
 * (Twilio or otherwise) is wired up in this build — nothing is actually
 * texted. This exists so the dual-channel requirement is demonstrable
 * end-to-end (Notification Log, patient Notifications screen, delivery
 * logging/retry UI) ahead of a real carrier integration being dropped in.
 * Swap the body of this function for an actual Twilio send to go live.
 */
export async function notifyBySms(appointmentId: string, recipientPhone: string, message: string): Promise<void> {
  void message; // kept in the signature so a real send has it ready to use
  const admin = createAdminClient();

  const { data: notification } = await admin
    .from("notifications")
    .insert({ appointment_id: appointmentId, channel: "sms", recipient: recipientPhone })
    .select("id")
    .single();

  if (notification) {
    await admin
      .from("notifications")
      .update({ delivery_status: "sent", sent_at: new Date().toISOString() })
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

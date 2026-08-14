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

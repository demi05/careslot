"use server";

import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

interface ActionResult {
  error?: string;
}

/**
 * Staff-triggered immediate retry, alongside the automatic cron retry
 * (app/api/cron/retry-notifications) — a front-desk/admin user doesn't
 * have to wait for the next scheduled pass. Re-sends the stored
 * subject/body rather than just flipping delivery_status back to
 * "pending" and leaving it there with nothing to act on it.
 */
export async function retryNotificationAction(id: string): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);
  const admin = createAdminClient();

  const { data: notification, error: fetchError } = await admin
    .from("notifications")
    .select("id, channel, recipient, subject, body, retry_count")
    .eq("id", id)
    .single();

  if (fetchError || !notification) {
    return { error: fetchError?.message ?? "Notification not found." };
  }

  const result =
    notification.channel === "email"
      ? await sendEmail(notification.recipient, notification.subject ?? "CareSlot notification", notification.body ?? "")
      : await sendSms(notification.recipient, notification.body ?? "");

  const { error: updateError } = await admin
    .from("notifications")
    .update({
      delivery_status: result.ok ? "sent" : "failed",
      sent_at: result.ok ? new Date().toISOString() : null,
      error_message: result.ok ? null : (result.error ?? null),
      retry_count: notification.retry_count + 1,
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };
  if (!result.ok) return { error: result.error ?? "Retry failed." };
  return {};
}

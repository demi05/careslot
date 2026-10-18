import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

const MAX_RETRIES = 3;

/**
 * Automatic retry for failed notification deliveries (FR3 / NFR4): run on
 * a schedule (see vercel.json) rather than left to a staff member noticing
 * and clicking retry. Bounded by retry_count so a persistently-broken
 * channel (e.g. SmartSMS not configured yet) logs and stops instead of
 * retrying forever.
 *
 * Protected by CRON_SECRET — Vercel Cron sends it automatically as a
 * bearer token when the env var is set; without it, this route is a no-op
 * guard rather than open to the public internet.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: failed, error } = await admin
    .from("notifications")
    .select("id, channel, recipient, subject, body, retry_count")
    .eq("delivery_status", "failed")
    .lt("retry_count", MAX_RETRIES);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let retried = 0;
  let recovered = 0;

  for (const notification of failed ?? []) {
    const result =
      notification.channel === "email"
        ? await sendEmail(notification.recipient, notification.subject ?? "CareSlot notification", notification.body ?? "")
        : await sendSms(notification.recipient, notification.body ?? "");

    await admin
      .from("notifications")
      .update({
        delivery_status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
        error_message: result.ok ? null : (result.error ?? null),
        retry_count: notification.retry_count + 1,
      })
      .eq("id", notification.id);

    retried++;
    if (result.ok) recovered++;
  }

  return NextResponse.json({ retried, recovered });
}

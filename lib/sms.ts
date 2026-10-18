import "server-only";

interface SendSmsResult {
  ok: boolean;
  error?: string;
}

/**
 * SmartSMSSolutions transactional SMS send (the provider named in the
 * project's methodology — chosen over Twilio for cost, per the literature
 * review). Auth is token-in-body, matching the vendor's published Email
 * API (POST .../v1/email/send/); their SMS endpoint isn't in public docs
 * as of this writing, so SMARTSMS_SEND_URL lets the real endpoint/path be
 * swapped in from the SmartSMS dashboard without a code change, and the
 * body field names below (sender, recipient, message) should be checked
 * against that dashboard's API reference before relying on this in
 * production — a wrong field name here still fails safely into a logged
 * "failed" delivery_status that the retry job will keep retrying, rather
 * than silently losing the notification.
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const token = process.env.SMARTSMS_API_TOKEN;
  const sender = process.env.SMARTSMS_SENDER_ID;
  const url = process.env.SMARTSMS_SEND_URL ?? "https://app.smartsmssolutions.com/io/api/client/v1/sms/send/";

  if (!token || !sender) {
    return { ok: false, error: "SmartSMSSolutions is not configured (missing SMARTSMS_* environment variables)." };
  }

  try {
    const body = new URLSearchParams({ token, sender, recipient: to, message });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data: unknown = await response.json().catch(() => null);
    const payload = (data ?? {}) as Record<string, unknown>;
    const ok = response.ok && (payload.status === "success" || payload.status === true || payload.status === 200);

    if (!ok) {
      const message =
        (typeof payload.message === "string" && payload.message) ||
        (typeof payload.error === "string" && payload.error) ||
        `SmartSMS request failed (${response.status}).`;
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS error." };
  }
}

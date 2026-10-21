import "server-only";

interface SendSmsResult {
  ok: boolean;
  error?: string;
}

/**
 * SmartSMSSolutions transactional SMS send (the provider named in the
 * project's methodology — chosen over Twilio for cost, per the literature
 * review). Per their developer portal (developer.smartsmssolutions.com),
 * the send endpoint is POST .../io/api/client/v1/sms/, form-encoded, with
 * the token in the body alongside sender/to/message/type — not .../sms/send/
 * and not "recipient", both corrected here from an earlier guess. That
 * portal page is old enough that some of this may have moved on; confirm
 * against your own dashboard's API reference once you have an account,
 * and override SMARTSMS_SEND_URL if the path differs — a wrong field name
 * here still fails safely into a logged "failed" delivery_status that the
 * retry job keeps retrying, rather than silently losing the notification.
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const token = process.env.SMARTSMS_API_TOKEN;
  const sender = process.env.SMARTSMS_SENDER_ID;
  const url = process.env.SMARTSMS_SEND_URL ?? "https://app.smartsmssolutions.com/io/api/client/v1/sms/";

  if (!token || !sender) {
    return { ok: false, error: "SmartSMSSolutions is not configured (missing SMARTSMS_* environment variables)." };
  }

  try {
    // type: 0 = plain text (1 = flash, 2 = unicode, 6 = unicode flash)
    const body = new URLSearchParams({ token, sender, to, message, type: "0" });
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

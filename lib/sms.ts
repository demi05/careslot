import "server-only";

interface SendSmsResult {
  ok: boolean;
  error?: string;
}

export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const token = process.env.SMARTSMS_API_TOKEN;
  const sender = process.env.SMARTSMS_SENDER_ID;
  const url = process.env.SMARTSMS_SEND_URL ?? "https://app.smartsmssolutions.com/io/api/client/v1/sms/";
  const routing = process.env.SMARTSMS_ROUTING ?? "3";

  if (!token || !sender) {
    return { ok: false, error: "SmartSMSSolutions is not configured (missing SMARTSMS_* environment variables)." };
  }

  try {
    const body = new URLSearchParams({ token, sender, to, message, type: "0", routing });
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

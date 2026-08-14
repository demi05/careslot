import "server-only";
import nodemailer from "nodemailer";

interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return { ok: false, error: "SMTP is not configured (missing SMTP_* environment variables)." };
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user, pass },
    });

    await transport.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error." };
  }
}

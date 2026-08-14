"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { staffVerificationCodeEmail } from "@/lib/emailTemplates";

interface ActionResult {
  error?: string;
}

type RequestableStaffRole = "doctor" | "front-desk";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isAllowedStaffEmail(email: string): boolean {
  const domain = process.env.NEXT_PUBLIC_STAFF_EMAIL_DOMAIN;
  if (!domain) return false;
  return email.trim().toLowerCase().endsWith(`@${domain.trim().toLowerCase()}`);
}

/**
 * Step 1 of self-service staff signup: validates the email is on the
 * hospital's real domain, then emails a one-time code to that address.
 * Nothing is created in auth.users yet — that only happens once the code
 * is verified, so a patient typing in someone else's hospital email
 * address can't get an account just by guessing.
 */
export async function requestStaffSignupAction(
  fullName: string,
  email: string,
  role: RequestableStaffRole,
  specialty: string
): Promise<ActionResult> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!fullName.trim() || !trimmedEmail) {
    return { error: "Full name and email are required." };
  }
  if (!isAllowedStaffEmail(trimmedEmail)) {
    const domain = process.env.NEXT_PUBLIC_STAFF_EMAIL_DOMAIN;
    return {
      error: domain
        ? `Staff accounts need a @${domain} email address.`
        : "Staff signup isn't configured for this deployment yet.",
    };
  }
  if (role === "doctor" && !specialty.trim()) {
    return { error: "Specialty is required for a doctor account." };
  }

  const admin = createAdminClient();

  // Clear out any earlier unverified attempts for this email so only the
  // latest code is valid.
  await admin.from("staff_signup_requests").delete().eq("email", trimmedEmail).eq("verified", false);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from("staff_signup_requests").insert({
    email: trimmedEmail,
    full_name: fullName.trim(),
    requested_role: role,
    specialty: role === "doctor" ? specialty.trim() : null,
    code,
    expires_at: expiresAt,
  });

  if (insertError) return { error: insertError.message };

  const { subject, html } = staffVerificationCodeEmail({ code });
  const sendResult = await sendEmail(trimmedEmail, subject, html);
  if (!sendResult.ok) {
    return { error: sendResult.error ?? "Could not send the verification email. Please try again." };
  }

  return {};
}

/**
 * Step 2: checks the code, then actually creates the account. This is
 * the only place a staff/doctor auth user gets created via this flow.
 */
export async function verifyStaffSignupCodeAction(email: string, code: string): Promise<ActionResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode) return { error: "Enter the code from your email." };

  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("staff_signup_requests")
    .select("id, full_name, requested_role, specialty, code, expires_at, verified")
    .eq("email", trimmedEmail)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !request) {
    return { error: "No pending signup found for that email. Request a new code." };
  }
  if (new Date(request.expires_at).getTime() < Date.now()) {
    return { error: "That code has expired. Request a new one." };
  }
  if (request.code !== trimmedCode) {
    return { error: "That code doesn't match. Check your email and try again." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    email_confirm: true,
    user_metadata: { full_name: request.full_name, role: request.requested_role },
  });

  if (createError || !created.user) {
    return {
      error:
        createError?.message === "A user with this email address has already been registered"
          ? "An account with this email already exists. Try logging in instead."
          : (createError?.message ?? "Could not create the account."),
    };
  }

  if (request.requested_role === "doctor") {
    const { error: doctorError } = await admin.from("doctors").insert({
      id: created.user.id,
      specialty: request.specialty ?? "General Practice",
    });
    if (doctorError) return { error: doctorError.message };
  }

  await admin.from("staff_signup_requests").update({ verified: true }).eq("id", request.id);

  return {};
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { staffVerificationCodeEmail } from "@/lib/emailTemplates";

interface ActionResult {
  error?: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Step 1 of self-service staff signup: checks the email against the
 * hospital's roster of approved workers (maintained by an admin in
 * Staff Settings) instead of an email domain — this hospital has no
 * institutional domain, so staff sign up with personal email addresses.
 * Nothing is created in auth.users yet — that only happens once the code
 * is verified, so typing in a roster-listed coworker's email address
 * can't get you an account just by guessing.
 */
export async function requestStaffSignupAction(email: string): Promise<ActionResult> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return { error: "Enter your email address." };
  }

  const admin = createAdminClient();

  const { data: rosterEntry, error: rosterError } = await admin
    .from("staff_roster")
    .select("email, full_name, role, specialty, claimed")
    .eq("email", trimmedEmail)
    .maybeSingle();

  if (rosterError) return { error: rosterError.message };
  if (!rosterEntry) {
    return {
      error: "This email isn't on the hospital's approved staff list. Ask an admin to add you first.",
    };
  }
  if (rosterEntry.claimed) {
    return { error: "An account already exists for this email. Try logging in instead." };
  }

  // Clear out any earlier unverified attempts for this email so only the
  // latest code is valid.
  await admin.from("staff_signup_requests").delete().eq("email", trimmedEmail).eq("verified", false);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from("staff_signup_requests").insert({
    email: trimmedEmail,
    full_name: rosterEntry.full_name,
    requested_role: rosterEntry.role === "admin" ? "front-desk" : rosterEntry.role,
    specialty: rosterEntry.specialty,
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
 * Step 2: checks the code, then actually creates the account, always
 * pulling the granted role/name/specialty fresh from the roster (never
 * trusting anything the client submitted) and marking the roster entry
 * claimed so the email can't be used to sign up again.
 */
export async function verifyStaffSignupCodeAction(email: string, code: string): Promise<ActionResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode) return { error: "Enter the code from your email." };

  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("staff_signup_requests")
    .select("id, code, expires_at, verified")
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

  const { data: rosterEntry, error: rosterError } = await admin
    .from("staff_roster")
    .select("full_name, role, specialty, claimed")
    .eq("email", trimmedEmail)
    .maybeSingle();

  if (rosterError || !rosterEntry) {
    return { error: "This email is no longer on the approved staff list. Contact an admin." };
  }
  if (rosterEntry.claimed) {
    return { error: "An account already exists for this email. Try logging in instead." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    email_confirm: true,
    user_metadata: { full_name: rosterEntry.full_name, role: rosterEntry.role },
  });

  if (createError || !created.user) {
    return {
      error:
        createError?.message === "A user with this email address has already been registered"
          ? "An account with this email already exists. Try logging in instead."
          : (createError?.message ?? "Could not create the account."),
    };
  }

  if (rosterEntry.role === "doctor") {
    const { error: doctorError } = await admin.from("doctors").insert({
      id: created.user.id,
      specialty: rosterEntry.specialty ?? "General Practice",
    });
    if (doctorError) return { error: doctorError.message };
  }

  await admin.from("staff_signup_requests").update({ verified: true }).eq("id", request.id);
  await admin
    .from("staff_roster")
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq("email", trimmedEmail);

  return {};
}

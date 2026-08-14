"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, type StaffRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ActionResult {
  error?: string;
}

/**
 * Creates a staff account (doctor, front-desk, or admin). Doctor accounts
 * can be created by front-desk or admin (matches "manage doctor profiles");
 * front-desk/admin accounts are more sensitive and restricted to admins.
 * New staff set their own password via the existing forgot-password flow.
 */
export async function createStaffMemberAction(
  fullName: string,
  email: string,
  role: StaffRole,
  specialty?: string
): Promise<ActionResult> {
  const requiredRoles: StaffRole[] = role === "doctor" ? ["front-desk", "admin"] : ["admin"];
  await requireStaff(requiredRoles);

  if (!fullName.trim() || !email.trim()) {
    return { error: "Full name and email are required." };
  }
  if (role === "doctor" && !specialty?.trim()) {
    return { error: "Specialty is required for a doctor account." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create the account." };
  }

  if (role === "doctor") {
    const { error: doctorError } = await admin.from("doctors").insert({
      id: created.user.id,
      specialty: specialty!.trim(),
    });
    if (doctorError) return { error: doctorError.message };
  }

  revalidatePath("/staff/settings");
  revalidatePath("/staff/doctors");
  return {};
}

/** Promotes/demotes an existing front-desk or admin staff member. Doctor role changes aren't handled here — they go through the doctors table separately. */
export async function updateStaffRoleAction(userId: string, role: "front-desk" | "admin"): Promise<ActionResult> {
  await requireStaff(["admin"]);

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/staff/settings");
  return {};
}

export async function toggleDoctorActiveAction(doctorId: string, isActive: boolean): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);

  const supabase = createClient();
  const { error } = await supabase.from("doctors").update({ is_active: isActive }).eq("id", doctorId);
  if (error) return { error: error.message };

  revalidatePath("/staff/settings");
  revalidatePath("/staff/doctors");
  return {};
}

/**
 * Adds a worker to the approved staff roster so they can self-sign-up on
 * /register (the hospital has no email domain to gate on, so this
 * admin-maintained list is the source of truth instead).
 */
export async function addRosterEntryAction(
  fullName: string,
  email: string,
  role: StaffRole,
  specialty?: string
): Promise<ActionResult> {
  const { user } = await requireStaff(["admin"]);

  const trimmedEmail = email.trim().toLowerCase();
  if (!fullName.trim() || !trimmedEmail) {
    return { error: "Full name and email are required." };
  }
  if (role === "doctor" && !specialty?.trim()) {
    return { error: "Specialty is required for a doctor." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("staff_roster").insert({
    email: trimmedEmail,
    full_name: fullName.trim(),
    role,
    specialty: role === "doctor" ? specialty!.trim() : null,
    added_by: user.id,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate") ? "This email is already on the roster." : error.message,
    };
  }

  revalidatePath("/staff/settings");
  return {};
}

/** Removes a roster entry — e.g. someone added by mistake, or who has left. */
export async function removeRosterEntryAction(rosterId: string): Promise<ActionResult> {
  await requireStaff(["admin"]);

  const supabase = createClient();
  const { error } = await supabase.from("staff_roster").delete().eq("id", rosterId);
  if (error) return { error: error.message };

  revalidatePath("/staff/settings");
  return {};
}

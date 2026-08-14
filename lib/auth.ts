import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "doctor" | "front-desk" | "admin";

/**
 * Fetches the current user + profile once per request (React cache dedupes
 * this across the staff layout and any page that also needs it).
 */
export const getCurrentProfile = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { user, role: profile.role, fullName: profile.full_name };
});

/** Redirects away unless the signed-in user has one of `allowedRoles`. */
export async function requireStaff(allowedRoles?: StaffRole[]) {
  const context = await getCurrentProfile();

  if (!context) {
    redirect("/login");
  }

  if (context.role === "patient") {
    redirect("/dashboard");
  }

  if (allowedRoles && !allowedRoles.includes(context.role as StaffRole)) {
    redirect("/staff/dashboard");
  }

  return { user: context.user, role: context.role as StaffRole, fullName: context.fullName };
}

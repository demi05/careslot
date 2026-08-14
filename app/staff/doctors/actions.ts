"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ActionResult {
  error?: string;
}

export async function createDoctorAction(
  fullName: string,
  email: string,
  specialty: string
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);

  if (!fullName.trim() || !email.trim() || !specialty.trim()) {
    return { error: "Full name, email, and specialty are all required." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role: "doctor" },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create the doctor's account." };
  }

  const { error: doctorError } = await admin.from("doctors").insert({
    id: created.user.id,
    specialty: specialty.trim(),
  });

  if (doctorError) {
    return { error: doctorError.message };
  }

  revalidatePath("/staff/doctors");
  return {};
}

export async function addScheduleWindowAction(
  doctorId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  slotDurationMinutes: number
): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);

  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("doctor_schedules").insert({
    doctor_id: doctorId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    slot_duration_minutes: slotDurationMinutes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff/doctors");
  return {};
}

export async function removeScheduleWindowAction(scheduleId: string): Promise<ActionResult> {
  await requireStaff(["front-desk", "admin"]);

  const supabase = createClient();
  const { error } = await supabase.from("doctor_schedules").delete().eq("id", scheduleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff/doctors");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  error?: string;
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

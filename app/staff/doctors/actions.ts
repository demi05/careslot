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
  const { user, role } = await requireStaff(["doctor", "front-desk", "admin"]);

  if (role === "doctor" && doctorId !== user.id) {
    return { error: "You can only manage your own schedule." };
  }

  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }

  const supabase = await createClient();
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
  revalidatePath("/staff/schedule");
  return {};
}

export async function removeScheduleWindowAction(scheduleId: string): Promise<ActionResult> {
  const { user, role } = await requireStaff(["doctor", "front-desk", "admin"]);

  const supabase = await createClient();

  if (role === "doctor") {
    const { data: schedule } = await supabase.from("doctor_schedules").select("doctor_id").eq("id", scheduleId).single();
    if (!schedule || schedule.doctor_id !== user.id) {
      return { error: "You can only manage your own schedule." };
    }
  }

  const { error } = await supabase.from("doctor_schedules").delete().eq("id", scheduleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff/doctors");
  revalidatePath("/staff/schedule");
  return {};
}

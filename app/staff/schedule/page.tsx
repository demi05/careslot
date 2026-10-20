import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MyScheduleManager } from "@/components/staff/MyScheduleManager";

export default async function MySchedulePage() {
  const { user, role } = await requireStaff(["doctor"]);
  if (role !== "doctor") redirect("/staff/dashboard");

  const supabase = await createClient();

  const [{ data: doctor }, { data: schedules }] = await Promise.all([
    supabase.from("doctors").select("specialty, photo_url, profiles(full_name)").eq("id", user.id).single(),
    supabase
      .from("doctor_schedules")
      .select("id, day_of_week, start_time, end_time, slot_duration_minutes")
      .eq("doctor_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const doctorRow = doctor as unknown as { specialty: string; photo_url: string | null; profiles: { full_name: string | null } | null } | null;

  return (
    <div className="min-h-screen p-7">
      <h1 className="mb-5 text-[28px] font-bold tracking-[-0.03em] text-ink">My schedule</h1>
      <MyScheduleManager
        doctorId={user.id}
        fullName={doctorRow?.profiles?.full_name ?? "Doctor"}
        specialty={doctorRow?.specialty ?? ""}
        photoUrl={doctorRow?.photo_url ?? null}
        initialSchedules={schedules ?? []}
      />
    </div>
  );
}

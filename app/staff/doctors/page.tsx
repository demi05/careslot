import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DoctorScheduleManager, type DoctorListItem } from "@/components/staff/DoctorScheduleManager";

export default async function StaffDoctorsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = createClient();

  const { data } = await supabase.from("doctors").select("id, specialty, profiles(full_name)").order("id");

  const doctorRows = (data ?? []) as unknown as {
    id: string;
    specialty: string;
    profiles: { full_name: string | null } | null;
  }[];

  const doctors: DoctorListItem[] = doctorRows.map((d) => ({
    id: d.id,
    specialty: d.specialty,
    full_name: d.profiles?.full_name ?? null,
  }));

  return (
    <div className="max-w-6xl p-8">
      <h1 className="mb-5 text-2xl font-bold text-ink">Doctors and schedules</h1>
      <DoctorScheduleManager doctors={doctors} />
    </div>
  );
}

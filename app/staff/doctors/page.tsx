import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DoctorScheduleManager, type DoctorListItem } from "@/components/staff/DoctorScheduleManager";

export default async function StaffDoctorsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("doctors")
    .select("id, specialty, photo_url, is_active, profiles(full_name)")
    .order("id");

  const doctorRows = (data ?? []) as unknown as {
    id: string;
    specialty: string;
    photo_url: string | null;
    is_active: boolean;
    profiles: { full_name: string | null } | null;
  }[];

  const doctors: DoctorListItem[] = doctorRows.map((d) => ({
    id: d.id,
    specialty: d.specialty,
    photo_url: d.photo_url,
    is_active: d.is_active,
    full_name: d.profiles?.full_name ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col gap-5 p-7">
      <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">Doctors</h1>
      <DoctorScheduleManager doctors={doctors} />
    </div>
  );
}

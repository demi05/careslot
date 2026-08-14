import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StaffSettingsManager,
  type StaffMemberItem,
  type DoctorSettingsItem,
} from "@/components/staff/StaffSettingsManager";

export default async function StaffSettingsPage() {
  await requireStaff(["admin"]);
  const supabase = createClient();

  const [{ data: staffData }, { data: doctorsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["front-desk", "admin"])
      .order("full_name"),
    supabase.from("doctors").select("id, specialty, is_active, profiles(full_name)").order("id"),
  ]);

  const doctorRows = (doctorsData ?? []) as unknown as {
    id: string;
    specialty: string;
    is_active: boolean;
    profiles: { full_name: string | null } | null;
  }[];

  const doctors: DoctorSettingsItem[] = doctorRows.map((d) => ({
    id: d.id,
    specialty: d.specialty,
    is_active: d.is_active,
    full_name: d.profiles?.full_name ?? null,
  }));

  return (
    <div className="max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-bold text-ink">Settings</h1>
      <p className="mb-6 text-[15px] text-muted">Manage staff accounts and doctor availability.</p>
      <StaffSettingsManager staffMembers={(staffData ?? []) as StaffMemberItem[]} doctors={doctors} />
    </div>
  );
}

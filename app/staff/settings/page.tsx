import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StaffSettingsManager,
  type StaffMemberItem,
  type DoctorSettingsItem,
  type RosterEntryItem,
} from "@/components/staff/StaffSettingsManager";

export default async function StaffSettingsPage() {
  await requireStaff(["admin"]);
  const supabase = await createClient();

  const [{ data: staffData }, { data: doctorsData }, { data: rosterData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["front-desk", "admin"])
      .order("full_name"),
    supabase.from("doctors").select("id, specialty, is_active, profiles(full_name)").order("id"),
    supabase
      .from("staff_roster")
      .select("id, email, full_name, role, specialty, claimed")
      .order("created_at", { ascending: false }),
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
    <div className="flex min-h-screen flex-col gap-5 p-7">
      <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink">Settings</h1>
      <StaffSettingsManager
        staffMembers={(staffData ?? []) as StaffMemberItem[]}
        doctors={doctors}
        roster={(rosterData ?? []) as RosterEntryItem[]}
      />
    </div>
  );
}

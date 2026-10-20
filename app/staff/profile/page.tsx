import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StaffProfileForm } from "@/components/staff/StaffProfileForm";

export default async function StaffProfilePage() {
  const { user, role } = await requireStaff();
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();

  const { data: doctor } =
    role === "doctor"
      ? await supabase.from("doctors").select("specialty, bio, photo_url").eq("id", user.id).single()
      : { data: null };

  return (
    <div className="min-h-screen p-7">
      <h1 className="mb-5 text-[28px] font-bold tracking-[-0.03em] text-ink">My profile</h1>
      <StaffProfileForm
        userId={user.id}
        email={user.email ?? ""}
        role={role}
        initialFullName={profile?.full_name ?? ""}
        initialPhone={profile?.phone ?? ""}
        initialSpecialty={doctor?.specialty ?? null}
        initialBio={doctor?.bio ?? ""}
        initialPhotoUrl={doctor?.photo_url ?? null}
      />
    </div>
  );
}

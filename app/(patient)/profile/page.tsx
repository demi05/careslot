import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientSimpleHeader } from "@/components/patient/PatientSimpleHeader";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { ProfileForm } from "@/components/patient/ProfileForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, sms_reminders, email_reminders, created_at")
    .eq("id", user.id)
    .single();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "recently";

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientSimpleHeader title="Profile" />

      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-7">
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initialFullName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
          initialSmsReminders={profile?.sms_reminders ?? true}
          initialEmailReminders={profile?.email_reminders ?? true}
          memberSince={memberSince}
        />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

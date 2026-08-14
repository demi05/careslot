import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientSimpleHeader } from "@/components/patient/PatientSimpleHeader";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { NotificationsList, type NotificationRow } from "@/components/patient/NotificationsList";

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, channel, delivery_status, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up">
      <PatientSimpleHeader title="Notifications" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-5">
        <NotificationsList initialNotifications={(data ?? []) as NotificationRow[]} />
      </div>

      <PatientBottomTabs />
    </div>
  );
}

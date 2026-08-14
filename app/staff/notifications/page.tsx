import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationLogTable, type NotificationLogRow } from "@/components/staff/NotificationLogTable";

export default async function StaffNotificationsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = createClient();

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, channel, delivery_status, sent_at, created_at, appointments(appointment_date, patient:profiles!appointments_patient_id_fkey(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-5 text-2xl font-bold text-ink">Notification log</h1>
      <NotificationLogTable initialNotifications={(data ?? []) as unknown as NotificationLogRow[]} />
    </div>
  );
}

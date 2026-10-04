import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationLogTable, type NotificationLogRow } from "@/components/staff/NotificationLogTable";

export default async function StaffNotificationsPage() {
  await requireStaff(["front-desk", "admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, channel, recipient, delivery_status, sent_at, created_at, appointments(appointment_date, patient:profiles!appointments_patient_id_fkey(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen p-7">
      <NotificationLogTable initialNotifications={(data ?? []) as unknown as NotificationLogRow[]} />
    </div>
  );
}

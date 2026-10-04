import { CalendarCheck, CheckCircle, Clock, UserMinus, EnvelopeSimple, ChatText } from "@phosphor-icons/react/dist/ssr";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/staff/StatCard";
import { StaffLiveAppointmentList, type StaffAppointmentRow } from "@/components/staff/StaffLiveAppointmentList";

export default async function StaffDashboardPage() {
  const { role, fullName } = await requireStaff();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;

  const [{ data }, { count: emailCount }, { count: smsCount }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, appointment_time, status, patient:profiles!appointments_patient_id_fkey(full_name), doctors(specialty, profiles(full_name))"
      )
      .eq("appointment_date", today)
      .neq("status", "cancelled")
      .order("appointment_time", { ascending: true }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .eq("delivery_status", "sent")
      .gte("sent_at", startOfDay),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("channel", "sms")
      .eq("delivery_status", "sent")
      .gte("sent_at", startOfDay),
  ]);

  const appointments = (data ?? []) as unknown as StaffAppointmentRow[];
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const noShowCount = appointments.filter((a) => a.status === "no-show").length;
  const firstName = (fullName ?? "there").split(" ")[0];

  const formattedDate = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative flex min-h-screen flex-col gap-5 overflow-hidden p-7">
      <div className="absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-[#E1EEEB] to-background" />

      <div className="relative flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">{formattedDate}</span>
          <span className="text-[28px] font-bold tracking-[-0.03em] text-ink">
            {role === "doctor" ? `Good day, ${firstName}` : "Today's clinic activity"}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={appointments.length}
          note={`${pendingCount} awaiting confirmation`}
          variant="featured"
        />
        <StatCard label="Confirmed" icon={<CheckCircle size={16} className="text-success" />} value={confirmedCount} />
        <StatCard label="Pending" icon={<Clock size={16} className="text-warning" />} value={pendingCount} />
        <StatCard label="No-shows" icon={<UserMinus size={16} />} value={noShowCount} variant="danger" />
      </div>

      <div className="relative grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="flex min-h-0 flex-col gap-3 rounded-[30px] bg-surface p-5 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-ink">
              {role === "doctor" ? "Your patients today" : "Live appointment list"}
            </span>
          </div>
          <StaffLiveAppointmentList initialAppointments={appointments} today={today} canEdit={role !== "doctor"} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-[28px] border border-primary-tint bg-primary-tint p-4 text-primary-dark">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} />
              <span className="text-sm font-bold">{appointments.length} booked today</span>
            </div>
            <p className="text-xs text-[#2E6F63]">
              {confirmedCount} confirmed, {pendingCount} still pending confirmation.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[26px] bg-surface p-4 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
            <span className="text-sm font-bold text-ink">Reminders sent today</span>
            <div className="flex gap-2.5">
              <div className="flex flex-1 items-center gap-2.5 rounded-[18px] bg-primary-tint p-3">
                <EnvelopeSimple size={18} className="text-primary" />
                <span className="text-xl font-bold text-ink">{emailCount ?? 0}</span>
              </div>
              <div className="flex flex-1 items-center gap-2.5 rounded-[18px] bg-accent-tint p-3">
                <ChatText size={18} className="text-accent-dark" />
                <span className="text-xl font-bold text-ink">{smsCount ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

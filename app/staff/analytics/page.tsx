import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface AppointmentAnalyticsRow {
  appointment_date: string;
  status: "pending" | "confirmed" | "cancelled" | "no-show";
  doctor_id: string;
  patient: { full_name: string | null } | null;
  doctors: { profiles: { full_name: string | null } | null } | null;
}

const RANGE_OPTIONS = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "12 weeks", days: 90 },
  { key: "365", label: "Year", days: 365 },
];

const dayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StaffAnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireStaff(["admin"]);
  const supabase = await createClient();

  const selectedRange = RANGE_OPTIONS.find((r) => r.key === searchParams.range) ?? RANGE_OPTIONS[1];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - selectedRange.days);
  const startISO = startDate.toISOString().slice(0, 10);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - selectedRange.days);
  const prevStartISO = prevStartDate.toISOString().slice(0, 10);

  const [{ data }, { count: prevCount }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "appointment_date, status, doctor_id, patient:profiles!appointments_patient_id_fkey(full_name), doctors(profiles(full_name))"
      )
      .gte("appointment_date", startISO)
      .order("appointment_date", { ascending: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("appointment_date", prevStartISO)
      .lt("appointment_date", startISO),
  ]);

  const appointments = (data ?? []) as unknown as AppointmentAnalyticsRow[];
  const total = appointments.length;
  const vsPrevious = prevCount && prevCount > 0 ? Math.round(((total - prevCount) / prevCount) * 100) : null;

  const noShowCount = appointments.filter((a) => a.status === "no-show").length;
  const noShowRate = total > 0 ? Math.round((noShowCount / total) * 1000) / 10 : 0;

  const useDaily = selectedRange.days <= 30;
  const buckets = new Map<string, number>();
  appointments.forEach((a) => {
    const key = useDaily ? a.appointment_date : a.appointment_date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  const bucketEntries = Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-12);
  const maxBucketCount = Math.max(1, ...bucketEntries.map(([, c]) => c));

  const dayAttended = new Array(7).fill(0);
  const dayNoShow = new Array(7).fill(0);
  appointments.forEach((a) => {
    const dow = new Date(`${a.appointment_date}T00:00:00`).getDay();
    if (a.status === "no-show") dayNoShow[dow]++;
    else if (a.status !== "cancelled") dayAttended[dow]++;
  });
  const maxDayTotal = Math.max(1, ...dayAttended.map((v, i) => v + dayNoShow[i]));

  const doctorNoShows = new Map<string, number>();
  appointments
    .filter((a) => a.status === "no-show")
    .forEach((a) => {
      const name = a.doctors?.profiles?.full_name ?? "Unknown";
      doctorNoShows.set(name, (doctorNoShows.get(name) ?? 0) + 1);
    });
  const topDoctorNoShows = Array.from(doctorNoShows.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxDoctorNoShow = Math.max(1, ...topDoctorNoShows.map(([, c]) => c));

  return (
    <div className="flex min-h-screen flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[28px] font-bold tracking-[-0.03em] text-ink">Analytics</span>
          <span className="text-[13px] text-muted">
            Last {selectedRange.label.toLowerCase()}, all clinics
          </span>
        </div>
        <div className="flex gap-1 rounded-full bg-surface p-1 shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={`/staff/analytics?range=${r.key}`}
              className={`flex h-9 items-center rounded-full px-4 text-[13px] font-bold ${
                r.key === selectedRange.key ? "bg-primary-dark text-white" : "text-muted"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.9fr_1fr]">
        <div className="rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <div className="mb-3.5 flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-muted">Appointment volume</span>
              <span className="text-[34px] font-bold tracking-[-0.03em] text-ink">{total.toLocaleString()}</span>
            </div>
            {vsPrevious !== null && (
              <span
                className={`rounded-full px-2.5 py-1.5 text-xs font-bold ${
                  vsPrevious >= 0 ? "bg-[#E3F5EA] text-[#137A3A]" : "bg-[#FDE8E8] text-[#B91C1C]"
                }`}
              >
                {vsPrevious >= 0 ? "+" : ""}
                {vsPrevious}% vs previous
              </span>
            )}
          </div>
          {bucketEntries.length === 0 ? (
            <p className="text-sm text-muted">No appointments in this period yet.</p>
          ) : (
            <div className="flex h-[190px] items-end gap-3 pt-2.5">
              {bucketEntries.map(([key, count]) => (
                <div key={key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-primary">{count}</span>
                  <div
                    className="w-full rounded-t-xl rounded-b-[6px] bg-primary"
                    style={{ height: `${Math.max(4, (count / maxBucketCount) * 100)}%` }}
                  />
                  <span className="text-[10px] text-muted">{key.slice(-2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex flex-col items-center gap-3.5 overflow-hidden rounded-[30px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
          <span className="self-start text-[13px] text-[#BFD9D3]">No-show rate</span>
          <div
            className="flex h-[180px] w-[180px] items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#E07B39 0deg ${noShowRate * 3.6}deg, rgba(255,255,255,0.14) ${noShowRate * 3.6}deg 360deg)`,
            }}
          >
            <div className="flex h-[140px] w-[140px] flex-col items-center justify-center gap-0.5 rounded-full bg-[#164D45]">
              <span className="text-4xl font-bold leading-none tracking-[-0.04em]">{noShowRate}%</span>
              <span className="text-[11px] text-[#BFD9D3]">{noShowCount} missed</span>
            </div>
          </div>
          <span className="text-center text-xs leading-relaxed text-[#BFD9D3]">
            Of {total.toLocaleString()} appointments in this period
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-ink">Attendance by day</span>
            <div className="flex gap-3.5 text-[11px] text-[#4F5F5B]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />
                Attended
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
                No-show
              </span>
            </div>
          </div>
          <div className="flex h-[130px] items-end gap-4">
            {dayAbbrev.map((label, i) => {
              const attended = dayAttended[i];
              const noShow = dayNoShow[i];
              const dayTotal = attended + noShow;
              const barHeight = Math.max(4, (dayTotal / maxDayTotal) * 100);
              const noShowShare = dayTotal > 0 ? (noShow / dayTotal) * 100 : 0;
              return (
                <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex w-full max-w-[46px] flex-col gap-[3px]" style={{ height: `${barHeight}%` }}>
                    <div className="rounded-t-[10px] bg-accent" style={{ height: `${noShowShare}%` }} />
                    <div className="flex-1 rounded-b-[4px] bg-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-muted">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
          <span className="mb-3.5 block text-[15px] font-bold text-ink">No-shows by doctor</span>
          {topDoctorNoShows.length === 0 ? (
            <p className="text-sm text-muted">No no-shows in this period.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topDoctorNoShows.map(([name, count]) => (
                <div key={name} className="grid grid-cols-[130px_1fr_30px] items-center gap-3">
                  <span className="truncate text-[13px] font-medium text-ink">{name}</span>
                  <div
                    className="h-3 rounded-full bg-accent"
                    style={{ width: `${Math.max(8, (count / maxDoctorNoShow) * 100)}%` }}
                  />
                  <span className="text-right text-[13px] font-bold text-ink">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

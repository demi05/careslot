import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/staff/StatCard";

interface AppointmentAnalyticsRow {
  appointment_date: string;
  status: "pending" | "confirmed" | "cancelled" | "no-show";
  doctor_id: string;
  patient: { full_name: string | null } | null;
  doctors: { profiles: { full_name: string | null } | null } | null;
}

const RANGE_OPTIONS = [
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "365", label: "This year", days: 365 },
];

const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function StaffAnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireStaff(["admin"]);
  const supabase = createClient();

  const selectedRange = RANGE_OPTIONS.find((r) => r.key === searchParams.range) ?? RANGE_OPTIONS[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - selectedRange.days);
  const startISO = startDate.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("appointments")
    .select(
      "appointment_date, status, doctor_id, patient:profiles!appointments_patient_id_fkey(full_name), doctors(profiles(full_name))"
    )
    .gte("appointment_date", startISO)
    .order("appointment_date", { ascending: true });

  const appointments = (data ?? []) as unknown as AppointmentAnalyticsRow[];
  const total = appointments.length;

  const noShowCount = appointments.filter((a) => a.status === "no-show").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const noShowRate = total > 0 ? Math.round((noShowCount / total) * 100) : 0;

  const dayCounts = new Array(7).fill(0);
  appointments.forEach((a) => {
    dayCounts[new Date(`${a.appointment_date}T00:00:00`).getDay()]++;
  });
  const busiestDay = total > 0 ? fullDayNames[dayCounts.indexOf(Math.max(...dayCounts))] : "—";

  const doctorCounts = new Map<string, { name: string; count: number }>();
  appointments.forEach((a) => {
    const name = a.doctors?.profiles?.full_name ?? "Unknown";
    const existing = doctorCounts.get(a.doctor_id);
    doctorCounts.set(a.doctor_id, { name, count: (existing?.count ?? 0) + 1 });
  });
  let mostBookedDoctor = "—";
  let maxDoctorCount = 0;
  doctorCounts.forEach((v) => {
    if (v.count > maxDoctorCount) {
      maxDoctorCount = v.count;
      mostBookedDoctor = v.name;
    }
  });

  const useDaily = selectedRange.days <= 30;
  const buckets = new Map<string, number>();
  appointments.forEach((a) => {
    const key = useDaily ? a.appointment_date : a.appointment_date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  const bucketEntries = Array.from(buckets.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  const maxBucketCount = Math.max(1, ...bucketEntries.map(([, c]) => c));

  const noShowByPatient = new Map<string, number>();
  appointments
    .filter((a) => a.status === "no-show")
    .forEach((a) => {
      const name = a.patient?.full_name ?? "Unknown";
      noShowByPatient.set(name, (noShowByPatient.get(name) ?? 0) + 1);
    });
  const topNoShow = Array.from(noShowByPatient.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const confirmedPct = pct(confirmedCount);
  const cancelledPct = pct(cancelledCount);
  const noShowPct = pct(noShowCount);
  const pendingPct = Math.max(0, 100 - confirmedPct - cancelledPct - noShowPct);

  const seg2 = confirmedPct + cancelledPct;
  const seg3 = seg2 + noShowPct;
  const conicGradient = `conic-gradient(#1E7A46 0% ${confirmedPct}%, #B23A2E ${confirmedPct}% ${seg2}%, #9CA3AF ${seg2}% ${seg3}%, #D1D5DB ${seg3}% 100%)`;

  return (
    <div className="max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Analytics</h1>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={`/staff/analytics?range=${r.key}`}
              className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                r.key === selectedRange.key
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-ink hover:bg-background"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Appointments this period" value={total} />
        <StatCard label="No-show rate" value={`${noShowRate}%`} valueClassName="text-danger" />
        <StatCard label="Busiest day" value={busiestDay} />
        <StatCard label="Most booked doctor" value={mostBookedDoctor} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-[15px] font-bold text-ink">
            Appointment volume, {selectedRange.label.toLowerCase()}
          </h2>
          {bucketEntries.length === 0 ? (
            <p className="text-sm text-muted">No appointments in this period yet.</p>
          ) : (
            <div className="flex h-36 items-end gap-1">
              {bucketEntries.map(([key, count]) => (
                <div
                  key={key}
                  title={`${key}: ${count}`}
                  className="flex-1 rounded-t bg-primary"
                  style={{ height: `${Math.max(4, (count / maxBucketCount) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 self-start text-[15px] font-bold text-ink">Status breakdown</h2>
          {total === 0 ? (
            <p className="text-sm text-muted">No data yet.</p>
          ) : (
            <>
              <div
                className="flex h-[150px] w-[150px] items-center justify-center rounded-full"
                style={{ background: conicGradient }}
              >
                <div className="h-[88px] w-[88px] rounded-full bg-surface" />
              </div>
              <div className="mt-4 flex w-full flex-col gap-1.5 text-[13px]">
                <LegendRow color="#1E7A46" label="Confirmed" pct={confirmedPct} />
                <LegendRow color="#B23A2E" label="Cancelled" pct={cancelledPct} />
                <LegendRow color="#9CA3AF" label="No-show" pct={noShowPct} />
                <LegendRow color="#D1D5DB" label="Pending" pct={pendingPct} />
              </div>
            </>
          )}
        </div>
      </div>

      <h2 className="mb-3.5 text-[17px] font-bold text-ink">Top no-show patients</h2>
      {topNoShow.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No no-shows in this period.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {topNoShow.map(([name, count]) => (
            <div
              key={name}
              className="flex justify-between border-b border-[#F1F2F3] px-5 py-3 text-sm last:border-b-0"
            >
              <span className="font-semibold text-ink">{name}</span>
              <span className="font-bold text-danger">
                {count} no-show{count > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label} {pct}%
    </div>
  );
}

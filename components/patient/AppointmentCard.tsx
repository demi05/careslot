import { Clock } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, type Status } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/format";

export interface AppointmentCardData {
  id: string;
  doctorName: string | null;
  specialty: string | null;
  date: string;
  time: string;
  status: Status;
  featured?: boolean;
}

export function AppointmentCard({ doctorName, specialty, date, time, status, featured }: AppointmentCardData) {
  if (featured) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-[0_20px_40px_rgba(18,64,57,0.22)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            Next appointment
          </span>
          <StatusBadge status={status} />
        </div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold">
            {doctorName ? doctorName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{doctorName ?? "Doctor to be assigned"}</div>
            <div className="truncate text-sm text-white/75">{specialty ?? ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
          <Clock size={16} />
          {formatDate(date)} at {formatTime(time)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(26,92,82,0.09)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
            {doctorName ? doctorName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-ink">{doctorName ?? "Doctor to be assigned"}</div>
            <div className="truncate text-[13px] text-muted">{specialty ?? ""}</div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Clock size={16} />
        {formatDate(date)} at {formatTime(time)}
      </div>
    </div>
  );
}

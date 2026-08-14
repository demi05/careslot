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
}

export function AppointmentCard({ doctorName, specialty, date, time, status }: AppointmentCardData) {
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

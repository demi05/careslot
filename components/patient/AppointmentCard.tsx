import Image from "next/image";
import { Clock, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, type Status } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/format";

export interface AppointmentCardData {
  id: string;
  doctorName: string | null;
  specialty: string | null;
  date: string;
  time: string;
  status: Status;
  doctorPhotoUrl?: string | null;
  featured?: boolean;
}

function Avatar({ name, photoUrl, size, rounded }: { name: string | null; photoUrl?: string | null; size: number; rounded: string }) {
  if (photoUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${rounded}`} style={{ width: size, height: size }}>
        <Image src={photoUrl} alt={name ?? "Doctor"} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-primary-tint text-sm font-bold text-primary ${rounded}`}
      style={{ width: size, height: size }}
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  );
}

export function AppointmentCard({ doctorName, specialty, date, time, status, doctorPhotoUrl, featured }: AppointmentCardData) {
  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-[32px] bg-primary shadow-[0_24px_40px_-22px_rgba(26,92,82,0.7)]">
        {doctorPhotoUrl && (
          <div className="absolute right-0 top-0 h-[180px] w-[55%]">
            <Image
              src={doctorPhotoUrl}
              alt={doctorName ?? "Doctor"}
              fill
              className="object-cover [mask-image:linear-gradient(90deg,transparent_0%,#000_40%)]"
            />
          </div>
        )}
        <div className="relative flex flex-col gap-1.5 p-5">
          <StatusBadge status={status} />
          <span className="mt-1 text-xl font-bold leading-tight tracking-[-0.02em] text-white">
            {doctorName ?? "Doctor to be assigned"}
          </span>
          <span className="text-[13px] text-[#BFD9D3]">{specialty ?? ""}</span>
        </div>
        <div className="relative m-2.5 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 text-white">
            <span className="flex items-center gap-1.5 text-[13px]">
              <Clock size={15} />
              {formatDate(date)}, {formatTime(time)}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-bold text-ink">
              <ArrowsClockwise size={14} />
              Reschedule
            </span>
            <span className="flex h-10 flex-1 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-white">
              Details
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[26px] bg-surface p-3.5 shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)] transition-all duration-150 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <Avatar name={doctorName} photoUrl={doctorPhotoUrl} size={42} rounded="rounded-full" />
        <StatusBadge status={status} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-ink">{doctorName ?? "Doctor to be assigned"}</span>
        <span className="truncate text-[11px] text-muted">{specialty ?? ""}</span>
      </div>
      <span className="text-xs font-semibold text-primary">
        {formatDate(date)}, {formatTime(time)}
      </span>
    </div>
  );
}

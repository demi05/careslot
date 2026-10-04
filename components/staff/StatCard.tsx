import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  icon?: ReactNode;
  value: string | number;
  note?: string;
  variant?: "default" | "featured" | "danger";
}

export function StatCard({ label, icon, value, note, variant = "default" }: StatCardProps) {
  if (variant === "featured") {
    return (
      <div className="flex flex-col justify-between gap-3.5 rounded-[28px] bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
        <span className="text-[13px] text-[#BFD9D3]">{label}</span>
        <div className="flex flex-col gap-1">
          <span className="text-5xl font-bold leading-none tracking-[-0.04em]">{value}</span>
          {note && <span className="text-xs text-[#BFD9D3]">{note}</span>}
        </div>
      </div>
    );
  }

  if (variant === "danger") {
    return (
      <div className="flex flex-col justify-between gap-2 rounded-[28px] bg-[#FDE8E8] p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#8A2A2A]">{label}</span>
          {icon && <span className="text-danger">{icon}</span>}
        </div>
        <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-[#B91C1C]">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-2 rounded-[28px] bg-surface p-5 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted">{label}</span>
        {icon}
      </div>
      <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</span>
    </div>
  );
}

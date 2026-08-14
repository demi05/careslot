import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  icon?: ReactNode;
  value: string | number;
  valueClassName?: string;
}

export function StatCard({ label, icon, value, valueClassName }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-muted">
        {icon}
        {label}
      </div>
      <div className={`text-[28px] font-extrabold text-ink ${valueClassName ?? ""}`}>{value}</div>
    </div>
  );
}

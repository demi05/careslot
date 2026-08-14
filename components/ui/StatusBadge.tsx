export type Status = "confirmed" | "pending" | "cancelled" | "no-show" | "past" | "collected" | "failed";

const statusStyles: Record<Status, string> = {
  confirmed: "bg-success-tint text-success",
  collected: "bg-success-tint text-success",
  pending: "bg-warning-tint text-warning",
  cancelled: "bg-danger-tint text-danger",
  "no-show": "bg-danger-tint text-danger",
  failed: "bg-danger-tint text-danger",
  past: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<Status, string> = {
  confirmed: "Confirmed",
  collected: "Collected",
  pending: "Pending",
  cancelled: "Cancelled",
  "no-show": "No-show",
  failed: "Failed",
  past: "Past",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

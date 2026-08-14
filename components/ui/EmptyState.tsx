import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}

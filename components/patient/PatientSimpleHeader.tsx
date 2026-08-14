import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

interface PatientSimpleHeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PatientSimpleHeader({ title, backHref = "/dashboard", action }: PatientSimpleHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:bg-background"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-[17px] font-bold text-ink">{title}</span>
      </div>
      {action}
    </div>
  );
}
